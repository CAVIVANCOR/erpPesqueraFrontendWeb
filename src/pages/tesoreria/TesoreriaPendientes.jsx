import React, { useState, useEffect, useRef, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

// Components
import PendientesHeader from "./components/PendientesHeader";
import PendientesTable from "./components/PendientesTable";
import SaldosCuentasPanel from "./components/SaldosCuentasPanel";
import FiltrosDialog from "./components/filtros/FiltrosDialog";
import PagoCuentaPorCobrarForm from "../../components/pagoCuentaPorCobrar/PagoCuentaPorCobrarForm";
import PagarCuentaPorCobrarEspecializadoDialog from "../../components/pagoCuentaPorCobrar/PagarCuentaPorCobrarEspecializadoDialog";
import PagarCuentaPorPagarEspecializadoDialog from "../../components/pagoCuentaPorPagar/PagarCuentaPorPagarEspecializadoDialog";
import EntregarFondosForm from "../../components/movimientoCaja/AsignacionEntregaARendirEspecializada/EntregarFondosForm";
import PagoDeudasPersonalEspecializadoForm from "../../components/movimientoCaja/DeudasPersonalPagoEspecializado/PagoDeudasPersonalEspecializadoForm";
import usePagarDeudasPersonalMultiple from "../../components/movimientoCaja/DeudasPersonalPagoEspecializado/usePagarDeudasPersonalMultiple";
import PagoDeudasTributariasEspecializadoForm from "../../components/movimientoCaja/DeudasTributariasPagoEspecializado/PagoDeudasTributariasEspecializadoForm";
import usePagarDeudasTributariasMultiple from "../../components/movimientoCaja/DeudasTributariasPagoEspecializado/usePagarDeudasTributariasMultiple";
import CobroMultipleEspecializadoForm from "../../components/pagoCuentaPorCobrar/CobroMultipleEspecializado/CobroMultipleEspecializadoForm";
import useCobrarFacturasMultiple from "../../components/pagoCuentaPorCobrar/CobroMultipleEspecializado/useCobrarFacturasMultiple";
import PagoMultipleEspecializadoForm from "../../components/pagoCuentaPorPagar/PagoMultipleEspecializado/PagoMultipleEspecializadoForm";
import usePagarFacturasMultiple from "../../components/pagoCuentaPorPagar/PagoMultipleEspecializado/usePagarFacturasMultiple";
import OperacionPrestamoForm from "../../components/movimientoCaja/PrestamosPagoEspecializado/OperacionPrestamoForm";
import useOperacionPrestamo from "../../components/movimientoCaja/PrestamosPagoEspecializado/useOperacionPrestamo";
import EmpresaSelector from "../../components/common/EmpresaSelector";  // ✅ AGREGAR
import TransferenciaInternaDialog from "../../components/movimientoCaja/transferenciaEspecializada/TransferenciaInternaDialog";
import DetMovsRendicionGastosForm from "../../components/rendicionGastos/DetMovsRendicionGastosForm";
import PagarGastoDirectoDialog from "../../components/movimientoCaja/GastoDirectoEspecializado/PagarGastoDirectoDialog";
import {
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  getDetMovsEntregaRendirPorId,
} from "../../api/detMovsEntregaRendir";
import { getPersonalActivoPorEmpresa } from "../../api/personal";
import { getCentrosCosto } from "../../api/centroCosto";
import { getAllCategoriaTipoMovEntregaRendir } from "../../api/categoriaTipoMovEntregaRendir";
import { getEntidadesComercialesPorEmpresa } from "../../api/entidadComercial";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { getProductos } from "../../api/producto";
import { getEntidadComercialPorId } from "../../api/entidadComercial";
import { getCuentaPorCobrarById } from "../../api/cuentasPorCobrarPagar/cuentaPorCobrar";
import { getCuentaPorPagarById } from "../../api/cuentasPorCobrarPagar/cuentaPorPagar";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
// Hooks
import usePendientesData from "./hooks/usePendientesData";
import useSaldosCuentas from "./hooks/useSaldosCuentas";
import useRegistrarPago from "./hooks/useRegistrarPago";
import useEntregarFondos from "../../components/movimientoCaja/AsignacionEntregaARendirEspecializada/useEntregarFondos";
import { useFiltrosOpciones } from "./hooks/useFiltrosOpciones";
// APIs
import { getAllMonedas } from "../../api/moneda";
import { getMediosPago } from "../../api/medioPago";
import { getAllBancos } from "../../api/banco";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getAllEmpresas } from "../../api/empresa";  // ✅ AGREGAR AL INICIO
import {
  TIPO_FILTRO_TESORERIA,
  TIPO_DEUDA_TESORERIA,
  TIPO_VENCIMIENTO_TESORERIA,
  TIPO_OPERACION_TESORERIA,
} from "../../utils/tesoreria.constants";
// Utils
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
import { getAllTiposDetraccion } from "../../api/tipoDetraccion";
import { getTiposRetencionPercepcion } from "../../api/tesoreria/tipoRetencionPercepcion";
import ActualizarCuotasVencidasButton from "../../components/tesoreria/ActualizarCuotasVencidasButton";

