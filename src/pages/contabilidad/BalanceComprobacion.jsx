import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { Sidebar } from "primereact/sidebar";
import { SelectButton } from "primereact/selectbutton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
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

  const [opacity, setOpacity] = useState({ gastos: 1, ingresos: 1 });
  const [activeKey, setActiveKey] = useState(null);

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

    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BALANCE DE COMPROBACIÓN';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    const empresa = empresas.find(e => Number(e.id) === Number(empresaIdSelector));
    const periodo = periodos.find(p => Number(p.id) === Number(periodoSeleccionado));

    worksheet.mergeCells('A2:F2');
    const empresaCell = worksheet.getCell('A2');
    empresaCell.value = `Empresa: ${empresa?.razonSocial || ''}`;
    empresaCell.font = { size: 12 };
    empresaCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:F3');
    const periodoCell = worksheet.getCell('A3');
    periodoCell.value = `Período: ${periodo?.nombrePeriodo || ''}`;
    periodoCell.font = { size: 12 };
    periodoCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['Código', 'Nombre de Cuenta', 'Debe', 'Haber', 'Saldo', 'Tipo']);
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
      const tipoSaldo = cuenta.saldo >= 0 ? 'D' : 'A';
      worksheet.addRow([
        cuenta.codigoCuenta,
        cuenta.nombreCuenta,
        cuenta.debe,
        cuenta.haber,
        Math.abs(cuenta.saldo),
        tipoSaldo
      ]);
    });

    const totalRow = worksheet.addRow([
      '',
      'TOTALES',
      totales.totalDebe,
      totales.totalHaber,
      '',
      ''
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };

    worksheet.columns = [
      { key: 'codigo', width: 15 },
      { key: 'nombre', width: 50 },
      { key: 'debe', width: 18, style: { numFmt: '#,##0.00' } },
      { key: 'haber', width: 18, style: { numFmt: '#,##0.00' } },
      { key: 'saldo', width: 18, style: { numFmt: '#,##0.00' } },
      { key: 'tipo', width: 10 }
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
  const handleMouseEnter = useCallback((o) => {
    const { dataKey } = o;
    if (typeof dataKey === 'string') {
      setOpacity(prev => ({ ...prev, [dataKey]: 0.5 }));
      setActiveKey(dataKey);
    }
  }, []);

  const handleMouseLeave = useCallback((o) => {
    const { dataKey } = o;
    if (typeof dataKey === 'string') {
      setOpacity(prev => ({ ...prev, [dataKey]: 1 }));
      setActiveKey(null);
    }
  }, []);

  const codigoTemplate = (rowData) => (
    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' }}>
      {rowData.codigoCuenta}
    </span>
  );

  const nombreTemplate = (rowData) => (
    <span style={{ fontSize: '0.85rem' }}>{rowData.nombreCuenta}</span>
  );

  const montoTemplate = (rowData, field) => {
    const monto = Number(rowData[field]);
    if (monto === 0) return <span style={{ color: '#999', fontSize: '0.75rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
        {formatearNumero(monto, 2)}
      </span>
    );
  };

  const saldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldo);
    const color = saldo >= 0 ? '#22C55E' : '#EF4444';
    return (
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color }}>
        {formatearNumero(Math.abs(saldo), 2)}
      </span>
    );
  };

  const tipoSaldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldo);
    const tipo = saldo >= 0 ? 'D' : 'A';
    return (
      <Tag
        value={tipo}
        severity={saldo >= 0 ? 'info' : 'warning'}
        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
      />
    );
  };

  const accionesTemplate = (rowData) => (
    <Button
      icon="pi pi-eye"
      size="small"
      text
      onClick={() => verDetalleCuenta(rowData)}
    />
  );

