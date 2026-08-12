import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Message } from "primereact/message";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getBalanceComprobacion, exportarSUNATBalanceGeneral } from "../../api/contabilidad/balanceComprobacion";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getTiposLibroContableSunat } from "../../api/contabilidad/tipoLibroContableSunat";
import { getMonedas } from "../../api/moneda";
import { getPlanCuentasContableActivas } from "../../api/contabilidad/planCuentasContable";
import { formatearFecha, formatearNumero } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";
import { generarBalanceGeneralExcel } from "../../components/contabilidad/reports/generarBalanceGeneralExcel";
import { generarBalanceGeneralPDF } from "../../components/contabilidad/reports/generarBalanceGeneralPDF";
import AnexoViewer from "./AnexoViewer";
import { ANEXOS_DISPONIBLES } from "./anexosConfig";

const BalanceGeneral = ({ ruta }) => {
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
  const [planCuentas, setPlanCuentas] = useState([]);

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
  const [vistaArbol, setVistaArbol] = useState(true);
  const [expandedKeysActivo, setExpandedKeysActivo] = useState({});
  const [expandedKeysPasivo, setExpandedKeysPasivo] = useState({});

  // Estados para Anexos
  const [showAnexo, setShowAnexo] = useState(false);
  const [anexoActual, setAnexoActual] = useState(null);

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

  // ========================================
  // MAPEO DE RUBROS DEL BALANCE GENERAL
  // ========================================
  const RUBROS_BALANCE = {
    ACTIVO_CORRIENTE: {
      nombre: 'ACTIVO CORRIENTE',
      anexo: null,
      rubros: [
        { nombre: 'Caja y Bancos', cuentas: ['10'], anexo: "N°01" },
        { nombre: 'Valores Negociables', cuentas: ['11'], anexo: "N°02" },
        { nombre: 'Cuentas por Cobrar Comerciales', cuentas: ['12'], anexo: "N°02" },
        { nombre: 'Cuentas por Cobrar al personal', cuentas: ['14'], anexo: "N°03" },
        { nombre: 'Cuentas por Cobrar accionistas, directores y gerentes', cuentas: ['16'], anexo: "N°04" },
        { nombre: 'Otras Cuentas por Cobrar diversas', cuentas: ['18', '19'], anexo: "N°05" },
        { nombre: 'Existencias', cuentas: ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'], anexo: "N°06" },
        { nombre: 'Gastos Pagados por Anticipado', cuentas: ['18'], anexo: "N°07" }
      ]
    },
    ACTIVO_NO_CORRIENTE: {
      nombre: 'ACTIVO NO CORRIENTE',
      anexo: null,
      rubros: [
        { nombre: 'Inmuebles, Maquinaria y Equipo (neto de depreciación acumulada)', cuentas: ['33', '34'], anexo: "N°08" },
        { nombre: 'Otros Activos', cuentas: ['39', '40'], anexo: "N°09" }
      ]
    },
    PASIVO_CORRIENTE: {
      nombre: 'PASIVO CORRIENTE',
      anexo: null,
      rubros: [
        { nombre: 'Tributos y aportes sistema de pensión y salud por pagar', cuentas: ['40'], anexo: "N°10" },
        { nombre: 'Remuneración y participación por pagar', cuentas: ['41'], anexo: "N°11" },
        { nombre: 'Cuentas por Pagar Comerciales', cuentas: ['42'], anexo: "N°12" },
        { nombre: 'Cuentas por Pagar Financieras', cuentas: ['45'], anexo: "N°13" },
        { nombre: 'Cuentas por Pagar Diversas CP', cuentas: ['46', '47'], anexo: "N°14" }
      ]
    },
    PASIVO_NO_CORRIENTE: {
      nombre: 'PASIVO NO CORRIENTE',
      anexo: null,
      rubros: [
        { nombre: 'Deudas a Largo Plazo', cuentas: ['45', '46', '47'], anexo: "N°15" }
      ]
    },
    PATRIMONIO_NETO: {
      nombre: 'PATRIMONIO NETO',
      anexo: null,
      rubros: [
        { nombre: 'Capital', cuentas: ['50'], anexo: "N°16" },
        { nombre: 'Excedentes de Revaluación', cuentas: ['57'], anexo: "N°17" },
        { nombre: 'Reservas Legales', cuentas: ['58'], anexo: null },
        { nombre: 'Resultados Acumulados', cuentas: ['59'], anexo: null },
        { nombre: 'Utilidad del ejercicio', cuentas: ['59'], anexo: "N°18" }
      ]
    }
  };

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

    resultado = resultado.filter(c => {
      const tipo = c.tipoCuenta;
      return tipo === 'ACTIVO' || tipo === 'PASIVO' || tipo === 'PATRIMONIO';
    });

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

  // ========================================
  // FUNCIONES PARA CONSTRUIR ÁRBOL (3 NIVELES)
  // ========================================

  /**
   * Construye árbol de 3 niveles para Balance General:
   * Nivel 1: ACTIVO CORRIENTE / ACTIVO NO CORRIENTE / etc.
   * Nivel 2: Rubros (Caja y Bancos, etc.)
   * Nivel 3: Detalle expandible (opcional)
   */
  const construirArbolBalance = (cuentasConSaldos, tipoBalance) => {
    const arbol = [];

    if (tipoBalance === 'ACTIVO') {
      // ACTIVO CORRIENTE
      const activoCorriente = construirNivelClasificacion(
        'ACTIVO_CORRIENTE',
        RUBROS_BALANCE.ACTIVO_CORRIENTE,
        cuentasConSaldos,
        'ACTIVO'
      );
      if (activoCorriente) arbol.push(activoCorriente);

      // ACTIVO NO CORRIENTE
      const activoNoCorriente = construirNivelClasificacion(
        'ACTIVO_NO_CORRIENTE',
        RUBROS_BALANCE.ACTIVO_NO_CORRIENTE,
        cuentasConSaldos,
        'ACTIVO'
      );
      if (activoNoCorriente) arbol.push(activoNoCorriente);

    } else {
      // PASIVO CORRIENTE
      const pasivoCorriente = construirNivelClasificacion(
        'PASIVO_CORRIENTE',
        RUBROS_BALANCE.PASIVO_CORRIENTE,
        cuentasConSaldos,
        'PASIVO'
      );
      if (pasivoCorriente) arbol.push(pasivoCorriente);

      // PASIVO NO CORRIENTE
      const pasivoNoCorriente = construirNivelClasificacion(
        'PASIVO_NO_CORRIENTE',
        RUBROS_BALANCE.PASIVO_NO_CORRIENTE,
        cuentasConSaldos,
        'PASIVO'
      );
      if (pasivoNoCorriente) arbol.push(pasivoNoCorriente);

      // PATRIMONIO NETO
      const patrimonioNeto = construirNivelClasificacion(
        'PATRIMONIO_NETO',
        RUBROS_BALANCE.PATRIMONIO_NETO,
        cuentasConSaldos,
        'PATRIMONIO'
      );
      if (patrimonioNeto) arbol.push(patrimonioNeto);
    }

    return arbol;
  };

  /**
   * Construye Nivel 1: Clasificación (CORRIENTE, NO CORRIENTE, NETO)
   */
  const construirNivelClasificacion = (key, clasificacion, cuentasConSaldos, tipoCuenta) => {
    const nodoClasificacion = {
      key: key,
      data: {
        denominacion: clasificacion.nombre,
        anexo: clasificacion.anexo,
        monto: 0,
        nivel: 'clasificacion',
        tipoCuenta: tipoCuenta
      },
      children: []
    };

    // Nivel 2: Rubros
    clasificacion.rubros.forEach((rubro, indexRubro) => {
      const nodoRubro = construirNivelRubro(
        `${key}-rubro-${indexRubro}`,
        rubro,
        cuentasConSaldos,
        tipoCuenta
      );

      if (nodoRubro && nodoRubro.data.monto !== 0) {
        nodoClasificacion.children.push(nodoRubro);
      }
    });

    if (nodoClasificacion.children.length === 0) return null;

    // Calcular total
    nodoClasificacion.data.monto = nodoClasificacion.children.reduce((sum, child) => sum + (child.data.monto || 0), 0);

    return nodoClasificacion;
  };

  /**
   * Construye Nivel 2: Rubro (Caja y Bancos, etc.)
   */
  const construirNivelRubro = (key, rubro, cuentasConSaldos, tipoCuenta) => {
    // Filtrar cuentas que pertenecen a este rubro
    const cuentasRubro = cuentasConSaldos.filter(cuenta => {
      const codigoClase = cuenta.codigoCuenta.substring(0, 2);
      return rubro.cuentas.includes(codigoClase);
    });

    if (cuentasRubro.length === 0) return null;

    // Calcular monto del rubro
    const montoRubro = cuentasRubro.reduce((sum, cuenta) => {
      const debe = Number(cuenta.saldoFinalDebe || 0);
      const haber = Number(cuenta.saldoFinalHaber || 0);

      if (tipoCuenta === 'ACTIVO') {
        return sum + (debe - haber);
      } else {
        return sum + (haber - debe);
      }
    }, 0);

    if (Math.abs(montoRubro) < 0.01) return null;

    const nodoRubro = {
      key: key,
      data: {
        denominacion: rubro.nombre,
        anexo: rubro.anexo,
        monto: montoRubro,
        nivel: 'rubro',
        tipoCuenta: tipoCuenta
      },
      children: []
    };

    return nodoRubro;
  };

  // Construir árboles
  const arbolActivo = useMemo(() => {
    return construirArbolBalance(cuentasFiltradas, 'ACTIVO');
  }, [cuentasFiltradas]);

  const arbolPasivoPatrimonio = useMemo(() => {
    return construirArbolBalance(cuentasFiltradas, 'PASIVO_PATRIMONIO');
  }, [cuentasFiltradas]);

  // Calcular totales desde los árboles
  const totalActivo = useMemo(() => {
    if (arbolActivo.length === 0) return 0;
    return arbolActivo.reduce((sum, nodo) => sum + (nodo.data.monto || 0), 0);
  }, [arbolActivo]);

  const totalPasivoPatrimonio = useMemo(() => {
    if (arbolPasivoPatrimonio.length === 0) return 0;
    return arbolPasivoPatrimonio.reduce((sum, nodo) => sum + (nodo.data.monto || 0), 0);
  }, [arbolPasivoPatrimonio]);

  // ========================================
  // FUNCIONES PARA ANEXOS
  // ========================================

  const abrirAnexo = (numeroAnexo) => {
    setAnexoActual(numeroAnexo);
    setShowAnexo(true);
  };

  const cerrarAnexo = () => {
    setShowAnexo(false);
    setAnexoActual(null);
  };

  const navegarAnexoAnterior = () => {
    if (!anexoActual) return;
    const indexActual = ANEXOS_DISPONIBLES.indexOf(anexoActual);
    if (indexActual > 0) {
      setAnexoActual(ANEXOS_DISPONIBLES[indexActual - 1]);
    }
  };

  const navegarAnexoSiguiente = () => {
    if (!anexoActual) return;
    const indexActual = ANEXOS_DISPONIBLES.indexOf(anexoActual);
    if (indexActual < ANEXOS_DISPONIBLES.length - 1) {
      setAnexoActual(ANEXOS_DISPONIBLES[indexActual + 1]);
    }
  };

  const tieneAnexoAnterior = useMemo(() => {
    if (!anexoActual) return false;
    return ANEXOS_DISPONIBLES.indexOf(anexoActual) > 0;
  }, [anexoActual]);

  const tieneAnexoSiguiente = useMemo(() => {
    if (!anexoActual) return false;
    return ANEXOS_DISPONIBLES.indexOf(anexoActual) < ANEXOS_DISPONIBLES.length - 1;
  }, [anexoActual]);

  // ========================================
  // EFFECTS
  // ========================================

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
    // Solo establecer periodo inicial si no hay uno seleccionado
    if (periodosFiltrados.length > 0 && !periodoSeleccionado) {
      const mesActual = new Date().getMonth() + 1;
      const periodoActual = periodosFiltrados.find(p => Number(p.mes) === mesActual);
      if (periodoActual) {
        setPeriodoSeleccionado(periodoActual.id);
      } else {
        setPeriodoSeleccionado(periodosFiltrados[0].id);
      }
    }
  }, [periodosFiltrados]);

  useEffect(() => {
    if (arbolActivo.length > 0) {
      const keys = {};
      arbolActivo.forEach((nodo) => {
        keys[nodo.key] = true;
      });
      setExpandedKeysActivo(keys);
    }
  }, [arbolActivo]);

  useEffect(() => {
    if (arbolPasivoPatrimonio.length > 0) {
      const keys = {};
      arbolPasivoPatrimonio.forEach((nodo) => {
        keys[nodo.key] = true;
      });
      setExpandedKeysPasivo(keys);
    }
  }, [arbolPasivoPatrimonio]);

  // ========================================
  // FUNCIONES DE CARGA
  // ========================================

  const cargarCatalogos = async () => {
    try {
      const [empresasData, periodosData, tiposLibroData, monedasData, planCuentasData] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
        getTiposLibroContableSunat(),
        getMonedas(),
        getPlanCuentasContableActivas(),
      ]);

      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setTiposLibro(tiposLibroData);
      setMonedas(monedasData);
      setPlanCuentas(planCuentasData);
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
      setTotales(response.totales || {});
      setEstadisticas(response.estadisticas || null);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Balance General cargado: ${response.cuentas?.length || 0} cuentas`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al cargar datos",
        life: 3000,
      });
      setCuentas([]);
      setTotales({});
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setRangoFechas(null);
    setFiltroEsGerencial(false);
    setTipoLibroIdFiltro(null);
    setMonedaIdFiltro(null);
    setNivelDetalle(6);
    setFiltroSaldoInicial('TODOS');
    setBuscarCuenta('');
    setCuentas([]);
    setTotales({});
    setEstadisticas(null);
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
    const monedaData = monedas.find(m => Number(m.id) === Number(monedaIdFiltro)) || { nombreLargo: "SOLES", codigoSunat: "PEN" };

    if (tipo === 'sunat') {
      try {
        const blob = await exportarSUNATBalanceGeneral({
          empresaId: empresaIdSelector,
          periodoContableId: periodoSeleccionado,
          monedaId: monedaIdFiltro,
        });

        // Generar nombre del archivo
        const ruc = empresaData?.ruc || '00000000000';
        const año = periodoData?.año || periodoData?.anio || new Date().getFullYear();
        const mes = String(periodoData?.mes || 1).padStart(2, '0');
        const filename = `LE${ruc}${año}${mes}000316001111.txt`;

        // Descargar archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Archivo SUNAT descargado correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al exportar SUNAT:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.message || "Error al exportar SUNAT",
          life: 3000,
        });
      }
      return;
    }

    const data = {
      empresa: empresaData,
      periodo: periodoData,
      moneda: monedaData,
      cuentas: cuentasFiltradas,
      totales,
      arbolActivo,
      arbolPasivoPatrimonio
    };

    setReportData(data);

    if (tipo === 'excel') {
      setShowExcelViewer(true);
    } else if (tipo === 'pdf') {
      setShowPDFViewer(true);
    }
  };

  const menuExportItems = [
    {
      label: 'Excel',
      icon: 'pi pi-file-excel',
      command: () => handleExportar('excel')
    },
    {
      label: 'PDF',
      icon: 'pi pi-file-pdf',
      command: () => handleExportar('pdf')
    },
    {
      label: 'SUNAT TXT',
      icon: 'pi pi-file',
      command: () => handleExportar('sunat')
    }
  ];

  // ========================================
  // TEMPLATES PARA DATATABLE (VISTA TABLA)
  // ========================================

  const numeroTemplate = (rowData, field) => {
    const valor = Number(rowData[field] || 0);
    if (Math.abs(valor) < 0.01) return <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.65rem' }}>
        {formatearNumero(valor, 2)}
      </span>
    );
  };

  const activoTemplate = (rowData) => {
    if (rowData.tipoCuenta !== 'ACTIVO') return <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>-</span>;
    const saldoNeto = (rowData.saldoFinalDebe || 0) - (rowData.saldoFinalHaber || 0);
    if (Math.abs(saldoNeto) < 0.01) return <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: saldoNeto >= 0 ? '#10B981' : '#EF4444' }}>
        {formatearNumero(saldoNeto, 2)}
      </span>
    );
  };

  const pasivoPatTemplate = (rowData) => {
    if (rowData.tipoCuenta !== 'PASIVO' && rowData.tipoCuenta !== 'PATRIMONIO') {
      return <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>-</span>;
    }
    const saldoNeto = (rowData.saldoFinalHaber || 0) - (rowData.saldoFinalDebe || 0);
    if (Math.abs(saldoNeto) < 0.01) return <span style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>-</span>;
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: saldoNeto >= 0 ? '#F59E0B' : '#EF4444' }}>
        {formatearNumero(saldoNeto, 2)}
      </span>
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
        {formatearNumero(total, 2)}
      </div>
    );
  };

  const footerTemplate = (field) => {
    const total = cuentasFiltradas.reduce((sum, c) => sum + (Number(c[field]) || 0), 0);
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.65rem', backgroundColor: '#FFFF00', padding: '0.3rem' }}>
        {formatearNumero(total, 2)}
      </div>
    );
  };

  // ========================================
  // TEMPLATES PARA TREETABLE (VISTA ÁRBOL)
  // ========================================

  const denominacionTreeTemplate = (node) => {
    const nivel = node.data.nivel;

    if (nivel === 'clasificacion') {
      return (
        <div style={{
          fontWeight: 'bold',
          fontSize: '0.9rem',
          color: '#1565C0',
          textTransform: 'uppercase',
          padding: '0.5rem 0',
          borderBottom: '2px solid #1565C0'
        }}>
          {node.data.denominacion}
        </div>
      );
    }

    if (nivel === 'rubro') {
      return (
        <div style={{ fontSize: '0.85rem', paddingLeft: '1rem' }}>
          {node.data.denominacion}
        </div>
      );
    }

    return (
      <span style={{ fontSize: '0.8rem' }}>
        {node.data.denominacion}
      </span>
    );
  };

  const anexoTreeTemplate = (node) => {
    if (!node.data.anexo) {
      return <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>-</span>;
    }

    return (
      <Button
        label={`Anexo ${node.data.anexo}`}
        link
        size="small"
        style={{ fontSize: '0.75rem', color: '#1976D2', padding: '0.25rem' }}
        onClick={() => abrirAnexo(node.data.anexo)}
      />
    );
  };

  const montoTreeTemplate = (node) => {
    const monto = Number(node.data.monto || 0);

    if (Math.abs(monto) < 0.01) {
      return <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>-</span>;
    }

    let fontSize = '0.8rem';
    let fontWeight = 'normal';

    if (node.data.nivel === 'clasificacion') {
      fontSize = '0.9rem';
      fontWeight = 'bold';
    } else if (node.data.nivel === 'rubro') {
      fontSize = '0.85rem';
      fontWeight = '500';
    }

    return (
      <span style={{ fontSize, fontWeight }}>
        {formatearNumero(monto, 2)}
      </span>
    );
  };

  // ========================================
  // OPCIONES Y CONFIGURACIÓN
  // ========================================

  const getSaldoInicialButtonConfig = () => {
    switch (filtroSaldoInicial) {
      case 'TODOS':
        return { label: '📊 Todos Los Asientos', severity: 'info' };
      case 'SOLO_SALDOS':
        return { label: '💾 Solo Saldos Iniciales', severity: 'warning' };
      case 'SIN_SALDOS':
        return { label: '🚫 Sin Saldos Iniciales', severity: 'danger' };
      default:
        return { label: '📊 Todos Los Asientos', severity: 'info' };
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

  const limpiarFiltros = () => {
    setRangoFechas(null);
    setFiltroEsGerencial(false);
    setTipoLibroIdFiltro(null);
    setMonedaIdFiltro(null);
    setNivelDetalle(6);
    setFiltroSaldoInicial('TODOS');
    setBuscarCuenta('');
  };

  const nivelesOptions = [
    { label: '2️⃣ Clase (10, 12, 20)', value: 2 },
    { label: '3️⃣ Cuenta (101, 121)', value: 3 },
    { label: '4️⃣ Subcuenta (1011)', value: 4 },
    { label: '5️⃣ Divisionaria (10111)', value: 5 },
    { label: '6️⃣ Subdivisionaria (101110)', value: 6 }
  ];

  const buttonConfig = getSaldoInicialButtonConfig();

  const expandirTodo = (tipo) => {
    const arbol = tipo === 'ACTIVO' ? arbolActivo : arbolPasivoPatrimonio;
    const keys = {};

    const expandirNodos = (nodos) => {
      nodos.forEach(nodo => {
        keys[nodo.key] = true;
        if (nodo.children && nodo.children.length > 0) {
          expandirNodos(nodo.children);
        }
      });
    };

    expandirNodos(arbol);

    if (tipo === 'ACTIVO') {
      setExpandedKeysActivo(keys);
    } else {
      setExpandedKeysPasivo(keys);
    }
  };

  const colapsarTodo = (tipo) => {
    if (tipo === 'ACTIVO') {
      setExpandedKeysActivo({});
    } else {
      setExpandedKeysPasivo({});
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div>
      <style>{`
        /* Reducir altura de filas del TreeTable para mayor eficiencia vertical */
        .p-treetable .p-treetable-tbody > tr > td {
          padding: 0.25rem 0.5rem !important;
          line-height: 1.2 !important;
        }
        
        /* Reducir altura del header */
        .p-treetable .p-treetable-thead > tr > th {
          padding: 0.4rem 0.5rem !important;
        }
        
        /* Reducir espacio del expander */
        .p-treetable .p-treetable-toggler {
          width: 1.5rem !important;
          height: 1.5rem !important;
        }
        
        /* Ajustar iconos del expander */
        .p-treetable .p-treetable-toggler .p-icon {
          font-size: 0.75rem !important;
        }
      `}</style>

      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />

      <div className="card">
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <h2>📊 Balance General</h2>
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label={vistaArbol ? "Ver Tabla Tradicional" : "Ver Balance por Grupos"}
              icon={vistaArbol ? "pi pi-table" : "pi pi-sitemap"}
              onClick={() => setVistaArbol(!vistaArbol)}
              outlined
              size="small"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Empresa*</label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => setEmpresaIdSelector(id)}
            />
          </div>
          <div style={{ flex: 1 }}>
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

          <div style={{ flex: 1 }}>
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
              style={{ width: "100%" }}
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

        {/* INDICADOR DE CUADRATURA */}
        {Math.abs(totalActivo - totalPasivoPatrimonio) > 0.01 && (
          <Message
            severity="error"
            text={`⚠️ Balance descuadrado: Diferencia de S/. ${formatearNumero(Math.abs(totalActivo - totalPasivoPatrimonio), 2)}`}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* VISTA ÁRBOL (DOS TREETABLES PARALELOS) */}
        {vistaArbol && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* PANEL IZQUIERDO: ACTIVO */}
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>ACTIVO</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      icon="pi pi-plus"
                      size="small"
                      text
                      onClick={() => expandirTodo('ACTIVO')}
                      tooltip="Expandir todo"
                    />
                    <Button
                      icon="pi pi-minus"
                      size="small"
                      text
                      onClick={() => colapsarTodo('ACTIVO')}
                      tooltip="Colapsar todo"
                    />
                  </div>
                </div>
              }
              style={{ height: '100%' }}
            >
              <TreeTable
                value={arbolActivo}
                expandedKeys={expandedKeysActivo}
                onToggle={(e) => setExpandedKeysActivo(e.value)}
                loading={loading}
                emptyMessage="No hay datos de activo"
                scrollable
                scrollHeight="calc(100vh - 400px)"
              >
                <Column
                  field="denominacion"
                  header="Denominación"
                  expander
                  body={denominacionTreeTemplate}
                  style={{ width: '50%' }}
                  headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                />
                <Column
                  field="anexo"
                  header="Anexo"
                  body={anexoTreeTemplate}
                  style={{ width: '25%', textAlign: 'center' }}
                  headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}
                />
                <Column
                  field="monto"
                  header="Monto"
                  body={montoTreeTemplate}
                  bodyStyle={{ textAlign: 'right' }}
                  style={{ width: '25%' }}
                  headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right' }}
                />
              </TreeTable>

              <Divider />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                backgroundColor: '#E3F2FD',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '2px solid #1976D2'
              }}>
                <span>TOTAL ACTIVO</span>
                <span>S/. {formatearNumero(totalActivo, 2)}</span>
              </div>
            </Card>

            {/* PANEL DERECHO: PASIVO Y PATRIMONIO */}
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>PASIVO Y PATRIMONIO</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      icon="pi pi-plus"
                      size="small"
                      text
                      onClick={() => expandirTodo('PASIVO')}
                      tooltip="Expandir todo"
                    />
                    <Button
                      icon="pi pi-minus"
                      size="small"
                      text
                      onClick={() => colapsarTodo('PASIVO')}
                      tooltip="Colapsar todo"
                    />
                  </div>
                </div>
              }
              style={{ height: '100%' }}
            >
              <TreeTable
                value={arbolPasivoPatrimonio}
                expandedKeys={expandedKeysPasivo}
                onToggle={(e) => setExpandedKeysPasivo(e.value)}
                loading={loading}
                emptyMessage="No hay datos de pasivo y patrimonio"
                scrollable
                scrollHeight="calc(100vh - 400px)"
              >
                <Column
                  field="denominacion"
                  header="Denominación"
                  expander
                  body={denominacionTreeTemplate}
                  style={{ width: '50%' }}
                  headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                />
                <Column
                  field="anexo"
                  header="Anexo"
                  body={anexoTreeTemplate}
                  style={{ width: '25%', textAlign: 'center' }}
                  headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}
                />
                <Column
                  field="monto"
                  header="Monto"
                  body={montoTreeTemplate}
                  bodyStyle={{ textAlign: 'right' }}
                  style={{ width: '25%' }}
                  headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right' }}
                />
              </TreeTable>

              <Divider />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                backgroundColor: '#E3F2FD',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '2px solid #1976D2'
              }}>
                <span>TOTAL PASIVO + PATRIMONIO</span>
                <span>S/. {formatearNumero(totalPasivoPatrimonio, 2)}</span>
              </div>
            </Card>
          </div>
        )}

        {/* VISTA TABLA TRADICIONAL */}
        {!vistaArbol && (
          <DataTable
            value={cuentasFiltradas}
            loading={loading}
            paginator
            rows={100}
            rowsPerPageOptions={[25, 50, 100, 200]}
            emptyMessage="No se encontraron cuentas"
            size="small"
            stripedRows
            showGridlines
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            dataKey="id"
          >
            <Column
              field="codigoCuenta"
              header="Código"
              style={{ fontSize: '0.7rem', width: '100px' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold' }}
            />
            <Column
              field="nombreCuenta"
              header="Denominación"
              style={{ fontSize: '0.7rem' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold' }}
            />
            <Column
              field="saldoInicialDebe"
              header="SI Debe"
              body={(rowData) => numeroTemplate(rowData, 'saldoInicialDebe')}
              footer={() => footerTemplate('saldoInicialDebe')}
              style={{ width: '100px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              field="saldoInicialHaber"
              header="SI Haber"
              body={(rowData) => numeroTemplate(rowData, 'saldoInicialHaber')}
              footer={() => footerTemplate('saldoInicialHaber')}
              style={{ width: '100px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              field="debe"
              header="Mov Debe"
              body={(rowData) => numeroTemplate(rowData, 'debe')}
              footer={() => footerTemplate('debe')}
              style={{ width: '100px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              field="haber"
              header="Mov Haber"
              body={(rowData) => numeroTemplate(rowData, 'haber')}
              footer={() => footerTemplate('haber')}
              style={{ width: '100px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              field="saldoFinalDebe"
              header="SF Debe"
              body={(rowData) => numeroTemplate(rowData, 'saldoFinalDebe')}
              footer={() => footerTemplate('saldoFinalDebe')}
              style={{ width: '100px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              field="saldoFinalHaber"
              header="SF Haber"
              body={(rowData) => numeroTemplate(rowData, 'saldoFinalHaber')}
              footer={() => footerTemplate('saldoFinalHaber')}
              style={{ width: '100px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              header="Activo"
              body={activoTemplate}
              footer={() => footerBalanceGeneral('ACTIVO')}
              style={{ width: '120px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
            <Column
              header="Pasivo+Pat"
              body={pasivoPatTemplate}
              footer={() => footerBalanceGeneral('PASIVO_PAT')}
              style={{ width: '120px', textAlign: 'right' }}
              headerStyle={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      {/* VISOR DE ANEXOS */}
      {showAnexo && anexoActual && (
        <AnexoViewer
          visible={showAnexo}
          onHide={cerrarAnexo}
          numeroAnexo={anexoActual}
          todasLasCuentas={cuentas}
          empresaData={empresas.find(e => Number(e.id) === Number(empresaIdSelector))}
          periodoData={periodos.find(p => Number(p.id) === Number(periodoSeleccionado))}
          onAnexoAnterior={navegarAnexoAnterior}
          onAnexoSiguiente={navegarAnexoSiguiente}
          tieneAnterior={tieneAnexoAnterior}
          tieneSiguiente={tieneAnexoSiguiente}
        />
      )}

      {showExcelViewer && reportData && (
        <TemporaryExcelViewer
          visible={showExcelViewer}
          onHide={() => setShowExcelViewer(false)}
          generateExcel={generarBalanceGeneralExcel}
          data={reportData}
          fileName={`Balance_General_${reportData.periodo?.nombrePeriodo || 'reporte'}.xlsx`}
          title="Balance General"
        />
      )}

      {showPDFViewer && reportData && (
        <TemporaryPDFViewer
          visible={showPDFViewer}
          onHide={() => setShowPDFViewer(false)}
          generatePDF={generarBalanceGeneralPDF}
          data={reportData}
          fileName={`Balance_General_${reportData.periodo?.nombrePeriodo || 'reporte'}.pdf`}
          title="Balance General"
        />
      )}
    </div>
  );
};

export default BalanceGeneral;
