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
import { getLineasDiarioContable, exportarSUNAT51, exportarExcel, exportarPDF } from "../../api/contabilidad/diarioContable";
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
import { SelectButton } from "primereact/selectbutton";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";

const DiarioContable = ({ ruta }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  const toast = useRef(null);
  const menuExport = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [lineasFlat, setLineasFlat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cuentas, setCuentas] = useState([]);
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
  const [numeroAsientoFiltro, setNumeroAsientoFiltro] = useState('');
  const [codigoCuentaFiltro, setCodigoCuentaFiltro] = useState('');
  const [soloCuadrados, setSoloCuadrados] = useState(false);
  const [soloDescuadrados, setSoloDescuadrados] = useState(false);
  const [soloConEntidad, setSoloConEntidad] = useState(false);
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS');

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
  });

  const [estadisticas, setEstadisticas] = useState({
    totalAsientos: 0,
    totalLineas: 0,
  });

  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];

    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);


  const centrosCostoOptions = useMemo(() => {
    if (lineasFlat.length === 0) return [];
    const idsUnicos = [...new Set(lineasFlat.map(l => l.centroCostoId).filter(Boolean))];
    return centrosCosto
      .filter(cc => idsUnicos.includes(cc.id))
      .map(cc => ({
        ...cc,
        displayLabel: `${cc.Codigo} - ${cc.Descripcion || cc.Nombre}`
      }));
  }, [lineasFlat, centrosCosto]);

  const entidadesOptions = useMemo(() => {
    if (lineasFlat.length === 0) return [];
    const idsUnicos = [...new Set(lineasFlat.map(l => l.entidadComercialId).filter(Boolean))];
    return entidades.filter(e => idsUnicos.includes(e.id));
  }, [lineasFlat, entidades]);

  const activosOptions = useMemo(() => {
    if (lineasFlat.length === 0) return [];
    const idsUnicos = [...new Set(lineasFlat.map(l => l.activoId).filter(Boolean))];
    return activos.filter(a => idsUnicos.includes(a.id));
  }, [lineasFlat, activos]);

  const submodulosOptions = useMemo(() => {
    if (lineasFlat.length === 0) return [];
    const idsUnicos = [...new Set(lineasFlat.map(l => l.submoduloOrigenLineaId).filter(Boolean))];
    return submodulos.filter(s => idsUnicos.includes(s.id));
  }, [lineasFlat, submodulos]);

  const tiposDocumentoOptions = useMemo(() => {
    if (lineasFlat.length === 0) return [];
    const idsUnicos = [...new Set(lineasFlat.map(l => l.tipoDocumentoOrigenId).filter(Boolean))];
    return tiposDocumento
      .filter(td => idsUnicos.includes(td.id))
      .map(td => ({
        ...td,
        displayLabel: `${td.codigo} - ${td.descripcion || 'Sin descripción'}`
      }));
  }, [lineasFlat, tiposDocumento]);

  const monedasOptions = useMemo(() => {
    if (lineasFlat.length === 0) return [];
    const idsUnicos = [...new Set(lineasFlat.map(l => l.monedaId).filter(Boolean))];
    return monedas.filter(m => idsUnicos.includes(m.id));
  }, [lineasFlat, monedas]);

  // LÍNEA 143 - AGREGAR DEBUG:
