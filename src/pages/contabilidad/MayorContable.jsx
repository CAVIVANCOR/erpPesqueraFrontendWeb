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
import { Accordion, AccordionTab } from "primereact/accordion";
import { SelectButton } from "primereact/selectbutton";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getLineasMayorContable } from "../../api/contabilidad/mayorContable";
import { getTiposLibroContableSunat } from "../../api/contabilidad/tipoLibroContableSunat";
import { getMonedas } from "../../api/moneda";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getPlanCuentasContable } from "../../api/contabilidad/planCuentasContable";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getCentrosCosto } from "../../api/centroCosto";
import { getActivos } from "../../api/activo";
import { getSubmodulos } from "../../api/submoduloSistema";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import ColorTag from "../../components/shared/ColorTag";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";
import { exportarSUNAT61, exportarExcel, exportarPDF } from "../../api/contabilidad/mayorContable";
import { generarLibroMayorExcel } from "../../components/contabilidad/reports/generarLibroMayorExcel";
import { generarLibroMayorPDF } from "../../components/contabilidad/reports/generarLibroMayorPDF";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";

const MayorContable = ({ ruta }) => {
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
  const [estados, setEstados] = useState([]);
  const [planCuentas, setPlanCuentas] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [tiposLibro, setTiposLibro] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [activos, setActivos] = useState([]);
  const [submodulos, setSubmodulos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);

  const [empresaIdSelector, setEmpresaIdSelector] = useState(usuario?.empresaId || null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [filtroEsGerencial, setFiltroEsGerencial] = useState(false);
  const [tipoLibroIdFiltro, setTipoLibroIdFiltro] = useState(null);
  const [monedaIdFiltro, setMonedaIdFiltro] = useState(null);
  const [centroCostoIdFiltro, setCentroCostoIdFiltro] = useState(null);
  const [entidadComercialIdFiltro, setEntidadComercialIdFiltro] = useState(null);
  const [activoIdFiltro, setActivoIdFiltro] = useState(null);
  const [submoduloOrigenLineaIdFiltro, setSubmoduloOrigenLineaIdFiltro] = useState(null);
  const [tipoDocumentoOrigenIdFiltro, setTipoDocumentoOrigenIdFiltro] = useState(null);
  const [numeroDocumentoOrigenFiltro, setNumeroDocumentoOrigenFiltro] = useState('');
  const [rangoFechasDocumento, setRangoFechasDocumento] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [cuentaFiltro, setCuentaFiltro] = useState(null);
  const [numeroAsientoFiltro, setNumeroAsientoFiltro] = useState('');
  const [codigoCuentaFiltro, setCodigoCuentaFiltro] = useState('');
  const [soloCuadrados, setSoloCuadrados] = useState(false);
  const [soloDescuadrados, setSoloDescuadrados] = useState(false);
  const [soloConEntidad, setSoloConEntidad] = useState(false);
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS');
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
    saldoFinal: 0,
  });

  const [activeIndex, setActiveIndex] = useState(null);

  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];

    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);

  const centrosCostoOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(movimientos.map(l => l.centroCostoId).filter(Boolean))];
    return centrosCosto
      .filter(cc => idsUnicos.includes(cc.id))
      .map(cc => ({
        ...cc,
        displayLabel: `${cc.Codigo} - ${cc.Descripcion || cc.Nombre}`
      }));
  }, [cuentas, centrosCosto]);

  const entidadesOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(movimientos.map(l => l.entidadComercialId).filter(Boolean))];
    return entidades.filter(e => idsUnicos.includes(e.id));
  }, [cuentas, entidades]);

  const activosOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(movimientos.map(l => l.activoId).filter(Boolean))];
    return activos.filter(a => idsUnicos.includes(a.id));
  }, [cuentas, activos]);

  const submodulosOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(movimientos.map(l => l.submoduloOrigenLineaId).filter(Boolean))];
    return submodulos.filter(s => idsUnicos.includes(s.id));
  }, [cuentas, submodulos]);

  const tiposDocumentoOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(movimientos.map(l => l.tipoDocumentoOrigenId).filter(Boolean))];
    return tiposDocumento
      .filter(td => idsUnicos.includes(td.id))
      .map(td => ({
        ...td,
        displayLabel: `${td.codigo} - ${td.descripcion || 'Sin descripción'}`
      }));
  }, [cuentas, tiposDocumento]);

  const monedasOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(movimientos.map(l => l.monedaId).filter(Boolean))];
    return monedas.filter(m => idsUnicos.includes(m.id));
  }, [cuentas, monedas]);

  const tiposLibroOptions = useMemo(() => {
    if (cuentas.length === 0) return [];
    const movimientos = cuentas.flatMap(c => c.movimientos || []);
    const idsUnicos = [...new Set(
      movimientos
        .map(l => l.asientoContable?.tipoLibroId)
        .filter(id => id !== null && id !== undefined)
        .map(id => Number(id))
    )];
    return tiposLibro.filter(tl => idsUnicos.includes(Number(tl.id)));
  }, [cuentas, tiposLibro]);

  const estadosAsiento = useMemo(() => {
    return estados.filter(e => [76, 77, 78].includes(Number(e.id)));
  }, [estados]);

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
    centroCostoIdFiltro,
    entidadComercialIdFiltro,
    activoIdFiltro,
    submoduloOrigenLineaIdFiltro,
    tipoDocumentoOrigenIdFiltro,
    numeroDocumentoOrigenFiltro,
    rangoFechasDocumento,
    estadoFiltro,
    cuentaFiltro,
    numeroAsientoFiltro,
    codigoCuentaFiltro,
    soloCuadrados,
    soloDescuadrados,
    soloConEntidad,
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
      const [
        empresasData,
        periodosData,
        estadosData,
        cuentasData,
        entidadesData,
        tiposLibroData,
        monedasData,
        centrosCostoData,
        activosData,
        submodulosData,
        tiposDocumentoData,
      ] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
        getEstadosMultiFuncion(),
        getPlanCuentasContable(),
        getEntidadesComerciales(),
        getTiposLibroContableSunat(),
        getMonedas(),
        getCentrosCosto(),
        getActivos(),
        getSubmodulos(),
        getTiposDocumento(),
      ]);

      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setEstados(estadosData);
      setPlanCuentas(cuentasData);
      setEntidades(entidadesData);
      setTiposLibro(tiposLibroData);
      setMonedas(monedasData);
      setCentrosCosto(centrosCostoData);
      setActivos(activosData);
      setSubmodulos(submodulosData);
      setTiposDocumento(tiposDocumentoData);
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
        estadoAsientoId: estadoFiltro,
        numeroAsiento: numeroAsientoFiltro,
        esGerencial: filtroEsGerencial,
        tipoLibroId: tipoLibroIdFiltro,
        monedaId: monedaIdFiltro,
        centroCostoId: centroCostoIdFiltro,
        entidadComercialId: entidadComercialIdFiltro,
        activoId: activoIdFiltro,
        submoduloOrigenLineaId: submoduloOrigenLineaIdFiltro,
        tipoDocumentoOrigenId: tipoDocumentoOrigenIdFiltro,
        numeroDocumentoOrigen: numeroDocumentoOrigenFiltro,
        fechaDocumentoDesde: rangoFechasDocumento?.[0],
        fechaDocumentoHasta: rangoFechasDocumento?.[1],
        planCuentaId: cuentaFiltro,
        codigoCuentaInicia: codigoCuentaFiltro,
        soloCuadrados: soloCuadrados,
        soloDescuadrados: soloDescuadrados,
        soloConEntidad: soloConEntidad,
        soloSaldosIniciales: filtroSaldoInicial === 'SOLO_SALDOS',
      };
      const response = await getLineasMayorContable(params);

      let cuentasFiltradas = response.cuentas || [];

      if (filtroSaldoInicial === 'SIN_SALDOS') {
        cuentasFiltradas = cuentasFiltradas.map(cuenta => ({
          ...cuenta,
          movimientos: cuenta.movimientos.filter(mov => !mov.asientoContable?.esSaldoInicial)
        })).filter(cuenta => cuenta.movimientos.length > 0);
      }

      setCuentas(cuentasFiltradas);
      setTotales(response.totales || { totalDebe: 0, totalHaber: 0, saldoFinal: 0 });
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
    setFiltroEsGerencial(false);
    setTipoLibroIdFiltro(null);
    setMonedaIdFiltro(null);
    setCentroCostoIdFiltro(null);
    setEntidadComercialIdFiltro(null);
    setActivoIdFiltro(null);
    setSubmoduloOrigenLineaIdFiltro(null);
    setTipoDocumentoOrigenIdFiltro(null);
    setNumeroDocumentoOrigenFiltro('');
    setRangoFechasDocumento(null);
    setEstadoFiltro(null);
    setCuentaFiltro(null);
    setNumeroAsientoFiltro('');
    setCodigoCuentaFiltro('');
    setSoloCuadrados(false);
    setSoloDescuadrados(false);
    setSoloConEntidad(false);
    setFiltroSaldoInicial('TODOS');
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
        tipoLibroId: tipoLibroIdFiltro || null,
        monedaId: monedaIdFiltro || null,
      };

      let blob;
      let filename;

      if (tipo === 'sunat') {
        blob = await exportarSUNAT61(params);
        filename = `LE_MAYOR_${params.empresaId}_${params.periodoContableId}.txt`;
      } else if (tipo === 'excel' || tipo === 'pdf') {
        if (cuentas.length === 0) {
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
          cuentas: cuentas,
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
      label: 'Formato SUNAT 6.1 (TXT)',
      icon: 'pi pi-file',
      command: () => handleExportar('sunat')
    },
    {
      label: 'Excel Detallado',
      icon: 'pi pi-file-excel',
      command: () => handleExportar('excel')
    },
    {
      label: 'PDF Libro Mayor',
      icon: 'pi pi-file-pdf',
      command: () => handleExportar('pdf')
    }
  ];


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
        return { label: '📋 Todos los Movimientos', severity: 'secondary' };
    }
  };

  const expandirTodas = () => {
    setActiveIndex(cuentas.map((_, i) => i));
  };

  const contraerTodas = () => {
    setActiveIndex([]);
  };

  const fechaTemplate = (rowData) => (
    <span style={{ fontSize: getResponsiveFontSize() }}>{formatearFecha(rowData.asientoContable?.fechaAsiento)}</span>
  );

  const asientoTemplate = (rowData) => (
    <span style={{ fontFamily: 'monospace', fontSize: getResponsiveFontSize() }}>{rowData.asientoContable?.numeroAsiento}</span>
  );

  const entidadTemplate = (rowData) => {
    if (!rowData.entidadComercial) return null;
    return (
      <div>
        <div style={{ fontSize: getResponsiveFontSize() }}>{rowData.entidadComercial.razonSocial}</div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{rowData.entidadComercial.ruc}</div>
      </div>
    );
  };

  const montoTemplate = (rowData, field) => {
    const monto = Number(rowData[field]);
    if (monto === 0) return null;
    const moneda = rowData.moneda;
    return (
      <Tag
        value={`${moneda?.simbolo || ''} ${formatearNumero(monto, 2)}`}
        style={{ backgroundColor: moneda?.colorFondo || '#fff', color: '#000', fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const saldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldoAcumulado || 0);
    const moneda = rowData.moneda;
    const severity = saldo >= 0 ? 'success' : 'danger';
    return (
      <Tag
        value={`${moneda?.simbolo || ''} ${formatearNumero(Math.abs(saldo), 2)}`}
        severity={severity}
        style={{ fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const tipoSaldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldoAcumulado || 0);
    const tipo = saldo >= 0 ? 'Deudor' : 'Acreedor';
    const severity = saldo >= 0 ? 'info' : 'warning';
    return (
      <Tag
        value={tipo}
        severity={severity}
        style={{ fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.asientoContable?.estado;
    if (!estado) return null;

    return (
      <Tag
        value={estado.descripcion}
        severity={
          estado.descripcion === 'APROBADO' ? 'success' :
            estado.descripcion === 'PENDIENTE' ? 'warning' :
              estado.descripcion === 'ANULADO' ? 'danger' :
                'info'
        }
        style={{
          fontSize: getResponsiveFontSize(),
          backgroundColor: estado.colorFondo || undefined,
          color: estado.colorTexto || undefined
        }}
      />
    );
  };


  const tipoLibroTemplate = (rowData) => (
    <Tag
      value={rowData.asientoContable?.tipoLibro}
      severity={rowData.asientoContable?.tipoLibro === 'FISCAL' ? 'info' : 'secondary'}
      style={{ fontSize: getResponsiveFontSize() }}
    />
  );

  const saldoInicialTemplate = (rowData) => {
    if (!rowData.asientoContable?.esSaldoInicial) return null;
    return (
      <Tag
        value="SALDO INICIAL"
        severity="warning"
        style={{ fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const buttonConfig = getSaldoInicialButtonConfig();

  const totalMovimientos = cuentas.reduce((sum, c) => sum + c.movimientos.length, 0);

  return (
    <div>
      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>📗 Libro Mayor</h2>
        </div>

        {/* FILTROS */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Empresa*</label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => setEmpresaIdSelector(id)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Periodo*</label>
            <Dropdown
              value={periodoSeleccionado}
              options={periodosFiltrados}
              onChange={(e) => setPeriodoSeleccionado(e.value)}
              optionLabel="nombrePeriodo"
              optionValue="id"
              placeholder="Seleccione periodo"
              style={{ width: "100%" }}
              filter
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Rango de Fechas</label>
            <Calendar
              value={rangoFechas}
              onChange={(e) => setRangoFechas(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              placeholder="Seleccione rango"
              style={{ width: "100%" }}
              showIcon
              readOnlyInput
            />
          </div>

          <div style={{ flex: 0.25 }}>
            <Button
              icon="pi pi-filter-slash"
              className="p-button-secondary"
              outlined
              onClick={limpiarFiltros}
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label="Exportar"
              icon="pi pi-download"
              className="p-button-success"
              onClick={(e) => menuExport.current.toggle(e)}
              disabled={!empresaIdSelector || !periodoSeleccionado}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Estado</label>
            <Dropdown
              value={estadoFiltro}
              options={estadosAsiento}
              onChange={(e) => setEstadoFiltro(e.value)}
              optionLabel="descripcion"
              optionValue="id"
              placeholder="Todos"
              style={{ width: "100%" }}
              showClear
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Nº Asiento</label>
            <InputText
              value={numeroAsientoFiltro}
              onChange={(e) => setNumeroAsientoFiltro(e.target.value)}
              placeholder="Buscar asiento"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Cuenta Específica</label>
            <Dropdown
              value={cuentaFiltro}
              options={planCuentas}
              onChange={(e) => setCuentaFiltro(e.value)}
              optionLabel={(option) => `${option.codigoCuenta} - ${option.nombreCuenta}`}
              optionValue="id"
              placeholder="Todas las cuentas"
              style={{ width: "100%" }}
              filter
              showClear
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Código Cuenta</label>
            <InputText
              value={codigoCuentaFiltro}
              onChange={(e) => setCodigoCuentaFiltro(e.target.value)}
              placeholder="Ej: 10, 40, 62"
              style={{ width: "100%" }}
              tooltip="Busca cuentas que INICIEN con este código"
            />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Solo Cuadrados</label>
            <BooleanToggleButton
              value={soloCuadrados}
              onChange={setSoloCuadrados}
              labelTrue="✅ SOLO CUADRADOS"
              labelFalse="📋 TODOS"
              severityTrue="success"
              severityFalse="secondary"
              size="small"
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Solo Descuadrados</label>
            <BooleanToggleButton
              value={soloDescuadrados}
              onChange={setSoloDescuadrados}
              labelTrue="❌ SOLO DESCUADRADOS"
              labelFalse="📋 TODOS"
              severityTrue="danger"
              severityFalse="secondary"
              size="small"
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Con Entidad</label>
            <BooleanToggleButton
              value={soloConEntidad}
              onChange={setSoloConEntidad}
              labelTrue="👤 SOLO CON ENTIDAD"
              labelFalse="📋 TODOS"
              severityTrue="info"
              severityFalse="secondary"
              size="small"
            />
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 15,
            marginBottom: 15,
            flexWrap: "wrap",
          }}
        >
          <Button
            label="Expandir Todas"
            icon="pi pi-angle-double-down"
            onClick={expandirTodas}
            size="small"
            outlined
          />

          <Button
            label="Contraer Todas"
            icon="pi pi-angle-double-up"
            onClick={contraerTodas}
            size="small"
            outlined
          />

          <Tag value={`${cuentas.length} cuentas`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`${totalMovimientos} movimientos`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`Debe: S/ ${formatearNumero(totales.totalDebe, 2)}`} severity="success" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`Haber: S/ ${formatearNumero(totales.totalHaber, 2)}`} severity="warning" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`Saldo: S/ ${formatearNumero(totales.saldoFinal, 2)}`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
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
          <div style={{ flex: 1 }}>
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

          <div style={{ flex: 1 }}>
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

          <div style={{ flex: 1 }}>
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

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Centro de Costo</label>
            <Dropdown
              value={centroCostoIdFiltro}
              options={centrosCostoOptions}
              onChange={(e) => setCentroCostoIdFiltro(e.value)}
              optionLabel="displayLabel"
              optionValue="id"
              placeholder="Todos"
              style={{ width: "100%" }}
              filter
              showClear
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Entidad Comercial</label>
            <Dropdown
              value={entidadComercialIdFiltro}
              options={entidadesOptions}
              onChange={(e) => setEntidadComercialIdFiltro(e.value)}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Todas"
              style={{ width: "100%" }}
              filter
              showClear
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Activo</label>
            <Dropdown
              value={activoIdFiltro}
              options={activosOptions}
              onChange={(e) => setActivoIdFiltro(e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Todos"
              style={{ width: "100%" }}
              filter
              showClear
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Submódulo Origen</label>
            <Dropdown
              value={submoduloOrigenLineaIdFiltro}
              options={submodulosOptions}
              onChange={(e) => setSubmoduloOrigenLineaIdFiltro(e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Todos"
              style={{ width: "100%" }}
              filter
              showClear
            />
          </div>
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Tipo Documento Origen</label>
            <Dropdown
              value={tipoDocumentoOrigenIdFiltro}
              options={tiposDocumentoOptions}
              onChange={(e) => setTipoDocumentoOrigenIdFiltro(e.value)}
              optionLabel="displayLabel"
              optionValue="id"
              placeholder="Todos"
              style={{ width: "100%" }}
              filter
              showClear
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Número Documento Origen</label>
            <InputText
              value={numeroDocumentoOrigenFiltro}
              onChange={(e) => setNumeroDocumentoOrigenFiltro(e.target.value)}
              placeholder="Ej: F001-00001234"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Rango Fechas Documento</label>
            <Calendar
              value={rangoFechasDocumento}
              onChange={(e) => setRangoFechasDocumento(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              placeholder="Opcional"
              style={{ width: "100%" }}
              showIcon
              readOnlyInput
            />
          </div>
        </div>
        {/* ACCORDION POR CUENTA */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Cargando...</p>
          </div>
        ) : cuentas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Seleccione Empresa y Periodo para ver datos
          </div>
        ) : (
          <Accordion multiple activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
            {cuentas.map((cuenta, index) => {
              // CALCULAR TOTALES POR CUENTA EN EL FRONTEND
              let totalDebeCuenta = 0;
              let totalHaberCuenta = 0;

              cuenta.movimientos.forEach(mov => {
                totalDebeCuenta += Number(mov.debe) || 0;
                totalHaberCuenta += Number(mov.haber) || 0;
              });

              const saldoFinalCuenta = totalDebeCuenta - totalHaberCuenta;
              const tipoSaldo = saldoFinalCuenta >= 0 ? 'Deudor' : 'Acreedor';
              const colorSaldo = saldoFinalCuenta >= 0 ? '#4caf50' : '#f44336';

              return (
                <AccordionTab
                  key={`cuenta-${index}-${cuenta.codigoCuenta}`}
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '1rem' }}>
                      <div>
                        <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{cuenta.codigoCuenta}</strong>
                        <span style={{ marginLeft: '1rem', fontSize: '1rem' }}>{cuenta.nombreCuenta}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Tag value={`${cuenta.movimientos.length} mov.`} severity="info" />
                        <Tag value={`Debe: S/ ${formatearNumero(totalDebeCuenta, 2)}`} severity="success" />
                        <Tag value={`Haber: S/ ${formatearNumero(totalHaberCuenta, 2)}`} severity="warning" />
                        <Tag
                          value={`Saldo: S/ ${formatearNumero(Math.abs(saldoFinalCuenta), 2)} ${tipoSaldo}`}
                          style={{ backgroundColor: colorSaldo, color: '#fff', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                  }
                >
                  <DataTable
                    value={cuenta.movimientos}
                    size="small"
                    showGridlines
                    stripedRows
                    style={{ fontSize: getResponsiveFontSize() }}
                  >
                    <Column field="asientoContable.fechaAsiento" header="Fecha" body={fechaTemplate} style={{ width: '100px' }} />
                    <Column field="asientoContable.numeroAsiento" header="Asiento" body={asientoTemplate} style={{ width: '120px' }} />
                    <Column field="glosa" header="Glosa" style={{ minWidth: '250px' }} />
                    <Column field="tipoDocumentoOrigen.codigo" header="Tipo Doc" style={{ width: '90px' }} />
                    <Column field="numeroDocumentoOrigen" header="Nº Doc" style={{ width: '130px' }} />
                    <Column header="Entidad" body={entidadTemplate} style={{ minWidth: '200px' }} />
                    <Column header="Debe" body={(rowData) => montoTemplate(rowData, 'debe')} style={{ width: '180px' }} align="right" />
                    <Column header="Haber" body={(rowData) => montoTemplate(rowData, 'haber')} style={{ width: '180px' }} align="right" />
                    <Column header="Saldo" body={saldoTemplate} style={{ width: '180px' }} align="right" />
                    <Column header="Tipo" body={tipoSaldoTemplate} style={{ width: '100px' }} />
                    <Column header="Estado" body={estadoTemplate} style={{ width: '110px' }} />
                    <Column header="Saldo Inicial" body={saldoInicialTemplate} style={{ width: '130px' }} />
                  </DataTable>
                </AccordionTab>
              );
            })}
          </Accordion>
        )}
      </div>

      {showPDFViewer && (
        <TemporaryPDFViewer
          visible={showPDFViewer}
          onHide={() => setShowPDFViewer(false)}
          generatePDF={() => generarLibroMayorPDF(reportData)}
          fileName={`LibroMayor_${reportData?.empresa?.ruc}_${reportData?.periodo?.nombrePeriodo}.pdf`}
        />
      )}

      {showExcelViewer && (
        <TemporaryExcelViewer
          visible={showExcelViewer}
          onHide={() => setShowExcelViewer(false)}
          generateExcel={() => generarLibroMayorExcel(reportData)}
          fileName={`LibroMayor_${reportData?.empresa?.ruc}_${reportData?.periodo?.nombrePeriodo}.xlsx`}
        />
      )}

    </div>
  );
};

export default MayorContable;