const nivelesOptions = [
  { label: '2️⃣ Clase (10, 12, 20)', value: 2 },
  { label: '3️⃣ Cuenta (101, 121)', value: 3 },
  { label: '4️⃣ Subcuenta (1011)', value: 4 },
  { label: '5️⃣ Divisionaria (10111)', value: 5 },
  { label: '6️⃣ Subdivisionaria (101110)', value: 6 }
];

  const dataGastosIngresos = estadisticas?.topGastos && estadisticas?.topIngresos ? [
    { categoria: 'Gastos', monto: estadisticas.topGastos.reduce((sum, g) => sum + Number(g.monto || 0), 0) },
    { categoria: 'Ingresos', monto: estadisticas.topIngresos.reduce((sum, i) => sum + Number(i.monto || 0), 0) }
  ] : [];

  const topGastosFormateados = estadisticas?.topGastos ? estadisticas.topGastos.map(g => ({
    nombre: formatearNombre(g.nombre).substring(0, 20),
    monto: Number(g.monto || 0)
  })) : [];

  const topIngresosFormateados = estadisticas?.topIngresos ? estadisticas.topIngresos.map(i => ({
    nombre: formatearNombre(i.nombre).substring(0, 20),
    monto: Number(i.monto || 0)
  })) : [];

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
            <SelectButton
              value={nivelDetalle}
              onChange={(e) => setNivelDetalle(e.value)}
              options={nivelesOptions}
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

        {/* LAYOUT 2 COLUMNAS */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '1rem' }}>

          {/* COLUMNA IZQUIERDA - TABLA */}
          <div>
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
                rows={25}
                rowsPerPageOptions={[25, 50, 100]}
                style={{ fontSize: '0.85rem' }}
                onRowClick={(e) => verDetalleCuenta(e.data)}
                rowHover
              >
                <Column field="codigoCuenta" header="Código" body={codigoTemplate} style={{ width: '90px' }} sortable />
                <Column field="nombreCuenta" header="Cuenta" body={nombreTemplate} sortable />
                <Column header="Debe" body={(rowData) => montoTemplate(rowData, 'debe')} style={{ width: '110px' }} align="right" sortable />
                <Column header="Haber" body={(rowData) => montoTemplate(rowData, 'haber')} style={{ width: '110px' }} align="right" sortable />
                <Column header="Saldo" body={saldoTemplate} style={{ width: '110px' }} align="right" sortable />
                <Column header="T" body={tipoSaldoTemplate} style={{ width: '50px' }} align="center" />
                <Column body={accionesTemplate} style={{ width: '50px' }} />
              </DataTable>
            )}
          </div>

          {/* COLUMNA DERECHA - GRÁFICOS */}
          <div style={{ position: 'sticky', top: '1rem', height: 'fit-content' }}>

            {/* RESUMEN */}
            {!loading && cuentasFiltradas.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <Card style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>💰 Debe</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#22C55E' }}>
                      {formatearNumero(totales.totalDebe, 2)}
                    </div>
                  </Card>

                  <Card style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>💸 Haber</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#F59E0B' }}>
                      {formatearNumero(totales.totalHaber, 2)}
                    </div>
                  </Card>

                  <Card style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>⚖️ Balance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: totales.estaCuadrado ? '#22C55E' : '#EF4444' }}>
                      {formatearNumero(Math.abs(totales.diferencia), 2)} {totales.estaCuadrado ? '✅' : '❌'}
                    </div>
                  </Card>

                  <Card style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>📋 Cuentas</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3B82F6' }}>
                      {cuentasFiltradas.length}
                    </div>
                  </Card>
                </div>

                {estadisticas && dataGastosIngresos.length > 0 && (
                  <Card style={{ padding: '0.5rem', marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>💰 Gastos vs Ingresos</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={dataGastosIngresos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="categoria"
                          tick={{ fontSize: '0.7rem' }}
                          height={25}
                        />
                        <YAxis
                          tick={{ fontSize: '0.65rem' }}
                          width={60}
                          tickFormatter={(value) => formatearNumero(value, 0)}
                        />
                        <Tooltip
                          formatter={(value) => `S/ ${formatearNumero(value, 2)}`}
                          contentStyle={{ fontSize: '0.75rem' }}
                        />
                        <Bar dataKey="monto">
                          {dataGastosIngresos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.categoria === 'Gastos' ? '#EF4444' : '#22C55E'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* TOP 5 GASTOS */}
                {estadisticas && topGastosFormateados.length > 0 && (
                  <Card style={{ padding: '0.5rem', marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>🔥 Top 5 Gastos</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={topGastosFormateados} layout="vertical">
                        <XAxis
                          type="number"
                          tick={{ fontSize: '0.65rem' }}
                          tickFormatter={(value) => formatearNumero(value, 0)}
                        />
                        <YAxis
                          dataKey="nombre"
                          type="category"
                          width={120}
                          tick={{ fontSize: '0.65rem' }}
                        />
                        <Tooltip
                          formatter={(value) => `S/ ${formatearNumero(value, 2)}`}
                          contentStyle={{ fontSize: '0.75rem' }}
                        />
                        <Bar dataKey="monto" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* TOP 5 INGRESOS */}
                {estadisticas && topIngresosFormateados.length > 0 && (
                  <Card style={{ padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>💰 Top 5 Ingresos</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={topIngresosFormateados} layout="vertical">
                        <XAxis
                          type="number"
                          tick={{ fontSize: '0.65rem' }}
                          tickFormatter={(value) => formatearNumero(value, 0)}
                        />
                        <YAxis
                          dataKey="nombre"
                          type="category"
                          width={120}
                          tick={{ fontSize: '0.65rem' }}
                        />
                        <Tooltip
                          formatter={(value) => `S/ ${formatearNumero(value, 2)}`}
                          contentStyle={{ fontSize: '0.75rem' }}
                        />
                        <Bar dataKey="monto" fill="#22C55E" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </>
            )}
          </div>
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
              rows={10}
              style={{ fontSize: '0.85rem' }}
            >
              <Column field="fechaAsiento" header="Fecha" body={(row) => formatearFecha(row.fechaAsiento)} style={{ width: '90px' }} />
              <Column field="numeroAsiento" header="Asiento" style={{ width: '120px' }} />
              <Column field="glosa" header="Glosa" />
              <Column field="debe" header="Debe" body={(row) => row.debe > 0 ? formatearNumero(row.debe, 2) : '-'} align="right" />
              <Column field="haber" header="Haber" body={(row) => row.haber > 0 ? formatearNumero(row.haber, 2) : '-'} align="right" />
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