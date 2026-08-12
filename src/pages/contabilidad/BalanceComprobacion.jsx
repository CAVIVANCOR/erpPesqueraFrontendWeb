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
import { Menu } from "primereact/menu";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getBalanceComprobacion, exportarSUNATBalance } from "../../api/contabilidad/balanceComprobacion";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getTiposLibroContableSunat } from "../../api/contabilidad/tipoLibroContableSunat";
import { getMonedas } from "../../api/moneda";
import { formatearFecha, formatearNumero } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";
import { generarBalanceComprobacionExcel } from "../../components/contabilidad/reports/generarBalanceComprobacionExcel";
import { generarBalanceComprobacionPDF } from "../../components/contabilidad/reports/generarBalanceComprobacionPDF";

const BalanceComprobacion = ({ ruta }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  const toast = useRef(null);
  const menuExport = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [tiposLibro, setTiposLibro] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  const [empresaIdSelector, setEmpresaIdSelector] = useState(usuario?.empresaId || null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [filtroEsGerencial, setFiltroEsGerencial] = useState(false);
  const [tipoLibroIdFiltro, setTipoLibroIdFiltro] = useState(null);
  const [monedaIdFiltro, setMonedaIdFiltro] = useState(null);
  const [nivelDetalle, setNivelDetalle] = useState(6);
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS');
  const [buscarCuenta, setBuscarCuenta] = useState('');

  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [expandedRows, setExpandedRows] = useState({});

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
    diferencia: 0,
    estaCuadrado: false,
    totalActivoDeudor: 0,
    totalPasivoPatrimonioAcreedor: 0,
    diferenciaBalanceGeneral: 0,
    totalPerdidaDeudor: 0,
    totalGananciaAcreedor: 0,
    diferenciaGyP: 0,
  });

  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];
    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);

  const tiposLibroOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const idsUnicos = [...new Set(
      cuentas
        .map(c => c.tipoLibroId)
        .filter(id => id !== null && id !== undefined)
        .map(id => Number(id))
    )];
    return tiposLibro.filter(tl => idsUnicos.includes(Number(tl.id)));
  }, [cuentas, tiposLibro]);

  const monedasOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const idsUnicos = [...new Set(cuentas.map(c => c.monedaId).filter(Boolean))];
    return monedas.filter(m => idsUnicos.includes(m.id));
  }, [cuentas, monedas]);

  const cuentasFiltradas = useMemo(() => {
    let resultado = [...cuentas];

    if (buscarCuenta && buscarCuenta.trim() !== '') {
      const searchTerm = buscarCuenta.trim();
      const searchTermLower = searchTerm.toLowerCase();
      const esNumerico = /^[\d.]+$/.test(searchTerm);

      resultado = resultado.filter((cuenta) => {
        const codigo = String(cuenta.codigoCuenta || '').toLowerCase();
        const nombre = String(cuenta.nombreCuenta || '').toLowerCase();

        if (esNumerico) {
          return codigo.startsWith(searchTermLower);
        } else {
          return nombre.includes(searchTermLower);
        }
      });
    }

    return resultado;
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
    filtroEsGerencial,
    tipoLibroIdFiltro,
    monedaIdFiltro,
    nivelDetalle,
    filtroSaldoInicial,
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
      const [empresasData, periodosData, tiposLibroData, monedasData] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
        getTiposLibroContableSunat(),
        getMonedas(),
      ]);

      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setTiposLibro(tiposLibroData);
      setMonedas(monedasData);
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
        esGerencial: filtroEsGerencial,
        nivelDetalle: nivelDetalle,
        tipoLibroId: tipoLibroIdFiltro,
        monedaId: monedaIdFiltro,
      };

      if (rangoFechas?.[0]) params.fechaDesde = rangoFechas[0];
      if (rangoFechas?.[1]) params.fechaHasta = rangoFechas[1];
      if (filtroSaldoInicial === 'SOLO_SALDOS') {
        params.soloSaldosIniciales = true;
      } else if (filtroSaldoInicial === 'SIN_SALDOS') {
        params.sinSaldosIniciales = true;
      }

      const response = await getBalanceComprobacion(params);

      setCuentas(response.cuentas || []);
      setTotales(response.totales || {
        totalDebe: 0,
        totalHaber: 0,
        diferencia: 0,
        estaCuadrado: false,
        totalActivoDeudor: 0,
        totalPasivoPatrimonioAcreedor: 0,
        diferenciaBalanceGeneral: 0,
        totalPerdidaDeudor: 0,
        totalGananciaAcreedor: 0,
        diferenciaGyP: 0,
      });
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

  const toggleFiltroSaldoInicial = () => {
    if (filtroSaldoInicial === 'TODOS') {
      setFiltroSaldoInicial('SOLO_SALDOS');
    } else if (filtroSaldoInicial === 'SOLO_SALDOS') {
      setFiltroSaldoInicial('SIN_SALDOS');
    } else {
      setFiltroSaldoInicial('TODOS');
    }
  };

  const getSaldoInicialButtonConfig = () => {
    switch (filtroSaldoInicial) {
      case 'SOLO_SALDOS':
        return { label: '✅ Solo Saldos Iniciales', severity: 'success' };
      case 'SIN_SALDOS':
        return { label: '❌ Sin Saldos Iniciales', severity: 'danger' };
      default:
        return { label: '📊 Todos los Movimientos', severity: 'secondary' };
    }
  };

  const limpiarFiltros = () => {
    setEmpresaIdSelector(usuario?.empresaId || null);
    setPeriodoSeleccionado(null);
    setRangoFechas(null);
    setFiltroEsGerencial(false);
    setTipoLibroIdFiltro(null);
    setMonedaIdFiltro(null);
    setNivelDetalle(6);
    setFiltroSaldoInicial('TODOS');
    setBuscarCuenta('');
    setCuentas([]);
  };

  const handleExportar = async (tipo) => {
    if (!empresaIdSelector || !periodoSeleccionado) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar Empresa y Periodo",
        life: 3000,
      });
      return;
    }

    try {
      const params = {
        empresaId: empresaIdSelector,
        periodoContableId: periodoSeleccionado,
        esGerencial: filtroEsGerencial,
        nivelDetalle: nivelDetalle,
        tipoLibroId: tipoLibroIdFiltro,
        monedaId: monedaIdFiltro,
      };

      if (rangoFechas?.[0]) params.fechaDesde = rangoFechas[0];
      if (rangoFechas?.[1]) params.fechaHasta = rangoFechas[1];
      if (filtroSaldoInicial === 'SOLO_SALDOS') {
        params.soloSaldosIniciales = true;
      } else if (filtroSaldoInicial === 'SIN_SALDOS') {
        params.sinSaldosIniciales = true;
      }

      let blob;
      let filename;

      if (tipo === 'sunat') {
        blob = await exportarSUNATBalance(params);
        const empresa = empresas.find(e => Number(e.id) === Number(empresaIdSelector));
        const periodo = periodos.find(p => Number(p.id) === Number(periodoSeleccionado));
        const ruc = empresa?.ruc || '00000000000';
        const año = periodo?.año || periodo?.anio || new Date().getFullYear();
        const mes = String(periodo?.mes || 1).padStart(2, '0');
        filename = `LE${ruc}${año}${mes}000800001.txt`;
      } else if (tipo === 'excel' || tipo === 'pdf') {
        if (cuentasFiltradas.length === 0) {
          toast.current?.show({
            severity: "warn",
            summary: "Sin datos",
            detail: "No hay cuentas para exportar",
            life: 3000,
          });
          return;
        }
        const empresaData = empresas.find(e => Number(e.id) === Number(empresaIdSelector));
        const periodoData = periodos.find(p => Number(p.id) === Number(periodoSeleccionado));
        if (!empresaData || !periodoData) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se encontraron datos de empresa o periodo",
            life: 3000,
          });
          return;
        }
        const monedaSoles = monedas.find(m => m.id === "1" || Number(m.id) === 1);
        const monedaData = monedaSoles || { id: "1", nombreLargo: "SOLES" };

        const reportDataPrepared = {
          empresa: {
            ruc: empresaData?.ruc || "",
            razonSocial: empresaData?.razonSocial || ""
          },
          periodo: {
            nombrePeriodo: periodoData?.nombrePeriodo || ""
          },
          moneda: monedaData,
          cuentas: cuentasFiltradas,
          totales: totales
        };

        setReportData(reportDataPrepared);

        if (tipo === 'excel') {
          setShowExcelViewer(true);
        } else {
          setShowPDFViewer(true);
        }
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.current?.show({
        severity: "success",
        summary: "Exportado",
        detail: "Archivo generado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al exportar",
        life: 3000,
      });
    }
  };

  const menuExportItems = [
    {
      label: 'Formato SUNAT 08 (TXT)',
      icon: 'pi pi-file',
      command: () => handleExportar('sunat')
    },
    {
      label: 'Excel Detallado',
      icon: 'pi pi-file-excel',
      command: () => handleExportar('excel')
    },
    {
      label: 'PDF Balance Comprobación',
      icon: 'pi pi-file-pdf',
      command: () => handleExportar('pdf')
    }
  ];

  const footerGenerico = (field) => {
    const total = cuentasFiltradas.reduce((sum, c) => sum + Number(c[field] || 0), 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem', backgroundColor: '#FFFF00', padding: '0.3rem' }}>
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
        const saldoNeto = (c.saldoFinalHaber || 0) - (c.saldoFinalDebe || 0);
        return sum + saldoNeto;
      }
      return sum;
    }, 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem', backgroundColor: '#FFFF00', padding: '0.3rem' }}>
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
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem', backgroundColor: '#FFFF00', padding: '0.3rem' }}>
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
      const saldoNeto = (rowData.saldoFinalHaber || 0) - (rowData.saldoFinalDebe || 0);
      if (saldoNeto === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#F59E0B' }}>
          {saldoNeto.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const rowExpansionTemplate = (data) => {
    if (!data.movimientos || data.movimientos.length === 0) {
      return (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
          No hay movimientos para esta cuenta
        </div>
      );
    }

    return (
      <div style={{ padding: '0.5rem' }}>
        <DataTable
          value={data.movimientos}
          size="small"
          showGridlines
          style={{ fontSize: '0.7rem' }}
        >
          <Column field="fechaAsiento" header="Fecha" body={(row) => formatearFecha(row.fechaAsiento)} style={{ width: '90px' }} />
          <Column field="numeroAsiento" header="Asiento" style={{ width: '120px' }} />
          <Column field="glosa" header="Glosa" />
          <Column
            field="debe"
            header="Debe"
            body={(row) => row.debe > 0 ? formatearNumero(row.debe, 2) : '-'}
            align="right"
          />
          <Column
            field="haber"
            header="Haber"
            body={(row) => row.haber > 0 ? formatearNumero(row.haber, 2) : '-'}
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
    );
  };

  const nivelesOptions = [
    { label: '2️⃣ Clase (10, 12, 20)', value: 2 },
    { label: '3️⃣ Cuenta (101, 121)', value: 3 },
    { label: '4️⃣ Subcuenta (1011)', value: 4 },
    { label: '5️⃣ Divisionaria (10111)', value: 5 },
    { label: '6️⃣ Subdivisionaria (101110)', value: 6 }
  ];

  const buttonConfig = getSaldoInicialButtonConfig();

  return (
    <div>
      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>📊 Balance de Comprobación</h2>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap", alignItems: "end" }}>
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

          <div style={{ flex: 0.25 }}>
            <Button
              icon="pi pi-filter-slash"
              outlined
              onClick={limpiarFiltros}
              disabled={loading}
            />
          </div>

          <div style={{ flex: 1 }}>
            <Button
              label="Exportar"
              icon="pi pi-download"
              severity="success"
              onClick={(e) => menuExport.current.toggle(e)}
              disabled={!empresaIdSelector || !periodoSeleccionado}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Saldo Inicial</label>
            <Button
              label={buttonConfig.label}
              severity={buttonConfig.severity}
              onClick={toggleFiltroSaldoInicial}
              size="small"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Tipo Asiento</label>
            <BooleanToggleButton
              value={filtroEsGerencial}
              onChange={setFiltroEsGerencial}
              labelTrue="🟢 GERENCIAL"
              labelFalse="📘 FISCAL"
              severityTrue="success"
              severityFalse="info"
              size="small"
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Tipo Libro SUNAT</label>
            <Dropdown
              value={tipoLibroIdFiltro}
              options={tiposLibroOptions}
              onChange={(e) => setTipoLibroIdFiltro(e.value)}
              optionLabel="descripcion"
              optionValue="id"
              placeholder="Todos"
              style={{ width: "100%" }}
              showClear
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Moneda</label>
            <Dropdown
              value={monedaIdFiltro}
              options={monedasOptions}
              onChange={(e) => setMonedaIdFiltro(e.value)}
              optionLabel="simbolo"
              optionValue="id"
              placeholder="Todas"
              style={{ width: "100%" }}
              showClear
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
        </div>

        {!loading && cuentasFiltradas.length > 0 && (
          <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#F3F4F6', borderRadius: '4px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              <span>✅ <strong>Balance:</strong> {totales.estaCuadrado ? 'Cuadrado' : 'Descuadrado'}</span>
              <span>💰 <strong>Debe:</strong> {formatearNumero(totales.totalDebe, 2)}</span>
              <span>💸 <strong>Haber:</strong> {formatearNumero(totales.totalHaber, 2)}</span>
              <span>📋 <strong>Cuentas:</strong> {cuentas.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-around', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ backgroundColor: '#FFFF00', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                🔵 <strong>Dif. Balance General:</strong> {formatearNumero(totales.diferenciaBalanceGeneral, 2)}
              </span>
              <span style={{ backgroundColor: '#FFFF00', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                🟢 <strong>Dif. GyP:</strong> {formatearNumero(totales.diferenciaGyP, 2)}
              </span>
              {totales.diferenciaBalanceGeneral !== totales.diferenciaGyP && (
                <span style={{ color: '#EF4444', fontWeight: 'bold' }}>
                  ⚠️ Descuadre: {formatearNumero(Math.abs(totales.diferenciaBalanceGeneral - totales.diferenciaGyP), 2)}
                </span>
              )}
            </div>
          </div>
        )}

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
              scrollHeight="calc(100vh - 400px)"
              expandedRows={expandedRows}
              onRowToggle={(e) => setExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
              dataKey="codigoCuenta"
            >
              <Column expander style={{ width: '3rem' }} />
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
                header="SI Deudor"
                body={(row) => numeroTemplate(row, 'saldoInicialDebe')}
                footer={() => footerGenerico('saldoInicialDebe')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                field="saldoInicialHaber"
                header="SI Acreedor"
                body={(row) => numeroTemplate(row, 'saldoInicialHaber')}
                footer={() => footerGenerico('saldoInicialHaber')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                field="debe"
                header="Debe"
                body={(row) => numeroTemplate(row, 'debe')}
                footer={() => footerGenerico('debe')}
                align="right"
                style={{ width: '70px', padding: '0.2rem', fontWeight: 'bold' }}
              />
              <Column
                field="haber"
                header="Haber"
                body={(row) => numeroTemplate(row, 'haber')}
                footer={() => footerGenerico('haber')}
                align="right"
                style={{ width: '70px', padding: '0.2rem', fontWeight: 'bold' }}
              />
              <Column
                field="saldoFinalDebe"
                header="SF Deudor"
                body={(row) => numeroTemplate(row, 'saldoFinalDebe')}
                footer={() => footerGenerico('saldoFinalDebe')}
                align="right"
                style={{ width: '70px', padding: '0.2rem' }}
              />
              <Column
                field="saldoFinalHaber"
                header="SF Acreedor"
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
            </DataTable>
          )}
        </div>
      </div>

      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => setShowExcelViewer(false)}
        generateExcel={generarBalanceComprobacionExcel}
        data={reportData}
        fileName={`BalanceComprobacion_${empresaIdSelector}_${periodoSeleccionado}.xlsx`}
        title="Balance de Comprobación"
      />

      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => setShowPDFViewer(false)}
        generatePDF={generarBalanceComprobacionPDF}
        data={reportData}
        fileName={`BalanceComprobacion_${empresaIdSelector}_${periodoSeleccionado}.pdf`}
        title="Balance de Comprobación"
      />
    </div>
  );
};

export default BalanceComprobacion;