const TesoreriaPendientes = () => {
  // Refs
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [showEntregaFondosDialog, setShowEntregaFondosDialog] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  // Pago múltiple (especializado) de Deudas con Personal y de Deudas Tributarias
  const [seleccionDeudas, setSeleccionDeudas] = useState([]);
  // Copia de las deudas al abrir el diálogo (null = cerrado): el formulario no debe verse afectado por recargas
  const [deudasPagoMultiple, setDeudasPagoMultiple] = useState(null);
  // Qué formulario de pago múltiple se abrió: "PERSONAL" | "TRIBUTARIA"
  const [tipoPagoMultiple, setTipoPagoMultiple] = useState(null);
  const [showPagoEspecializadoDialog, setShowPagoEspecializadoDialog] = useState(false);
  const [cuentaPorCobrarEspecializada, setCuentaPorCobrarEspecializada] = useState(null);
  const [showPagoEspecializadoCxPDialog, setShowPagoEspecializadoCxPDialog] = useState(false);
  const [cuentaPorPagarEspecializada, setCuentaPorPagarEspecializada] = useState(null);
  // 🆕 Estados para diálogos de operaciones
  const [showTransferenciaInternaDialog, setShowTransferenciaInternaDialog] = useState(false);
  const [showPagoProveedorDialog, setShowPagoProveedorDialog] = useState(false);
  const [showRetiroDineroDialog, setShowRetiroDineroDialog] = useState(false);
  const [showIngresoDineroDialog, setShowIngresoDineroDialog] = useState(false);
  // Gasto Urgente ya no se usa como operación independiente; ahora está dentro de Gastos Directos
  const [showGastosDirectosDialog, setShowGastosDirectosDialog] = useState(false);
  const [showGastoDirectoFormDialog, setShowGastoDirectoFormDialog] = useState(false);
  const [gastoDirectoFormMode, setGastoDirectoFormMode] = useState(null); // 'crear' | 'editar'
  const [gastoDirectoSeleccionado, setGastoDirectoSeleccionado] = useState(null);
  const [showPagarGastoDirectoDialog, setShowPagarGastoDirectoDialog] = useState(false);
  const [pagoGastoDirectoCxPId, setPagoGastoDirectoCxPId] = useState(null);
  const [pagoGastoDirectoDetMovId, setPagoGastoDirectoDetMovId] = useState(null);
  const [pagoGastoDirectoTipoMovId, setPagoGastoDirectoTipoMovId] = useState(null);
  const [catalogosGastoDirecto, setCatalogosGastoDirecto] = useState({
    personal: [],
    centrosCosto: [],
    categorias: [],
    entidadesComerciales: [],
    tiposDocumento: [],
    productos: [],
    movimientosAsignacion: [],
    loading: false,
  });

  const [filtros, setFiltros] = useState({
    empresaId: usuario?.empresaId || null,
    tipo: TIPO_FILTRO_TESORERIA.TODOS,
    vencimiento: TIPO_VENCIMIENTO_TESORERIA.TODOS,
    monedaId: null,
    tipoDeuda: TIPO_DEUDA_TESORERIA.NINGUNO,
    // Filtros dinámicos avanzados
    fechaDesde: null,
    fechaHasta: null,
    clienteIds: [],
    proveedorIds: [],
    entidadComercialIds: [],
    tipoDocumentoIds: [],
    numeroDocumento: '',
    monedaIds: [],
    estadoIds: [],
    personalIds: [],
    tipoDeudaIds: [],
    bancoIds: [],
    tipoPrestamoIds: [],
    prestamoIds: [],
    montoDesde: null,
    montoHasta: null,
  });
  
  // Estado para el diálogo de filtros avanzados
  const [showFiltrosDialog, setShowFiltrosDialog] = useState(false);
  // Estados para catálogos
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [estadosCxC, setEstadosCxC] = useState([]);
  const [estadosCxP, setEstadosCxP] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [empresas, setEmpresas] = useState([]);  // ✅ AGREGAR
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [tiposDetraccion, setTiposDetraccion] = useState([]);
  const [tiposRetencionPercepcion, setTiposRetencionPercepcion] = useState([]);
  // Hooks personalizados
  const {
    pendientes,
    resumen,
    loading: loadingPendientes,
    error: errorPendientes,
    recargarPendientes,
    permisos,
  } = usePendientesData(filtros);

  const {
    saldosCuentas,
    saldoConsolidado,
    loading: loadingSaldos,
    error: errorSaldos,
    recargarSaldos,
  } = useSaldosCuentas(filtros.empresaId);

  const { registrarPago, loading: loadingPago } = useRegistrarPago({
    toast,
    onSuccess: () => {
      setShowPagoDialog(false);
      setDocumentoSeleccionado(null);
      recargarPendientes();
      recargarSaldos();
    },
  });


  // El diálogo no se cierra aquí: EntregarFondosForm lo cierra al cerrar la confirmación
  const { entregarFondos, loading: loadingEntrega } = useEntregarFondos({
    toast,
    onSuccess: () => {
      recargarPendientes();
      recargarSaldos();
    },
  });

  const { pagarDeudas: pagarDeudasMultiple, loading: loadingPagoMultiple } = usePagarDeudasPersonalMultiple({
    toast,
    onSuccess: () => {
      setSeleccionDeudas([]);
      recargarPendientes();
      recargarSaldos();
    },
  });

  const { pagarDeudas: pagarDeudasTributariasMultiple, loading: loadingPagoTributariasMultiple } =
    usePagarDeudasTributariasMultiple({
      toast,
      onSuccess: () => {
        setSeleccionDeudas([]);
        recargarPendientes();
        recargarSaldos();
      },
    });

  const { cobrarFacturas: cobrarFacturasMultiple, loading: loadingCobroMultiple } =
    useCobrarFacturasMultiple({
      toast,
      onSuccess: () => {
        setSeleccionDeudas([]);
        recargarPendientes();
        recargarSaldos();
      },
    });

  const { pagarFacturas: pagarFacturasMultiple, loading: loadingPagoFacturasMultiple } =
    usePagarFacturasMultiple({
      toast,
      onSuccess: () => {
        setSeleccionDeudas([]);
        recargarPendientes();
        recargarSaldos();
      },
    });

  const { pagarCuotas: pagarCuotasPrestamo, desembolsar: desembolsarPrestamo, loading: loadingOperacionPrestamo } =
    useOperacionPrestamo({
      toast,
      onSuccess: () => {
        setSeleccionDeudas([]);
        recargarPendientes();
        recargarSaldos();
      },
    });

  // Sección activa: determina qué filas se pueden seleccionar y qué formulario se abre
  const esDeudasPersonal = filtros.tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_PERSONAL;
  const esDeudasTributarias = filtros.tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_TRIBUTARIAS;
  // Préstamos: pago de cuotas (egreso) y desembolso (ingreso), con un formulario común de dos modos
  const esPrestamoCuotas = filtros.tipoDeuda === TIPO_DEUDA_TESORERIA.PRESTAMOS_CUOTAS;
  const esPrestamoDesembolsos = filtros.tipoDeuda === TIPO_DEUDA_TESORERIA.PRESTAMOS_DESEMBOLSOS;
  const hayFiltroDeuda =
    esDeudasPersonal || esDeudasTributarias || esPrestamoCuotas || esPrestamoDesembolsos;
  // Cuentas por Cobrar (sin filtro de deuda): cobro múltiple de facturas de un cliente
  const esCobrar = !hayFiltroDeuda && filtros.tipo === TIPO_FILTRO_TESORERIA.COBRAR;
  // Cuentas por Pagar (sin filtro de deuda): pago múltiple de facturas de un proveedor
  const esPagar = !hayFiltroDeuda && filtros.tipo === TIPO_FILTRO_TESORERIA.PAGAR;
  const esFilaSeleccionable = (p) => {
    if (esCobrar) return p.esCuentaPorCobrar;
    if (esPagar) return p.esCuentaPorPagar;
    if (esPrestamoCuotas) return p.esCuotaPrestamo;
    if (esPrestamoDesembolsos) return p.esDesembolsoPrestamo;
    return esDeudasTributarias ? p.esDeudaTributaria : p.esDeudaPersonal;
  };

  // Selección vigente: solo filas de la sección activa que siguen en la lista actual
  // (los IDs de DeudaConPersonal, DeudaTributaria, CuentaPorCobrar y CuentaPorPagar pueden coincidir entre sí)
  const deudasSeleccionadas = useMemo(
    () => seleccionDeudas.filter((s) => pendientes.some((p) => esFilaSeleccionable(p) && p.id === s.id)),
    [seleccionDeudas, pendientes, esDeudasTributarias, esCobrar, esPagar, esPrestamoCuotas, esPrestamoDesembolsos],
  );

  const etiquetaTotalSeleccion = useMemo(() => {
    const totales = deudasSeleccionadas.reduce((acc, d) => {
      const simbolo = d.moneda?.simbolo || "";
      acc[simbolo] = (acc[simbolo] || 0) + Number(d.saldoPendiente || 0);
      return acc;
    }, {});
    return Object.entries(totales).map(([s, t]) => `${s} ${formatearNumero(t)}`).join(" | ");
  }, [deudasSeleccionadas]);

  // Hook para opciones dinámicas de filtros
  const opcionesFiltros = useFiltrosOpciones(pendientes, filtros.tipo);

  // Handlers para filtros avanzados
  const handleOpenFiltrosDialog = () => {
    setShowFiltrosDialog(true);
  };

  const handleAplicarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    // El hook usePendientesData detectará el cambio y recargará automáticamente
  };

  // Verificar acceso
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);
        const [
          monedasData,
          mediosPagoData,
          bancosData,
          estadosData,
          periodosData,
          empresasData,
          tiposMovimientoData,
          tiposDetraccionData,
          tiposRetencionPercepcionData,
          estadosCxCData,
          estadosCxPData,
        ] = await Promise.all([
          getAllMonedas(),
          getMediosPago(),
          getAllBancos(),
          getEstadosMultiFuncion(),
          getPeriodosContables(),
          getAllEmpresas(),
          getAllTipoMovEntregaRendir(),
          getAllTiposDetraccion(),
          getTiposRetencionPercepcion(),
          getEstadosMultiFuncionPorTipoProviene(24), // Estados de Cuenta por Cobrar
          getEstadosMultiFuncionPorTipoProviene(25), // Estados de Cuenta por Pagar
        ]);
        setMonedas(monedasData);
        setMediosPago(mediosPagoData);
        setBancos(bancosData);
        setEstados(estadosData);
        setPeriodosContables(periodosData);
        setEmpresas(empresasData || []);
        setTiposMovimiento(tiposMovimientoData || []);
        setTiposDetraccion(tiposDetraccionData || []);
        setTiposRetencionPercepcion(tiposRetencionPercepcionData || []);
        setEstadosCxC(estadosCxCData || []);
        setEstadosCxP(estadosCxPData || []);
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar catálogos necesarios",
          life: 3000,
        });
      } finally {
        setLoadingCatalogos(false);
      }
    };

    cargarCatalogos();
  }, []);

  // Effects
  useEffect(() => {
    if (errorPendientes) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorPendientes,
        life: 3000,
      });
    }
  }, [errorPendientes]);

  useEffect(() => {
    if (errorSaldos) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorSaldos,
        life: 3000,
      });
    }
  }, [errorSaldos]);

  // Handlers
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => {
      const nuevosFiltros = {
        ...prev,
        [campo]: valor,
      };

      // Limpiar filtros mutuamente excluyentes
      // tipo y tipoDeuda son mutuamente excluyentes
      if (campo === 'tipo') {
        // Si se cambia 'tipo', limpiar 'tipoDeuda'
        nuevosFiltros.tipoDeuda = TIPO_DEUDA_TESORERIA.NINGUNO;
      }
      else if (campo === 'tipoDeuda') {
        // Si se cambia 'tipoDeuda', NO cambiar 'tipo'
        // El backend manejará la exclusión automáticamente cuando tipoDeuda tenga valor
      }

      // Al cambiar de sección las opciones avanzadas dejan de ser válidas: limpiarlas
      if (campo === 'tipo' || campo === 'tipoDeuda') {
        Object.assign(nuevosFiltros, {
          fechaDesde: null,
          fechaHasta: null,
          clienteIds: [],
          proveedorIds: [],
          entidadComercialIds: [],
          tipoDocumentoIds: [],
          numeroDocumento: '',
          monedaIds: [],
          estadoIds: [],
          personalIds: [],
          tipoDeudaIds: [],
          bancoIds: [],
          tipoPrestamoIds: [],
          prestamoIds: [],
          montoDesde: null,
          montoHasta: null,
        });
      }

      return nuevosFiltros;
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      empresaId: usuario?.empresaId || null,
      tipo: TIPO_FILTRO_TESORERIA.TODOS,
      vencimiento: TIPO_VENCIMIENTO_TESORERIA.TODOS,
      monedaId: null,
      tipoDeuda: TIPO_DEUDA_TESORERIA.NINGUNO,
    });
  };


  // El pago individual usa el pago múltiple especializado con una sola deuda
  // (el flujo individual antiguo ya no es compatible con el modelo MovimientoCaja)
  const handlePagarDeudaTributaria = (deuda) => {
    setTipoPagoMultiple("TRIBUTARIA");
    setDeudasPagoMultiple([deuda]);
  };

  const handleRegistrarPago = (documento) => {
    setDocumentoSeleccionado(documento);
    setShowPagoDialog(true);
  };

  const handleGuardarPago = async (formData) => {
    // El formData ya viene con el formato correcto desde PagoCuentaPorCobrarForm
    // Solo necesitamos agregar campos específicos de Tesorería Pendientes
    const datosPago = {
      ...formData,
      tipo: documentoSeleccionado.tipo === "INGRESO" ? "COBRAR" : "PAGAR",
      cuentaPorCobrarId:
        documentoSeleccionado.tipo === "INGRESO"
          ? documentoSeleccionado.origenId
          : null,
      cuentaPorPagarId:
        documentoSeleccionado.tipo === "EGRESO"
          ? documentoSeleccionado.origenId
          : null,
      empresaId: documentoSeleccionado.empresa?.id,
    };

    await registrarPago(datosPago);
  };

  const handleCancelarPago = () => {
    setShowPagoDialog(false);
    setDocumentoSeleccionado(null);
  };


  const handleEntregarFondos = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setShowEntregaFondosDialog(true);
  };

  // Devuelve el resultado: EntregarFondosForm lo necesita para generar los vouchers
  // y mostrar la confirmación con los movimientos y asientos creados
  const handleGuardarEntrega = async (formData) => {
    return await entregarFondos(formData);
  };

  const handlePagoEspecializado = async (documento) => {
    try {

      // Cargar el cliente específico de esta CxC
      const clienteData = await getEntidadComercialPorId(documento.entidadComercial?.id);
      setClientes([clienteData]);

      // Cargar la CuentaPorCobrar completa desde el backend para obtener periodoContableId
      const cuentaPorCobrarCompleta = await getCuentaPorCobrarById(documento.origenId);

      // Convertir documento de pendientes a formato de cuenta por cobrar
      const cuentaPorCobrar = {
        ...cuentaPorCobrarCompleta, // ⭐ Usar todos los datos del backend
        cliente: documento.entidadComercial, // Mantener el objeto cliente del documento
        moneda: documento.moneda, // Mantener el objeto moneda del documento
        estado: documento.estado, // Mantener el objeto estado del documento
      };

      setCuentaPorCobrarEspecializada(cuentaPorCobrar);
      setShowPagoEspecializadoDialog(true);
    } catch (error) {
      console.error("Error al cargar cliente:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la información del cliente",
        life: 3000,
      });
    }
  };
  const handleCancelarPagoEspecializado = () => {
    setShowPagoEspecializadoDialog(false);
    setCuentaPorCobrarEspecializada(null);
  };

  const handleSuccessPagoEspecializado = () => {
    setShowPagoEspecializadoDialog(false);
    setCuentaPorCobrarEspecializada(null);
    recargarPendientes();
    recargarSaldos();
  };

  // ════════════════════════════════════════════════════════════
  // HANDLERS: PAGO ESPECIALIZADO CUENTA POR PAGAR
  // ════════════════════════════════════════════════════════════

  const handlePagoEspecializadoCxP = async (documento) => {
    try {
      // Cargar el proveedor específico de esta CxP
      const proveedorData = await getEntidadComercialPorId(documento.entidadComercial?.id);
      setProveedores([proveedorData]);

      // Cargar la CuentaPorPagar completa desde el backend
      const cuentaPorPagarCompleta = await getCuentaPorPagarById(documento.origenId);

      // Convertir documento de pendientes a formato de cuenta por pagar
      const cuentaPorPagar = {
        ...cuentaPorPagarCompleta,
        proveedor: documento.entidadComercial,
        moneda: documento.moneda,
        estado: documento.estado,
      };

      setCuentaPorPagarEspecializada(cuentaPorPagar);
      setShowPagoEspecializadoCxPDialog(true);
    } catch (error) {
      console.error("Error al cargar proveedor:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la información del proveedor",
        life: 3000,
      });
    }
  };

  const handleCancelarPagoEspecializadoCxP = () => {
    setShowPagoEspecializadoCxPDialog(false);
    setCuentaPorPagarEspecializada(null);
  };

  const handleSuccessPagoEspecializadoCxP = () => {
    setShowPagoEspecializadoCxPDialog(false);
    setCuentaPorPagarEspecializada(null);
    recargarPendientes();
    recargarSaldos();
  };

  const handleCancelarEntrega = () => {
    setShowEntregaFondosDialog(false);
    setAsignacionSeleccionada(null);
  };

  // Pago múltiple: toma las filas frescas de la lista, no las del estado de selección
  const handlePagarSeleccionadas = () => {
    const ids = new Set(deudasSeleccionadas.map((d) => d.id));
    setTipoPagoMultiple(
      esCobrar
        ? "COBRAR"
        : esPagar
          ? "PAGAR"
          : esPrestamoCuotas
            ? "PRESTAMO_CUOTAS"
            : esPrestamoDesembolsos
              ? "PRESTAMO_DESEMBOLSO"
              : esDeudasTributarias
                ? "TRIBUTARIA"
                : "PERSONAL",
    );
    setDeudasPagoMultiple(pendientes.filter((p) => esFilaSeleccionable(p) && ids.has(p.id)));
  };

  // Devuelve el resultado: el formulario lo necesita para generar vouchers y la confirmación
  const handleGuardarPagoMultiple = async (formData) => {
    if (tipoPagoMultiple === "COBRAR") return await cobrarFacturasMultiple(formData);
    if (tipoPagoMultiple === "PAGAR") return await pagarFacturasMultiple(formData);
    if (tipoPagoMultiple === "PRESTAMO_CUOTAS") return await pagarCuotasPrestamo(formData);
    if (tipoPagoMultiple === "PRESTAMO_DESEMBOLSO") return await desembolsarPrestamo(formData);
    return tipoPagoMultiple === "TRIBUTARIA"
      ? await pagarDeudasTributariasMultiple(formData)
      : await pagarDeudasMultiple(formData);
  };

  const handleCancelarPagoMultiple = () => {
    setDeudasPagoMultiple(null);
    setTipoPagoMultiple(null);
  };
  // Línea 225 - AGREGAR
  // El pago individual usa el pago múltiple especializado con una sola deuda
  // (el flujo individual antiguo ya no es compatible con el modelo MovimientoCaja)
  const handlePagarDeudaPersonal = (deuda) => {
    setTipoPagoMultiple("PERSONAL");
    setDeudasPagoMultiple([deuda]);
  };

  // 🆕 Handler para operaciones
  const handleOperacion = (operacion) => {
    switch (operacion) {
      case TIPO_OPERACION_TESORERIA.TRANSFERENCIA_INTERNA:
        setShowTransferenciaInternaDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.PAGO_PROVEEDOR:
        setShowPagoProveedorDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.RETIRO_DINERO:
        setShowRetiroDineroDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.INGRESO_DINERO:
        setShowIngresoDineroDialog(true);
        break;
      default:
        console.warn("Operación no reconocida:", operacion);
    }
  };

  // ════════════════════════════════════════════════════════════
  // GASTOS DIRECTOS
  // ════════════════════════════════════════════════════════════
  const handleGastosDirectosClick = () => {
    setShowGastosDirectosDialog(true);
  };

  const handleGastoDirectoSolicitado = () => {
    setFiltros((prev) => ({ ...prev, tipo: TIPO_FILTRO_TESORERIA.GASTOS_DIRECTOS }));
    setShowGastosDirectosDialog(false);
  };

  const cargarCatalogosGastoDirecto = async () => {
    if (catalogosGastoDirecto.loading) return;
    setCatalogosGastoDirecto((prev) => ({ ...prev, loading: true }));
    try {
      const empresaId = filtros.empresaId || usuario?.empresaId;
      const [
        personalData,
        centrosCostoData,
        categoriasData,
        entidadesData,
        tiposDocumentoData,
        productosData,
      ] = await Promise.all([
        getPersonalActivoPorEmpresa(empresaId),
        getCentrosCosto(),
        getAllCategoriaTipoMovEntregaRendir(),
        getEntidadesComercialesPorEmpresa(empresaId),
        getTiposDocumento(),
        getProductos(),
      ]);
      setCatalogosGastoDirecto({
        personal: personalData || [],
        centrosCosto: centrosCostoData || [],
        categorias: categoriasData || [],
        entidadesComerciales: entidadesData || [],
        tiposDocumento: tiposDocumentoData || [],
        productos: productosData || [],
        movimientosAsignacion: [],
        loading: false,
      });
    } catch (error) {
      console.error("Error al cargar catálogos de gasto directo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los catálogos necesarios",
        life: 3000,
      });
      setCatalogosGastoDirecto((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGastoDirectoUrgente = async () => {
    setGastoDirectoSeleccionado(null);
    setGastoDirectoFormMode("crear");
    setShowGastosDirectosDialog(false);
    setShowGastoDirectoFormDialog(true);
    await cargarCatalogosGastoDirecto();
  };

  const handleProcesarGastoDirecto = async (rowData) => {
    try {
      const movimiento = await getDetMovsEntregaRendirPorId(rowData.origenId);
      setGastoDirectoSeleccionado(movimiento);
      setGastoDirectoFormMode("editar");
      setShowGastoDirectoFormDialog(true);
      await cargarCatalogosGastoDirecto();
    } catch (error) {
      console.error("Error al cargar gasto directo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el gasto directo",
        life: 3000,
      });
    }
  };

  const refrescarGastoDirecto = async (id) => {
    try {
      const movimiento = await getDetMovsEntregaRendirPorId(id);
      setGastoDirectoSeleccionado(movimiento);
    } catch (error) {
      console.error("Error al refrescar gasto directo:", error);
    }
  };

  const handleGuardarGastoDirecto = async (data) => {
    try {
      let resultado;
      if (gastoDirectoFormMode === "crear") {
        resultado = await crearDetMovsEntregaRendir(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Gasto directo creado correctamente",
          life: 3000,
        });
      } else {
        resultado = await actualizarDetMovsEntregaRendir(gastoDirectoSeleccionado.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Gasto directo actualizado correctamente",
          life: 3000,
        });
      }
      if (resultado?.id) {
        await refrescarGastoDirecto(resultado.id);
      }
      recargarPendientes();
      // En modo creación, dejamos el formulario abierto en modo edición para que pueda generar documentos.
      if (gastoDirectoFormMode === "crear" && resultado?.id) {
        setGastoDirectoFormMode("editar");
      }
    } catch (error) {
      console.error("Error al guardar gasto directo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "Error al guardar el gasto directo",
        life: 3000,
      });
    }
  };

  const handleCerrarGastoDirectoForm = () => {
    setShowGastoDirectoFormDialog(false);
    setGastoDirectoSeleccionado(null);
    setGastoDirectoFormMode(null);
  };

  const handleGeneracionGastoDirectoExitosa = (resultado) => {
    const cxpId = resultado?.documentosGenerados?.cuentaPorPagar?.id;
    const detMovId = gastoDirectoSeleccionado?.id || resultado?.documentosGenerados?.detMovsEntregaRendirId;

    if (cxpId) {
      setPagoGastoDirectoCxPId(cxpId);
      setPagoGastoDirectoDetMovId(detMovId || null);
      setPagoGastoDirectoTipoMovId(gastoDirectoSeleccionado?.tipoMovimientoId || null);
      setShowPagarGastoDirectoDialog(true);
    } else {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Documentos generados, pero no se encontró la CxP para el pago",
        life: 3000,
      });
    }

    recargarPendientes();
    handleCerrarGastoDirectoForm();
  };

  const handlePagoGastoDirectoExitoso = () => {
    setShowPagarGastoDirectoDialog(false);
    setPagoGastoDirectoCxPId(null);
    setPagoGastoDirectoDetMovId(null);
    setPagoGastoDirectoTipoMovId(null);
    recargarPendientes();
    recargarSaldos();
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresa" className="font-bold">
            🏢 Empresa
          </label>
          <EmpresaSelector
            empresaId={usuario?.empresaId}
            onEmpresaChange={(id) => handleFiltroChange("empresaId", id)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "4px" }}>
          <ActualizarCuotasVencidasButton
            toast={toast}
            onSuccess={() => {
              recargarPendientes();
            }}
          />
        </div>
      </div>
      {/* Panel de Saldos de Cuentas Corrientes */}
      <SaldosCuentasPanel
        saldosCuentas={saldosCuentas}
        saldoConsolidado={saldoConsolidado}
        loading={loadingSaldos}
        empresaId={filtros.empresaId}
      />
      {/* Header con filtros */}
      <PendientesHeader
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onLimpiarFiltros={handleLimpiarFiltros}
        resumen={resumen}
        loading={loadingPendientes}
        permisos={permisos}
        onOperacion={handleOperacion}
        opcionesFiltros={opcionesFiltros} // ✅ NUEVO: Para filtros avanzados
        onOpenFiltrosDialog={handleOpenFiltrosDialog} // ✅ NUEVO: Para abrir diálogo
        onGastosDirectosClick={handleGastosDirectosClick} // ✅ NUEVO: Diálogo de gastos directos
      />

      {/* Diálogo de Filtros Avanzados */}
      <FiltrosDialog
        visible={showFiltrosDialog}
        tipo={filtros.tipo}
        tipoDeuda={filtros.tipoDeuda}
        filtros={filtros}
        opciones={opcionesFiltros}
        onHide={() => setShowFiltrosDialog(false)}
        onAplicarFiltros={handleAplicarFiltros}
        documentos={pendientes}
      />
      
      {/* Tabla de Pendientes */}
      <div className="flex justify-content-between align-items-center mb-2">
        <span className="text-xl font-bold">📋 Documentos Pendientes</span>
        {(hayFiltroDeuda || esCobrar || esPagar) && permisos.puedeCrear && (
          <Button
            label={`${esCobrar ? "Cobrar" : esPrestamoDesembolsos ? "Registrar desembolso" : "Pagar"}${esPrestamoDesembolsos ? "" : " seleccionados"} (${deudasSeleccionadas.length})${etiquetaTotalSeleccion ? ` · ${etiquetaTotalSeleccion}` : ""}`}
            icon="pi pi-money-bill"
            severity="success"
            disabled={deudasSeleccionadas.length === 0}
            onClick={handlePagarSeleccionadas}
          />
        )}
      </div>
      <Card>
        <PendientesTable
          pendientes={pendientes}
          loading={loadingPendientes}
          onRegistrarPago={handleRegistrarPago}
          onEntregarFondos={handleEntregarFondos}
          onPagarDeudaPersonal={handlePagarDeudaPersonal}
          onPagarDeudaTributaria={handlePagarDeudaTributaria}
          onPagoEspecializado={handlePagoEspecializado}
          onPagoEspecializadoCxP={handlePagoEspecializadoCxP}
          onProcesarGastoDirecto={handleProcesarGastoDirecto}
          permisos={permisos}
          tipo={filtros.tipo}
          tipoDeuda={filtros.tipoDeuda}
          seleccion={deudasSeleccionadas}
          onSeleccionChange={setSeleccionDeudas}
        />
      </Card>

      {/* Diálogo para registrar pago/cobro */}
      {documentoSeleccionado && (
        <Dialog
          header={`${documentoSeleccionado.tipo === "INGRESO" ? "💰 Registrar Cobro" : "💸 Registrar Pago"} - ${documentoSeleccionado.documentoNumero}`}
          visible={showPagoDialog}
          style={{ width: "90vw", maxWidth: "1200px" }}
          onHide={handleCancelarPago}
          modal
          maximizable
        >
          {/* Formulario de pago */}
          <PagoCuentaPorCobrarForm
            isEdit={false}
            defaultValues={{
              cuentaPorCobrarId:
                documentoSeleccionado.tipo === "INGRESO"
                  ? documentoSeleccionado.origenId
                  : null,
              empresaId: documentoSeleccionado.empresa?.id,
              monedaPagoId: documentoSeleccionado.moneda?.id,
              monedaDeudaId: documentoSeleccionado.moneda?.id,
              // ✅ Campos eliminados para permitir lógica automática:
              // - montoPagado: Usuario lo ingresa manualmente
              // - montoAplicadoDeuda: Se calcula automáticamente
              // - tipoCambio: Se consulta automáticamente vía API SUNAT cuando cambia fechaPago
            }}
            cuentasPorCobrar={
              documentoSeleccionado.tipo === "INGRESO"
                ? [
                  {
                    id: documentoSeleccionado.origenId,
                    numeroPreFactura: documentoSeleccionado.documentoNumero,
                    fechaEmision: documentoSeleccionado.fechaEmision,
                    clienteId: documentoSeleccionado.entidadComercial?.id,
                    empresaId: documentoSeleccionado.empresa?.id,
                    monedaId: documentoSeleccionado.moneda?.id,
                    montoTotal: documentoSeleccionado.montoTotal,
                    saldoPendiente: documentoSeleccionado.saldoPendiente,
                  },
                ]
                : []
            }
            monedas={monedas}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={saldosCuentas}
            estados={estados}
            periodosContables={periodosContables}
            onSubmit={handleGuardarPago}
            onCancel={handleCancelarPago}
            loading={loadingPago}
            readOnly={false}
            hideCuentaField={false}
            toast={toast}
            empresaIdCuenta={documentoSeleccionado.empresa?.id}
            clienteIdCuenta={documentoSeleccionado.entidadComercial?.id}
          />
        </Dialog>
      )}

      {/* Diálogo para entregar fondos (Asignaciones) */}
      {asignacionSeleccionada && (
        <Dialog
          header={`💵 Entregar Fondos - ${asignacionSeleccionada.entidadComercial?.razonSocial || 'N/A'}`}
          visible={showEntregaFondosDialog}
          style={{ width: "1300px"}}
          onHide={handleCancelarEntrega}
          modal
          maximizable
        >
          <EntregarFondosForm
            asignacion={asignacionSeleccionada}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            tiposMovimiento={tiposMovimiento}
            empresas={empresas}
            onSubmit={handleGuardarEntrega}
            onCancel={handleCancelarEntrega}
            loading={loadingEntrega}
            toast={toast}
          />
        </Dialog>
      )}

      {/* Diálogo de pago múltiple (especializado) de Deudas con Personal */}
      {deudasPagoMultiple && tipoPagoMultiple === "PERSONAL" && (
        <Dialog
          header="💵 Pagar Deudas del Personal"
          visible={true}
          style={{ width: "1300px" }}
          onHide={handleCancelarPagoMultiple}
          modal
          maximizable
        >
          <PagoDeudasPersonalEspecializadoForm
            deudas={deudasPagoMultiple}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            tiposMovimiento={tiposMovimiento}
            empresas={empresas}
            onSubmit={handleGuardarPagoMultiple}
            onCancel={handleCancelarPagoMultiple}
            loading={loadingPagoMultiple}
            toast={toast}
          />
        </Dialog>
      )}

      {/* Diálogo de cobro múltiple (especializado) de facturas de un cliente */}
      {deudasPagoMultiple && tipoPagoMultiple === "COBRAR" && (
        <Dialog
          header="💰 Cobrar Facturas del Cliente"
          visible={true}
          style={{ width: "1300px" }}
          onHide={handleCancelarPagoMultiple}
          modal
          maximizable
        >
          <CobroMultipleEspecializadoForm
            cuentasPorCobrar={deudasPagoMultiple}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            tiposMovimiento={tiposMovimiento}
            empresas={empresas}
            onSubmit={handleGuardarPagoMultiple}
            onCancel={handleCancelarPagoMultiple}
            loading={loadingCobroMultiple}
            toast={toast}
          />
        </Dialog>
      )}

      {/* Diálogo de operaciones de préstamo (especializado): pago de cuotas (egreso) o desembolso (ingreso) */}
      {deudasPagoMultiple &&
        (tipoPagoMultiple === "PRESTAMO_CUOTAS" || tipoPagoMultiple === "PRESTAMO_DESEMBOLSO") && (
          <Dialog
            header={
              tipoPagoMultiple === "PRESTAMO_DESEMBOLSO"
                ? "🏦 Desembolso de Préstamo"
                : "🏦 Pago de Cuotas de Préstamo"
            }
            visible={true}
            style={{ width: "1300px" }}
            onHide={handleCancelarPagoMultiple}
            modal
            maximizable
          >
            <OperacionPrestamoForm
              modo={tipoPagoMultiple === "PRESTAMO_DESEMBOLSO" ? "DESEMBOLSO" : "PAGO_CUOTAS"}
              filas={deudasPagoMultiple}
              cuentasCorrientes={saldosCuentas}
              mediosPago={mediosPago}
              tiposMovimiento={tiposMovimiento}
              empresas={empresas}
              onSubmit={handleGuardarPagoMultiple}
              onCancel={handleCancelarPagoMultiple}
              loading={loadingOperacionPrestamo}
              toast={toast}
            />
          </Dialog>
        )}

      {/* Diálogo de pago múltiple (especializado) de facturas de un proveedor */}
      {deudasPagoMultiple && tipoPagoMultiple === "PAGAR" && (
        <Dialog
          header="💸 Pagar Facturas del Proveedor"
          visible={true}
          style={{ width: "1300px" }}
          onHide={handleCancelarPagoMultiple}
          modal
          maximizable
        >
          <PagoMultipleEspecializadoForm
            cuentasPorPagar={deudasPagoMultiple}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            tiposMovimiento={tiposMovimiento}
            empresas={empresas}
            onSubmit={handleGuardarPagoMultiple}
            onCancel={handleCancelarPagoMultiple}
            loading={loadingPagoFacturasMultiple}
            toast={toast}
          />
        </Dialog>
      )}

      {/* Diálogo de pago múltiple (especializado) de Deudas Tributarias */}
      {deudasPagoMultiple && tipoPagoMultiple === "TRIBUTARIA" && (
        <Dialog
          header="🏛️ Pagar Deudas Tributarias"
          visible={true}
          style={{ width: "1300px" }}
          onHide={handleCancelarPagoMultiple}
          modal
          maximizable
        >
          <PagoDeudasTributariasEspecializadoForm
            deudas={deudasPagoMultiple}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            tiposMovimiento={tiposMovimiento}
            empresas={empresas}
            onSubmit={handleGuardarPagoMultiple}
            onCancel={handleCancelarPagoMultiple}
            loading={loadingPagoTributariasMultiple}
            toast={toast}
          />
        </Dialog>
      )}


      {/* Diálogo para pago especializado de cuenta por cobrar */}
      {cuentaPorCobrarEspecializada && (() => {
        return (
          <PagarCuentaPorCobrarEspecializadoDialog
            visible={showPagoEspecializadoDialog}
            onHide={handleCancelarPagoEspecializado}
            cuentaPorCobrar={cuentaPorCobrarEspecializada}
            monedas={monedas}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={saldosCuentas}
            tiposMovimiento={tiposMovimiento}
            tiposDetraccion={tiposDetraccion}
            tiposRetencionPercepcion={tiposRetencionPercepcion}
            periodosContables={periodosContables}
            empresas={empresas}
            clientes={clientes}
            estadosCxC={estadosCxC}
            toast={toast}
            onSuccess={handleSuccessPagoEspecializado}
          />
        );
      })()}

      {/* 🆕 Diálogos de Operaciones */}
      <TransferenciaInternaDialog
        visible={showTransferenciaInternaDialog}
        onHide={() => setShowTransferenciaInternaDialog(false)}
        monedas={monedas}
        mediosPago={mediosPago}
        bancos={bancos}
        cuentasCorrientes={saldosCuentas}
        tiposMovimiento={tiposMovimiento}
        empresas={empresas}
        toast={toast}
        onSuccess={() => {
          recargarSaldos();
        }}
      />

      <Dialog
        header="💸 Pago a Proveedor"
        visible={showPagoProveedorDialog}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => setShowPagoProveedorDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      <Dialog
        header="💵 Retiro de Dinero"
        visible={showRetiroDineroDialog}
        style={{ width: "90vw", maxWidth: "700px" }}
        onHide={() => setShowRetiroDineroDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      <Dialog
        header="💰 Ingreso de Dinero"
        visible={showIngresoDineroDialog}
        style={{ width: "90vw", maxWidth: "700px" }}
        onHide={() => setShowIngresoDineroDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      {/* Diálogo para elegir el tipo de Gasto Directo */}
      <Dialog
        header="🚨 Gastos Directos"
        visible={showGastosDirectosDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => setShowGastosDirectosDialog(false)}
        modal
        closable={false}
      >
        <div className="p-fluid" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, color: "#555" }}>
            Seleccione el tipo de gasto directo que desea atender:
          </p>
          <Button
            label="📝 Gasto Solicitado por Responsable"
            icon="pi pi-users"
            severity="info"
            onClick={handleGastoDirectoSolicitado}
            style={{ justifyContent: "flex-start" }}
          />
          <Button
            label="🚨 Gasto Urgente"
            icon="pi pi-bolt"
            severity="warning"
            onClick={handleGastoDirectoUrgente}
            style={{ justifyContent: "flex-start" }}
          />
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={() => setShowGastosDirectosDialog(false)}
          />
        </div>
      </Dialog>

      {/* Diálogo para crear/editar gasto directo y generar documentos */}
      <Dialog
        header={gastoDirectoFormMode === "crear" ? "🚨 Nuevo Gasto Directo Urgente" : "📝 Procesar Gasto Directo"}
        visible={showGastoDirectoFormDialog}
        style={{ width: "95vw", maxWidth: "1400px" }}
        onHide={handleCerrarGastoDirectoForm}
        modal
        maximizable
        maximized={window.innerWidth < 768}
      >
        <DetMovsRendicionGastosForm
          key={gastoDirectoSeleccionado?.id || "nuevo-gasto-directo"}
          movimiento={gastoDirectoSeleccionado}
          modoGasto="directo"
          personal={catalogosGastoDirecto.personal}
          centrosCosto={catalogosGastoDirecto.centrosCosto}
          tiposMovimiento={tiposMovimiento}
          categorias={catalogosGastoDirecto.categorias}
          entidadesComerciales={catalogosGastoDirecto.entidadesComerciales}
          monedas={monedas}
          tiposDocumento={catalogosGastoDirecto.tiposDocumento}
          productos={catalogosGastoDirecto.productos}
          empresas={empresas}
          movimientosAsignacionEntregaRendir={catalogosGastoDirecto.movimientosAsignacion}
          todosLosMovimientos={[]}
          onGuardadoExitoso={handleGuardarGastoDirecto}
          onCancelar={handleCerrarGastoDirectoForm}
          onGeneracionDocumentosExitosa={handleGeneracionGastoDirectoExitosa}
          onEntidadComercialCreada={(nuevaEntidad) => {
            setCatalogosGastoDirecto((prev) => ({
              ...prev,
              entidadesComerciales: [...prev.entidadesComerciales, nuevaEntidad],
            }));
          }}
          permisos={permisos}
        />
      </Dialog>

      {/* Diálogo de pago especializado para Gasto Directo */}
      <PagarGastoDirectoDialog
        visible={showPagarGastoDirectoDialog}
        onHide={() => {
          setShowPagarGastoDirectoDialog(false);
          setPagoGastoDirectoCxPId(null);
          setPagoGastoDirectoDetMovId(null);
          setPagoGastoDirectoTipoMovId(null);
        }}
        cuentaPorPagarId={pagoGastoDirectoCxPId}
        detMovsEntregaRendirId={pagoGastoDirectoDetMovId}
        tipoMovimientoIdHeredado={pagoGastoDirectoTipoMovId}
        monedas={monedas}
        mediosPago={mediosPago}
        bancos={bancos}
        cuentasCorrientes={saldosCuentas}
        tiposMovimiento={tiposMovimiento}
        tiposDetraccion={tiposDetraccion}
        tiposRetencionPercepcion={tiposRetencionPercepcion}
        periodosContables={periodosContables}
        empresas={empresas}
        proveedores={proveedores}
        estadosCxP={estadosCxP}
        toast={toast}
        onSuccess={handlePagoGastoDirectoExitoso}
      />

      {/* Diálogo para pago especializado de cuenta por pagar */}
      {cuentaPorPagarEspecializada && (() => {
        return (
          <PagarCuentaPorPagarEspecializadoDialog
            visible={showPagoEspecializadoCxPDialog}
            onHide={handleCancelarPagoEspecializadoCxP}
            cuentaPorPagar={cuentaPorPagarEspecializada}
            monedas={monedas}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={saldosCuentas}
            tiposMovimiento={tiposMovimiento}
            tiposDetraccion={tiposDetraccion}
            tiposRetencionPercepcion={tiposRetencionPercepcion}
            periodosContables={periodosContables}
            empresas={empresas}
            proveedores={proveedores}
            estadosCxP={estadosCxP}
            toast={toast}
            onSuccess={handleSuccessPagoEspecializadoCxP}
          />
        );
      })()}

    </div>
  );
};

export default TesoreriaPendientes;