const tiposLibroOptions = useMemo(() => {
  if (lineasFlat.length === 0) return [];
  const idsUnicos = [...new Set(
    lineasFlat
      .map(l => l.tipoLibroId)
      .filter(id => id !== null && id !== undefined)
      .map(id => Number(id))
  )];
  return tiposLibro.filter(tl => idsUnicos.includes(Number(tl.id)));
}, [lineasFlat, tiposLibro]);

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
      setCuentas(cuentasData);
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
        numeroAsiento: numeroAsientoFiltro,
        estadoAsientoId: estadoFiltro,
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
        codigoCuentaInicia: codigoCuentaFiltro,
        soloCuadrados: soloCuadrados,
        soloDescuadrados: soloDescuadrados,
        soloConEntidad: soloConEntidad,
        soloSaldosIniciales: filtroSaldoInicial === 'SOLO_SALDOS',
      };

      const response = await getLineasDiarioContable(params);

      let asientosFiltrados = response.asientos || [];

      if (filtroSaldoInicial === 'SIN_SALDOS') {
        asientosFiltrados = asientosFiltrados.filter(asiento => !asiento.esSaldoInicial);
      }

      const flat = [];
      asientosFiltrados.forEach((asiento, asientoIndex) => {
        asiento.lineas.forEach(linea => {
          flat.push({
            _asientoIndex: asientoIndex,
            numeroAsiento: asiento.numeroAsiento,
            fechaAsiento: asiento.fechaAsiento,
            glosaAsiento: asiento.glosaAsiento,
            esGerencial: asiento.esGerencial,
            tipoLibroId: asiento.tipoLibroId,
            estado: asiento.estado,
            estaCuadrado: asiento.estaCuadrado,
            esSaldoInicial: asiento.esSaldoInicial,
            ...linea,
          });
        });
      });

      setLineasFlat(flat);

      const totalesCalculados = response.totales || { totalDebe: 0, totalHaber: 0 };
      const diferencia = Math.abs(totalesCalculados.totalDebe - totalesCalculados.totalHaber);
      const TOLERANCIA_CENTAVOS = 0.005;
      const estaCuadrado = diferencia < TOLERANCIA_CENTAVOS;

      if (!estaCuadrado && diferencia > 0) {
        console.warn('⚠️ DESCUADRE DETECTADO EN LIBRO DIARIO', {
          debe: totalesCalculados.totalDebe.toFixed(2),
          haber: totalesCalculados.totalHaber.toFixed(2),
          diferencia: diferencia.toFixed(2),
          periodo: periodoSeleccionado,
          empresa: empresaIdSelector,
          timestamp: new Date().toISOString(),
          filtros: {
            tipoLibro: filtroEsGerencial ? 'GERENCIAL' : 'FISCAL',
            rangoFechas: rangoFechas,
            totalAsientos: asientosFiltrados.length
          }
        });
      }

      setTotales({
        ...totalesCalculados,
        diferencia: diferencia,
        estaCuadrado: estaCuadrado
      });

      setEstadisticas({
        totalAsientos: asientosFiltrados.length,
        totalLineas: response.totalLineas || 0,
      });

      if (!estaCuadrado && diferencia >= 0.01) {
        toast.current?.show({
          severity: "warn",
          summary: "⚠️ Descuadre Detectado",
          detail: `Diferencia: S/ ${formatearNumero(diferencia, 2)} | Debe: ${formatearNumero(totalesCalculados.totalDebe, 2)} | Haber: ${formatearNumero(totalesCalculados.totalHaber, 2)}`,
          life: 8000,
          sticky: diferencia > 1.00
        });
      }

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
    setNumeroAsientoFiltro('');
    setCodigoCuentaFiltro('');
    setSoloCuadrados(false);
    setSoloDescuadrados(false);
    setSoloConEntidad(false);
    setFiltroSaldoInicial('TODOS');
    setLineasFlat([]);
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
        tipoLibroId: tipoLibroIdFiltro,
        monedaId: monedaIdFiltro,
      };

      let blob;
      let filename;

      if (tipo === 'sunat') {
        blob = await exportarSUNAT51(params);
        filename = `LE_DIARIO_${params.empresaId}_${params.periodoContableId}.txt`;
      } else if (tipo === 'excel') {
        blob = await exportarExcel(params);
        filename = `DiarioContable_${params.empresaId}_${params.periodoContableId}.xlsx`;
      } else if (tipo === 'pdf') {
        blob = await exportarPDF(params);
        filename = `DiarioContable_${params.empresaId}_${params.periodoContableId}.pdf`;
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
        return { label: '📋 Todos los Asientos', severity: 'secondary' };
    }
  };

  const exportarDescuadres = async () => {
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
      const asientosDescuadrados = lineasFlat
        .filter((linea, index, self) =>
          !linea.estaCuadrado &&
          self.findIndex(l => l.numeroAsiento === linea.numeroAsiento) === index
        )
        .map(linea => ({
          numeroAsiento: linea.numeroAsiento,
          fecha: formatearFecha(linea.fechaAsiento),
          glosa: linea.glosaAsiento,
          estado: linea.estado?.nombre || 'N/A'
        }));

      if (asientosDescuadrados.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin Descuadres",
          detail: "No hay asientos descuadrados para exportar",
          life: 3000,
        });
        return;
      }

      toast.current?.show({
        severity: "success",
        summary: "Exportado",
        detail: `${asientosDescuadrados.length} asientos descuadrados exportados`,
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al exportar descuadres",
        life: 3000,
      });
    }
  };

  const menuExportItems = [
    {
      label: 'Formato SUNAT 5.1 (TXT)',
      icon: 'pi pi-file',
      command: () => handleExportar('sunat')
    },
    {
      label: 'Excel Detallado',
      icon: 'pi pi-file-excel',
      command: () => handleExportar('excel')
    },
    {
      label: 'PDF Libro Diario',
      icon: 'pi pi-file-pdf',
      command: () => handleExportar('pdf')
    },
    {
      separator: true
    },
    {
      label: 'Reporte de Descuadres',
      icon: 'pi pi-exclamation-triangle',
      command: exportarDescuadres,
      disabled: totales.estaCuadrado,
      className: 'p-menuitem-danger'
    }
  ];


  const lineaTemplate = (rowData) => {
    return <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>L{rowData.numeroLinea}</span>;
  };

  const codigoCuentaTemplate = (rowData) => {
    return (
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.7rem' }}>
        {rowData.planCuenta?.codigoCuenta}
      </span>
    );
  };

  const nombreCuentaTemplate = (rowData) => {
    return (
      <span style={{ fontSize: '0.7rem', color: '#333' }}>
        {rowData.planCuenta?.nombreCuenta}
      </span>
    );
  };

  const numeroAsientoTemplate = (rowData) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 'bold' }}>{rowData.numeroAsiento}</span>
      </div>
    );
  };

  const saldoInicialTemplate = (rowData) => {
    if (!rowData.esSaldoInicial) return null;
    return <Tag value="SI" severity="danger" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }} />;
  };

  const fechaAsientoTemplate = (rowData) => {
    return <span style={{ fontSize: '0.7rem' }}>{formatearFecha(rowData.fechaAsiento)}</span>;
  };

  const glosaAsientoTemplate = (rowData) => {
    return <span style={{ fontSize: '0.7rem' }}>{rowData.glosaAsiento}</span>;
  };

  const glosaLineaTemplate = (rowData) => {
    return <span style={{ fontSize: '0.7rem' }}>{rowData.glosa}</span>;
  };

  const documentoTemplate = (rowData) => {
    if (!rowData.tipoDocumentoOrigen && !rowData.numeroDocumentoOrigen) return null;
    return (
      <div>
        <div style={{ fontSize: '0.7rem' }}>{rowData.tipoDocumentoOrigen?.codigo}</div>
        <div style={{ fontSize: '0.65rem' }}>{rowData.numeroDocumentoOrigen}</div>
      </div>
    );
  };

  const entidadTemplate = (rowData) => {
    if (!rowData.entidadComercial) return null;
    return (
      <div>
        <div style={{ fontSize: '0.7rem' }}>{rowData.entidadComercial.razonSocial}</div>
        <div style={{ fontSize: '0.65rem', color: '#666' }}>{rowData.entidadComercial.ruc}</div>
      </div>
    );
  };

  const debeTemplate = (rowData) => {
    const monto = Number(rowData.debe);
    if (monto === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.7rem' }}>
        {rowData.moneda?.simbolo || ''} {formatearNumero(monto, 2)}
      </span>
    );
  };

  const haberTemplate = (rowData) => {
    const monto = Number(rowData.haber);
    if (monto === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.7rem' }}>
        {rowData.moneda?.simbolo || ''} {formatearNumero(monto, 2)}
      </span>
    );
  };

  const footerDebeTotal = () => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.7rem' }}>
        S/ {formatearNumero(totales.totalDebe, 2)}
      </div>
    );
  };

  const footerHaberTotal = () => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.7rem' }}>
        S/ {formatearNumero(totales.totalHaber, 2)}
      </div>
    );
  };



  const buttonConfig = getSaldoInicialButtonConfig();

  return (
    <div>
      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>📘 Libro Diario</h2>
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
        {!loading && lineasFlat.length > 0 && (
          <div style={{
            marginBottom: '0.5rem',
            padding: '0.6rem',
            backgroundColor: totales.estaCuadrado ? '#ECFDF5' : '#FEE2E2',
            borderRadius: '6px',
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'space-around',
            alignItems: 'center',
            fontSize: '0.8rem',
            border: totales.estaCuadrado ? '2px solid #10B981' : '2px solid #DC2626',
            boxShadow: totales.estaCuadrado ? '0 1px 3px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(220, 38, 38, 0.3)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              📋 <strong>Asientos:</strong> {estadisticas.totalAsientos}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              📄 <strong>Líneas:</strong> {estadisticas.totalLineas}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              💰 <strong>Debe:</strong> S/ {formatearNumero(totales.totalDebe, 2)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              💸 <strong>Haber:</strong> S/ {formatearNumero(totales.totalHaber, 2)}
            </span>
            {totales.estaCuadrado ? (
              <Tag
                value="✅ CUADRADO"
                severity="success"
                style={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              />
            ) : (
              <Tag
                value={`⚠️ DESCUADRADO: S/ ${formatearNumero(totales.diferencia, 2)}`}
                severity="danger"
                style={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              />
            )}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Cargando...</p>
          </div>
        ) : lineasFlat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Seleccione Empresa y Periodo para ver datos
          </div>
        ) : (
          <DataTable
            value={lineasFlat}
            size="small"
            showGridlines
            stripedRows
            paginator
            rows={50}
            rowsPerPageOptions={[50, 100, 200, 500]}
            style={{ fontSize: '0.7rem' }}
            scrollable
            scrollHeight="calc(100vh - 350px)"
          >
            <Column
              body={saldoInicialTemplate}
              header="SI"
              style={{ width: '25px', textAlign: 'center' }}
              frozen
            />
            <Column
              body={numeroAsientoTemplate}
              header="Nro Asiento"
              style={{ width: '80px' }}
              frozen
            />
            <Column
              body={fechaAsientoTemplate}
              header="Fecha"
              style={{ width: '70px', }}
              frozen
            />
            <Column
              body={glosaAsientoTemplate}
              header="Glosa Asiento"
              style={{ width: '180px', }}
            />
            <Column
              body={lineaTemplate}
              header="L"
              style={{ width: '20px', }}
            />
            <Column
              body={codigoCuentaTemplate}
              header="Código"
              style={{ width: '80px', padding: '0.2rem' }}
            />
            <Column
              body={nombreCuentaTemplate}
              header="Nombre Cuenta"
              style={{ width: '200px', padding: '0.2rem' }}
            />
            <Column
              body={glosaLineaTemplate}
              header="Glosa Línea"
              style={{ width: '350px' }}
            />
            <Column
              body={documentoTemplate}
              header="Documento"
              style={{ width: '80px' }}
            />
            <Column
              body={entidadTemplate}
              header="Entidad"
              style={{ width: '80px' }}
            />
            <Column
              body={debeTemplate}
              header="Debe"
              footer={footerDebeTotal}
              style={{ width: '100px' }}
              align="right"
            />
            <Column
              body={haberTemplate}
              header="Haber"
              footer={footerHaberTotal}
              style={{ width: '100px' }}
              align="right"
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default DiarioContable;
