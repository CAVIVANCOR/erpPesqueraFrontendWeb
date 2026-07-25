import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Sidebar } from "primereact/sidebar";
import { SelectButton } from "primereact/selectbutton";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getBalanceComprobacion } from "../../api/contabilidad/balanceComprobacion";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { formatearFecha, formatearNumero } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import ExcelJS from 'exceljs';

const BalanceComprobacion = ({ ruta }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  const toast = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  const [empresaIdSelector, setEmpresaIdSelector] = useState(usuario?.empresaId || null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [tipoLibroFiltro, setTipoLibroFiltro] = useState('FISCAL');
  const [nivelDetalle, setNivelDetalle] = useState(2);
  const [tipoMovimiento, setTipoMovimiento] = useState('MOVIMIENTOS');
  const [buscarCuenta, setBuscarCuenta] = useState('');

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
    diferencia: 0,
    estaCuadrado: false,
  });

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];
    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);

  const cuentasFiltradas = useMemo(() => {
    if (!buscarCuenta || buscarCuenta.trim() === '') {
      return cuentas;
    }

    const searchTerm = buscarCuenta.trim();
    const searchTermLower = searchTerm.toLowerCase();
    const esNumerico = /^[\d.]+$/.test(searchTerm);

    return cuentas.filter((cuenta) => {
      const codigo = String(cuenta.codigoCuenta || '').toLowerCase();
      const nombre = String(cuenta.nombreCuenta || '').toLowerCase();

      if (esNumerico) {
        return codigo.startsWith(searchTermLower);
      } else {
        return nombre.includes(searchTermLower);
      }
    });
  }, [cuentas, buscarCuenta]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (empresaIdSelector && periodoSeleccionado) {
      cargarDatos();
    }
  }, [
    empresaIdSelector,
    periodoSeleccionado,
    rangoFechas,
    tipoLibroFiltro,
    nivelDetalle,
    tipoMovimiento,
  ]);

  useEffect(() => {
    if (periodosFiltrados.length > 0) {
      const mesActual = new Date().getMonth() + 1;
      const periodoActual = periodosFiltrados.find(p => Number(p.mes) === mesActual);
      if (periodoActual) {
        setPeriodoSeleccionado(periodoActual.id);
      } else {
        setPeriodoSeleccionado(periodosFiltrados[0].id);
      }
    } else {
      setPeriodoSeleccionado(null);
    }
  }, [periodosFiltrados]);

  const cargarCatalogos = async () => {
    try {
      const [empresasData, periodosData] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
      ]);
      setEmpresas(empresasData);
      setPeriodos(periodosData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar catálogos",
        life: 3000,
      });
    }
  };

  const cargarDatos = async () => {
    if (!empresaIdSelector || !periodoSeleccionado) return;

    setLoading(true);
    try {
      const params = {
        empresaId: empresaIdSelector,
        periodoContableId: periodoSeleccionado,
        fechaDesde: rangoFechas?.[0],
        fechaHasta: rangoFechas?.[1],
        tipoLibro: tipoLibroFiltro,
        nivelDetalle: nivelDetalle,
        tipoMovimiento: tipoMovimiento,
      };

      const response = await getBalanceComprobacion(params);
      setCuentas(response.cuentas || []);
      setTotales(response.totales || { totalDebe: 0, totalHaber: 0, diferencia: 0, estaCuadrado: false });
      setEstadisticas(response.estadisticas || null);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaIdSelector(usuario?.empresaId || null);
    setPeriodoSeleccionado(null);
    setRangoFechas(null);
    setTipoLibroFiltro('FISCAL');
    setNivelDetalle(2);
    setTipoMovimiento('MOVIMIENTOS');
    setBuscarCuenta('');
    setCuentas([]);
  };

  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Balance de Comprobación');

    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BALANCE DE COMPROBACIÓN';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    const empresa = empresas.find(e => Number(e.id) === Number(empresaIdSelector));
    const periodo = periodos.find(p => Number(p.id) === Number(periodoSeleccionado));

    worksheet.mergeCells('A2:L2');
    const empresaCell = worksheet.getCell('A2');
    empresaCell.value = `Empresa: ${empresa?.razonSocial || ''}`;
    empresaCell.font = { size: 12 };
    empresaCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A3:L3');
    const periodoCell = worksheet.getCell('A3');
    periodoCell.value = `Período: ${periodo?.nombrePeriodo || ''}`;
    periodoCell.font = { size: 12 };
    periodoCell.alignment = { horizontal: 'center' };
    worksheet.addRow([]);
    
    const headerRow = worksheet.addRow([
      'Código', 
      'Denominación', 
      'SI Debe', 
      'SI Haber', 
      'Mov Debe', 
      'Mov Haber', 
      'SF Debe', 
      'SF Haber', 
      'Activo', 
      'Pasivo+Pat', 
      'Pérdida', 
      'Ganancia'
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    cuentasFiltradas.forEach(cuenta => {
      const saldoFinalNeto = (cuenta.saldoFinalDebe || 0) - (cuenta.saldoFinalHaber || 0);
      const activo = cuenta.tipoCuenta === 'ACTIVO' ? saldoFinalNeto : 0;
      const pasivoPat = (cuenta.tipoCuenta === 'PASIVO' || cuenta.tipoCuenta === 'PATRIMONIO') ? Math.abs(saldoFinalNeto) : 0;
      const perdida = cuenta.tipoCuenta === 'GASTO' ? (cuenta.debe || 0) : 0;
      const ganancia = cuenta.tipoCuenta === 'INGRESO' ? (cuenta.haber || 0) : 0;

      worksheet.addRow([
        cuenta.codigoCuenta,
        cuenta.nombreCuenta,
        cuenta.saldoInicialDebe || 0,
        cuenta.saldoInicialHaber || 0,
        cuenta.debe || 0,
        cuenta.haber || 0,
        cuenta.saldoFinalDebe || 0,
        cuenta.saldoFinalHaber || 0,
        activo,
        pasivoPat,
        perdida,
        ganancia
      ]);
    });

    const totalSIDebe = cuentasFiltradas.reduce((sum, c) => sum + (c.saldoInicialDebe || 0), 0);
    const totalSIHaber = cuentasFiltradas.reduce((sum, c) => sum + (c.saldoInicialHaber || 0), 0);
    const totalSFDebe = cuentasFiltradas.reduce((sum, c) => sum + (c.saldoFinalDebe || 0), 0);
    const totalSFHaber = cuentasFiltradas.reduce((sum, c) => sum + (c.saldoFinalHaber || 0), 0);
    const totalActivo = cuentasFiltradas.reduce((sum, c) => {
      if (c.tipoCuenta === 'ACTIVO') {
        const saldoNeto = (c.saldoFinalDebe || 0) - (c.saldoFinalHaber || 0);
        return sum + saldoNeto;
      }
      return sum;
    }, 0);
    const totalPasivoPat = cuentasFiltradas.reduce((sum, c) => {
      if (c.tipoCuenta === 'PASIVO' || c.tipoCuenta === 'PATRIMONIO') {
        const saldoNeto = (c.saldoFinalDebe || 0) - (c.saldoFinalHaber || 0);
        return sum + Math.abs(saldoNeto);
      }
      return sum;
    }, 0);
    const totalPerdida = cuentasFiltradas.reduce((sum, c) => c.tipoCuenta === 'GASTO' ? sum + (c.debe || 0) : sum, 0);
    const totalGanancia = cuentasFiltradas.reduce((sum, c) => c.tipoCuenta === 'INGRESO' ? sum + (c.haber || 0) : sum, 0);

    const totalRow = worksheet.addRow([
      '',
      'TOTALES',
      totalSIDebe,
      totalSIHaber,
      totales.totalDebe,
      totales.totalHaber,
      totalSFDebe,
      totalSFHaber,
      totalActivo,
      totalPasivoPat,
      totalPerdida,
      totalGanancia
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };

    worksheet.columns = [
      { key: 'codigo', width: 12 },
      { key: 'nombre', width: 35 },
      { key: 'siDebe', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'siHaber', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'mvDebe', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'mvHaber', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'sfDebe', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'sfHaber', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'activo', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'pasivoPat', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'perdida', width: 12, style: { numFmt: '#,##0.00' } },
      { key: 'ganancia', width: 12, style: { numFmt: '#,##0.00' } }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Balance_Comprobacion_${periodo?.nombrePeriodo || 'Reporte'}.xlsx`;
    link.click();

    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Excel exportado correctamente",
      life: 3000,
    });
  };

  const verDetalleCuenta = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setSidebarVisible(true);
  };

  const formatearNombre = (nombre) => {
    if (!nombre) return '';
    return nombre
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Funciones para footers de totales
  const footerGenerico = (field) => {
    const total = cuentasFiltradas.reduce((sum, c) => sum + Number(c[field] || 0), 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem' }}>
        {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  const footerBalanceGeneral = (tipo) => {
    const total = cuentasFiltradas.reduce((sum, c) => {
      if (tipo === 'ACTIVO' && c.tipoCuenta === 'ACTIVO') {
        const saldoNeto = (c.saldoFinalDebe || 0) - (c.saldoFinalHaber || 0);
        return sum + saldoNeto;
      } else if (tipo === 'PASIVO_PAT' && (c.tipoCuenta === 'PASIVO' || c.tipoCuenta === 'PATRIMONIO')) {
        const saldoNeto = (c.saldoFinalDebe || 0) - (c.saldoFinalHaber || 0);
        return sum + Math.abs(saldoNeto);
      }
      return sum;
    }, 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem' }}>
        {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  const footerPyG = (tipo) => {
    const total = cuentasFiltradas.reduce((sum, c) => {
      if (tipo === 'PERDIDA' && c.tipoCuenta === 'GASTO') {
        return sum + (c.debe || 0);
      } else if (tipo === 'GANANCIA' && c.tipoCuenta === 'INGRESO') {
        return sum + (c.haber || 0);
      }
      return sum;
    }, 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem' }}>
        {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  // Funciones para footers de detalle de cuenta
  const footerDetalleDebeTotal = () => {
    if (!cuentaSeleccionada?.movimientos) return null;
    const total = cuentaSeleccionada.movimientos.reduce((sum, m) => sum + Number(m.debe || 0), 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold" }}>
        {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  const footerDetalleHaberTotal = () => {
    if (!cuentaSeleccionada?.movimientos) return null;
    const total = cuentaSeleccionada.movimientos.reduce((sum, m) => sum + Number(m.haber || 0), 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold" }}>
        {total.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  const codigoTemplate = (rowData) => (
    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 'bold' }}>
      {rowData.codigoCuenta}
    </span>
  );

  const nombreTemplate = (rowData) => (
    <span style={{ fontSize: '0.7rem' }}>{rowData.nombreCuenta}</span>
  );

  const numeroTemplate = (rowData, field) => {
    const valor = Number(rowData[field] || 0);
    if (valor === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.7rem' }}>
        {valor.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const balanceGeneralTemplate = (rowData, tipo) => {
    if (tipo === 'ACTIVO' && rowData.tipoCuenta === 'ACTIVO') {
      const saldoNeto = (rowData.saldoFinalDebe || 0) - (rowData.saldoFinalHaber || 0);
      if (saldoNeto === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#3B82F6' }}>
          {saldoNeto.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    } else if (tipo === 'PASIVO_PAT' && (rowData.tipoCuenta === 'PASIVO' || rowData.tipoCuenta === 'PATRIMONIO')) {
      const saldoNeto = (rowData.saldoFinalDebe || 0) - (rowData.saldoFinalHaber || 0);
      if (saldoNeto === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#F59E0B' }}>
          {Math.abs(saldoNeto).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }
    return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
  };

  const pygTemplate = (rowData, tipo) => {
    if (tipo === 'PERDIDA' && rowData.tipoCuenta === 'GASTO') {
      const valor = rowData.debe || 0;
      if (valor === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#EF4444' }}>
          {valor.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    } else if (tipo === 'GANANCIA' && rowData.tipoCuenta === 'INGRESO') {
      const valor = rowData.haber || 0;
      if (valor === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#22C55E' }}>
          {valor.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }
    return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
  };

  const accionesTemplate = (rowData) => (
    <Button
      icon="pi pi-eye"
      size="small"
      text
      onClick={() => verDetalleCuenta(rowData)}
      tooltip="Ver detalle"
      tooltipOptions={{ position: 'left' }}
    />
  );

  const nivelesOptions = [
    { label: '2️⃣ Clase (10, 12, 20)', value: 2 },
    { label: '3️⃣ Cuenta (101, 121)', value: 3 },
    { label: '4️⃣ Subcuenta (1011)', value: 4 },
    { label: '5️⃣ Divisionaria (10111)', value: 5 },
    { label: '6️⃣ Subdivisionaria (101110)', value: 6 }
  ];

  return (
    <div>
      <Toast ref={toast} />

      <div className="card">
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>📊 Balance de Comprobación</h2>
          <Button
            label="Excel"
            icon="pi pi-file-excel"
            severity="success"
            size="small"
            onClick={exportarExcel}
            disabled={loading || cuentasFiltradas.length === 0}
          />
        </div>

        {/* FILTROS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Empresa*</label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => setEmpresaIdSelector(id)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Periodo*</label>
            <Dropdown
              value={periodoSeleccionado}
              options={periodosFiltrados}
              onChange={(e) => setPeriodoSeleccionado(e.value)}
              optionLabel="nombrePeriodo"
              optionValue="id"
              placeholder="Seleccione"
              style={{ width: "100%" }}
              filter
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Rango Fechas</label>
            <Calendar
              value={rangoFechas}
              onChange={(e) => setRangoFechas(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              placeholder="Opcional"
              style={{ width: "100%" }}
              showIcon
              readOnlyInput
            />
          </div>

          <div style={{ flex: 0.8, minWidth: '200px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Tipo Libro</label>
            <SelectButton
              value={tipoLibroFiltro}
              onChange={(e) => setTipoLibroFiltro(e.value)}
              options={[
                { label: '📘 FISCAL', value: 'FISCAL' },
                { label: '🟢 GERENCIAL', value: 'GERENCIAL' }
              ]}
            />
          </div>

          <div style={{ flex: 0.2 }}>
            <Button
              icon="pi pi-filter-slash"
              outlined
              onClick={limpiarFiltros}
              disabled={loading}
              style={{ marginTop: '1.7rem' }}
              size="small"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap", alignItems: 'end' }}>
          <div style={{ flex: 1.2, minWidth: '320px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>📊 Nivel de Detalle</label>
            <Dropdown
              value={nivelDetalle}
              onChange={(e) => setNivelDetalle(e.value)}
              options={nivelesOptions}
              optionLabel="label"
              placeholder="Seleccione nivel"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>🔍 Buscar Cuenta</label>
            <InputText
              value={buscarCuenta}
              onChange={(e) => setBuscarCuenta(e.target.value)}
              placeholder="Código (10, 40) o Nombre (efectivo)"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 0.8, minWidth: '220px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Tipo Movimiento</label>
            <SelectButton
              value={tipoMovimiento}
              onChange={(e) => setTipoMovimiento(e.value)}
              options={[
                { label: '🔄 MOVIMIENTOS', value: 'MOVIMIENTOS' },
                { label: '🏁 SALDOS INICIALES', value: 'SALDOS_INICIALES' }
              ]}
            />
          </div>
        </div>

        {/* RESUMEN COMPACTO */}
        {!loading && cuentasFiltradas.length > 0 && (
          <div style={{ marginBottom: '0.5rem', padding: '0.3rem', backgroundColor: '#F3F4F6', borderRadius: '4px', display: 'flex', gap: '1rem', justifyContent: 'space-around', fontSize: '0.7rem' }}>
            <span>✅ <strong>Balance:</strong> {totales.estaCuadrado ? 'Cuadrado' : 'Descuadrado'}</span>
            <span>💰 <strong>Debe:</strong> {formatearNumero(totales.totalDebe, 2)}</span>
            <span>💸 <strong>Haber:</strong> {formatearNumero(totales.totalHaber, 2)}</span>
            <span>📋 <strong>Cuentas:</strong> {cuentas.length}</span>
          </div>
        )}

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
              <p style={{ fontSize: '0.9rem' }}>Cargando...</p>
            </div>
          ) : cuentasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontSize: '0.9rem' }}>
              Seleccione Empresa y Periodo
            </div>
          ) : (
            <DataTable
              value={cuentasFiltradas}
              size="small"
              showGridlines
              stripedRows
              paginator
              rows={50}
              rowsPerPageOptions={[50, 100, 150]}
              style={{ fontSize: '0.7rem' }}
              scrollable
              scrollHeight="calc(100vh - 300px)"
              onRowClick={(e) => verDetalleCuenta(e.data)}
              rowHover
            >
              <Column 
                field="codigoCuenta" 
                header="Código" 
                body={codigoTemplate} 
                style={{ width: '70px', padding: '0.2rem' }} 
                frozen
                sortable 
              />
              <Column 
                field="nombreCuenta" 
                header="Denominación" 
                body={nombreTemplate} 
                style={{ width: '180px', padding: '0.2rem' }} 
                frozen
                sortable 
              />
              <Column
                field="saldoInicialDebe"
                header="SI Debe"
                body={(row) => numeroTemplate(row, 'saldoInicialDebe')}
                footer={() => footerGenerico('saldoInicialDebe')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                field="saldoInicialHaber"
                header="SI Haber"
                body={(row) => numeroTemplate(row, 'saldoInicialHaber')}
                footer={() => footerGenerico('saldoInicialHaber')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                field="debe"
                header="Mov Debe"
                body={(row) => numeroTemplate(row, 'debe')}
                footer={() => footerGenerico('debe')}
                align="right"
                style={{ width: '70px', padding: '0.2rem', fontWeight: 'bold' }}
              />
              <Column
                field="haber"
                header="Mov Haber"
                body={(row) => numeroTemplate(row, 'haber')}
                footer={() => footerGenerico('haber')}
                align="right"
                style={{ width: '70px', padding: '0.2rem', fontWeight: 'bold' }}
              />
              <Column
                field="saldoFinalDebe"
                header="SF Debe"
                body={(row) => numeroTemplate(row, 'saldoFinalDebe')}
                footer={() => footerGenerico('saldoFinalDebe')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                field="saldoFinalHaber"
                header="SF Haber"
                body={(row) => numeroTemplate(row, 'saldoFinalHaber')}
                footer={() => footerGenerico('saldoFinalHaber')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                header="Activo"
                body={(row) => balanceGeneralTemplate(row, 'ACTIVO')}
                footer={() => footerBalanceGeneral('ACTIVO')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                header="Pasivo+Pat"
                body={(row) => balanceGeneralTemplate(row, 'PASIVO_PAT')}
                footer={() => footerBalanceGeneral('PASIVO_PAT')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                header="Pérdida"
                body={(row) => pygTemplate(row, 'PERDIDA')}
                footer={() => footerPyG('PERDIDA')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                header="Ganancia"
                body={(row) => pygTemplate(row, 'GANANCIA')}
                footer={() => footerPyG('GANANCIA')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column 
                body={accionesTemplate} 
                style={{ width: '50px', padding: '0.2rem' }} 
                frozen
                alignFrozen="right"
              />
            </DataTable>
          )}
        </div>
      </div>

      {/* SIDEBAR DETALLE */}
      <Sidebar visible={sidebarVisible} position="right" onHide={() => setSidebarVisible(false)} style={{ width: '50vw' }}>
        {cuentaSeleccionada && (
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>{cuentaSeleccionada.codigoCuenta} - {cuentaSeleccionada.nombreCuenta}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <Tag value={`Debe: S/ ${formatearNumero(cuentaSeleccionada.debe, 2)}`} severity="success" style={{ marginRight: '0.5rem', fontSize: '0.8rem' }} />
              <Tag value={`Haber: S/ ${formatearNumero(cuentaSeleccionada.haber, 2)}`} severity="warning" style={{ marginRight: '0.5rem', fontSize: '0.8rem' }} />
              <Tag value={`Saldo: S/ ${formatearNumero(Math.abs(cuentaSeleccionada.saldo), 2)}`} severity="info" style={{ fontSize: '0.8rem' }} />
            </div>

            <DataTable
              value={cuentaSeleccionada.movimientos}
              size="small"
              showGridlines
              stripedRows
              paginator
              rows={50}
              rowsPerPageOptions={[50, 100, 150]}
              style={{ fontSize: '0.85rem' }}
            >
              <Column field="fechaAsiento" header="Fecha" body={(row) => formatearFecha(row.fechaAsiento)} style={{ width: '90px' }} />
              <Column field="numeroAsiento" header="Asiento" style={{ width: '120px' }} />
              <Column field="glosa" header="Glosa" />
              <Column
                field="debe"
                header="Debe"
                body={(row) => row.debe > 0 ? formatearNumero(row.debe, 2) : '-'}
                footer={footerDetalleDebeTotal}
                align="right"
              />
              <Column
                field="haber"
                header="Haber"
                body={(row) => row.haber > 0 ? formatearNumero(row.haber, 2) : '-'}
                footer={footerDetalleHaberTotal}
                align="right"
              />
              <Column
                header="Origen"
                body={(row) => row.submoduloOrigenLinea ? (
                  <Tag value={row.submoduloOrigenLinea.ruta} severity="info" style={{ fontSize: '0.7rem' }} />
                ) : '-'}
              />
            </DataTable>
          </div>
        )}
      </Sidebar>
    </div>
  );
};

export default BalanceComprobacion;
