// src/pages/PreFactura.jsx
// Pantalla CRUD profesional para PreFactura. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
// ════════════════════════════════════════════════════════════
// CONSTANTES DE MÓDULOS DEL SISTEMA
// Usadas para obtener ParametroAprobador por módulo
// ════════════════════════════════════════════════════════════
const MODULO_VENTAS = 5; // Módulo de Ventas - usado para obtener respVentasId desde ParametroAprobador
import React, { useRef, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { Badge } from "primereact/badge";
import {
  getPreFacturas,
  getPreFacturaPorId,
  eliminarPreFactura,
  crearPreFactura,
  actualizarPreFactura,
  actualizarTipoOperacionSunatMasivo,
  actualizarTipoAfectacionIGVMasivo,
} from "../api/preFactura";
import { getMotivoNotaCreditoDebitoActivos } from "../api/ventas/motivoNotaCreditoDebito";
import PreFacturaForm from "../components/preFactura/PreFacturaForm";
import CotizacionVentasForm from "../components/cotizacionVentas/CotizacionVentasForm"; // ⬅️ AGREGAR
import MovimientoAlmacenForm from "../components/movimientoAlmacen/MovimientoAlmacenForm"; // ⬅️ AGREGAR
import ContratoServicioForm from "../components/contratoServicio/ContratoServicioForm"; // ⬅️ AGREGAR
import ConsultaStockForm from "../components/common/ConsultaStockForm";
import {
  getResponsiveFontSize,
  formatearFecha,
  formatearNumero,
  getSeverityColors,
} from "../utils/utils";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getCentrosCosto } from "../api/centroCosto";
import { getMonedas } from "../api/moneda";
import { getUnidadesNegocio } from "../api/unidadNegocio";
import { getIncoterms } from "../api/incoterm";
import { getTiposContenedor } from "../api/tipoContenedor";
import { getTiposProducto } from "../api/tipoProducto";
import { getPersonal } from "../api/personal";
import { getBancos } from "../api/banco";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { usePermissions } from "../hooks/usePermissions";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { InputText } from "primereact/inputtext";
import ColorTag from "../components/shared/ColorTag";
import UnidadNegocioFilter from "../components/common/UnidadNegocioFilter";
import { useUnidadNegocioFilter } from "../hooks/useUnidadNegocioFilter";
import GenerarKardexDialog from "../components/common/kardex/GenerarKardexDialog";
import { generarMovimientoAlmacenPreFactura, regenerarKardexPreFactura } from "../api/preFactura";
import { useDashboardStore } from "../shared/stores/useDashboardStore";
import AuditoriaDialog from "../components/common/AuditoriaDialog";
import AsignarTipoOperacionSunatDialog from "../components/common/AsignarTipoOperacionSunatDialog";
import AsignarTipoAfectacionIGVDialog from "../components/common/AsignarTipoAfectacionIGVDialog";
import { generarPreFacturasExcel } from "../components/preFactura/reports/generarPreFacturasExcel";
import FiltroTipoLibroButton from "../components/common/FiltroTipoLibroButton";
import { formatearMontoConSigno, TIPO_DOC_ID } from "../utils/tiposDocumento.constants";
import { MultiSelect } from "primereact/multiselect";
import { OverlayPanel } from "primereact/overlaypanel";

/**
 * Componente PreFactura
 * Gestión CRUD de pre-facturas con patrón profesional ERP Megui
 */
const PreFactura = ({ ruta }) => {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const [showAsignarTipoAfectacionDialog, setShowAsignarTipoAfectacionDialog] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showAsignarTipoOpDialog, setShowAsignarTipoOpDialog] = useState(false);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [tiposContenedor, setTiposContenedor] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [motivosNCND, setMotivosNCND] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [empresaIdSelector, setEmpresaIdSelector] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [filtroParticionadas, setFiltroParticionadas] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosUnicos, setProductosUnicos] = useState([]);
  const [tiposDocInternoAplicados, setTiposDocInternoAplicados] = useState([]);
  const [tiposDocFinalAplicados, setTiposDocFinalAplicados] = useState([]);
  const [tiposDocInternoDisponibles, setTiposDocInternoDisponibles] = useState([]);
  const [tiposDocFinalDisponibles, setTiposDocFinalDisponibles] = useState([]);
  const [nroLiquidacionBusqueda, setNroLiquidacionBusqueda] = useState("");
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPreFactura, setSelectedPreFactura] = useState(null);
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [kardexDocumentoActual, setKardexDocumentoActual] = useState(null);
  // Filtrado automático por Unidad de Negocio
  const { datosFiltrados: preFacturasFiltradas } = useUnidadNegocioFilter(itemsFiltrados);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCotizacionDialog, setShowCotizacionDialog] = useState(false); // ⬅️ AGREGAR
  const [cotizacionOrigen, setCotizacionOrigen] = useState(null); // ⬅️ AGREGAR
  const [showMovimientoAlmacenDialog, setShowMovimientoAlmacenDialog] =
    useState(false); // ⬅️ AGREGAR
  const [movimientoAlmacenOrigen, setMovimientoAlmacenOrigen] = useState(null); // ⬅️ AGREGAR
  const [showContratoServicioDialog, setShowContratoServicioDialog] =
    useState(false); // ⬅️ AGREGAR
  const [contratoServicioOrigen, setContratoServicioOrigen] = useState(null); // ⬅️ AGREGAR
  const [navigationStack, setNavigationStack] = useState([]); // Stack para navegación de PreFacturas
  const [filtroTipoLibro, setFiltroTipoLibro] = useState("FISCAL_SSI");
  const [showConsultaStock, setShowConsultaStock] = useState(false);

  // Estados temporales para filtros avanzados (no aplicados aún)
  const [tiposDocInternoTemp, setTiposDocInternoTemp] = useState([]);
  const [tiposDocFinalTemp, setTiposDocFinalTemp] = useState([]);

  const toast = useRef(null);
  const opFiltrosAvanzados = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        preFacturasData,
        empresasData,
        tiposDocData,
        clientesData,
        formasPagoData,
        productosData,
        estadosData,
        centrosCostoData,
        monedasData,
        unidadesNegocioData,
        incotermsData,
        tiposContenedorData,
        tiposProductoData,
        personalData,
        bancosData,
        periodosContablesData, // ✅ AGREGADO
        motivosNCNDData,
      ] = await Promise.all([
        getPreFacturas(),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getFormasPago(),
        getProductos(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getMonedas(),
        getUnidadesNegocio({ activo: true }),
        getIncoterms(),
        getTiposContenedor(),
        getTiposProducto(),
        getPersonal(),
        getBancos(),
        getPeriodosContables(), // ✅ AGREGADO
        getMotivoNotaCreditoDebitoActivos(),
      ]);

      setEmpresas(empresasData);
      setTiposDocumento(tiposDocData);
      setClientes(clientesData);
      setFormasPago(formasPagoData);
      setProductos(productosData);

      // Filtrar estados de documentos (tipoProvieneDeId = 14 para PRE FACTURA)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 14 && !e.cesado,
      );
      setEstadosDoc(estadosDocFiltrados);

      // Normalizar IDs a números en unidadesNegocioData y tiposDocData
      const unidadesNegocioNormalizadas = unidadesNegocioData.map((un) => ({
        ...un,
        id: Number(un.id),
      }));

      const tiposDocNormalizados = tiposDocData.map((td) => ({
        ...td,
        id: Number(td.id),
      }));

      const preFacturasNormalizadas = preFacturasData.map((pf) => {
        const unidadNegocio = unidadesNegocioNormalizadas.find(
          (un) => un.id === Number(pf.unidadNegocioId),
        );
        const tipoDocumento = tiposDocNormalizados.find(
          (td) => td.id === Number(pf.tipoDocumentoId),
        );

        return {
          ...pf,
          estadoDoc: estadosDocFiltrados.find(
            (e) => Number(e.id) === Number(pf.estadoId),
          ),
          unidadNegocio,
          tipoDocumento,
        };
      });

      setItems(preFacturasNormalizadas);
      setPreFacturas(preFacturasNormalizadas);
      setCentrosCosto(centrosCostoData);
      setMonedas(monedasData);
      if (unidadesNegocioData && Array.isArray(unidadesNegocioData)) {
        setUnidadesNegocio(
          unidadesNegocioData.map((un) => ({ ...un, id: Number(un.id) })),
        );
      }
      setIncoterms(incotermsData);
      setTiposContenedor(tiposContenedorData);
      setTiposProducto(tiposProductoData);
      setPersonalOptions(personalData);
      setBancos(bancosData);
      setPeriodosContables(periodosContablesData || []);
      setMotivosNCND(motivosNCNDData || []);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  // Obtener opciones únicas de los datos filtrados
  const obtenerOpcionesDinamicas = () => {
    const datosParaOpciones = itemsFiltrados.length > 0 ? itemsFiltrados : preFacturasFiltradas;
    // Clientes únicos (filtrados por empresa si hay una seleccionada)
    const clientesUnicos = [...new Map(
      datosParaOpciones
        .filter(pf => pf.cliente)
        .filter(pf => !empresaSeleccionada || Number(pf.empresaId) === Number(empresaSeleccionada))
        .map(pf => [pf.cliente.id, pf.cliente])
    ).values()];
    // Estados únicos
    const estadosUnicos = [...new Map(
      datosParaOpciones
        .filter(pf => pf.estadoDoc)
        .map(pf => [pf.estadoDoc.id, pf.estadoDoc])
    ).values()];
    // Tipos de Documento Interno disponibles (basados en datos filtrados)
    const tiposDocInternoDisponibles = [...new Map(
      datosParaOpciones
        .filter(pf => pf.tipoDocumento)
        .map(pf => [pf.tipoDocumento.id, pf.tipoDocumento])
    ).values()].sort((a, b) => (a.descripcion || a.nombre || "").localeCompare(b.descripcion || b.nombre || ""));

    // Tipos de Documento Final disponibles (basados en datos filtrados)
    const tiposDocFinalDisponibles = [...new Map(
      datosParaOpciones
        .filter(pf => pf.tipoDocumentoFinal)
        .map(pf => [pf.tipoDocumentoFinal.id, pf.tipoDocumentoFinal])
    ).values()].sort((a, b) => (a.descripcion || a.nombre || "").localeCompare(b.descripcion || b.nombre || ""));

    // Productos únicos (de los detalles)
    const productosMap = new Map();
    datosParaOpciones.forEach((pf) => {
      if (pf.detalles && Array.isArray(pf.detalles)) {
        pf.detalles.forEach((detalle) => {
          if (detalle.producto && detalle.producto.id) {
            productosMap.set(detalle.producto.id, {
              id: detalle.producto.id,
              descripcionArmada: detalle.producto.descripcionArmada || "Sin descripción",
            });
          }
        });
      }
    });
    const productosUnicos = Array.from(productosMap.values()).sort((a, b) =>
      a.descripcionArmada.localeCompare(b.descripcionArmada)
    );

    return {
      clientesUnicos,
      estadosUnicos,
      productosUnicos,
      tiposDocInternoDisponibles,
      tiposDocFinalDisponibles
    };
  };


  // Actualizar opciones de filtros basadas en datos visibles
  useEffect(() => {
    const opciones = obtenerOpcionesDinamicas();

    setClientesUnicos(opciones.clientesUnicos);
    setEstadosUnicos(opciones.estadosUnicos);
    setProductosUnicos(opciones.productosUnicos);
    setTiposDocInternoDisponibles(opciones.tiposDocInternoDisponibles);
    setTiposDocFinalDisponibles(opciones.tiposDocFinalDisponibles);

    // Limpiar selecciones que ya no existen
    if (clienteSeleccionado && !opciones.clientesUnicos.find(c => Number(c.id) === Number(clienteSeleccionado))) {
      setClienteSeleccionado(null);
    }
    if (estadoSeleccionado && !opciones.estadosUnicos.find(e => Number(e.id) === Number(estadoSeleccionado))) {
      setEstadoSeleccionado(null);
    }
    if (productoSeleccionado && !opciones.productosUnicos.find(p => Number(p.id) === Number(productoSeleccionado))) {
      setProductoSeleccionado(null);
    }
  }, [itemsFiltrados, preFacturasFiltradas, empresaSeleccionada]);

  // Filtrar items cuando cambien los filtros
  useEffect(() => {
    let filtrados = items;

    // Filtro por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada),
      );
    }

    // Filtro por cliente
    if (clienteSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.clienteId) === Number(clienteSeleccionado),
      );
    }

    // Filtro por rango de fechas
    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaDocumento);
        const fechaIni = new Date(rangoFechas[0]);
        fechaIni.setHours(0, 0, 0, 0);

        // Si hay fecha fin
        if (rangoFechas[1]) {
          const fechaFinDia = new Date(rangoFechas[1]);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaDoc >= fechaIni && fechaDoc <= fechaFinDia;
        }

        // Si solo hay fecha inicio
        return fechaDoc >= fechaIni;
      });
    }

    // Filtro por estado
    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado),
      );
    }

    // Filtro por tipos de documento interno (múltiple)
    if (tiposDocInternoAplicados && tiposDocInternoAplicados.length > 0) {
      filtrados = filtrados.filter((item) =>
        tiposDocInternoAplicados.some(id => Number(item.tipoDocumentoId) === Number(id))
      );
    }

    // Filtro por tipos de documento final (múltiple)
    if (tiposDocFinalAplicados && tiposDocFinalAplicados.length > 0) {
      filtrados = filtrados.filter((item) =>
        tiposDocFinalAplicados.some(id => Number(item.tipoDocumentoFinalId) === Number(id))
      );
    }

    // Filtro por tipo de particionadas
    if (filtroParticionadas === "originales") {
      filtrados = filtrados.filter((item) => item.esParticionada === true);
    } else if (filtroParticionadas === "copias") {
      filtrados = filtrados.filter(
        (item) =>
          item.preFacturaOrigenId !== null &&
          item.preFacturaOrigenId !== undefined,
      );
    }

    // Filtro por producto seleccionado (dropdown)
    if (productoSeleccionado) {
      filtrados = filtrados.filter((item) => {
        if (item.detalles && Array.isArray(item.detalles)) {
          return item.detalles.some((detalle) => {
            return Number(detalle.producto?.id) === Number(productoSeleccionado);
          });
        }
        return false;
      });
    }

    // Filtro por ID (#), número de liquidación o número de documento final
    if (nroLiquidacionBusqueda && nroLiquidacionBusqueda.trim() !== "") {
      const busqueda = nroLiquidacionBusqueda.trim();

      // Si empieza con #, buscar por ID
      if (busqueda.startsWith("#")) {
        const idBuscado = busqueda.substring(1).trim();
        if (idBuscado && !isNaN(idBuscado)) {
          filtrados = filtrados.filter((item) => {
            return String(item.id) === idBuscado;
          });
        }
      } else {
        // Búsqueda normal en campos de texto
        const busquedaLower = busqueda.toLowerCase();
        filtrados = filtrados.filter((item) => {
          const nroLiquidacion = item.nroLiquidacionFacturacion || "";
          const numeroDocFinal = item.numeroDocumentoFinal || "";
          return (
            nroLiquidacion.toLowerCase().includes(busquedaLower) ||
            numeroDocFinal.toLowerCase().includes(busquedaLower)
          );
        });
      }
    }

    // Filtro por tipo de libro
    if (filtroTipoLibro === "FISCAL_SSI") {
      // Fiscal sin saldos iniciales: FAC, BV, NC, ND
      filtrados = filtrados.filter((item) => {
        const codigo = item.tipoDocumentoFinal?.codigo || item.tipoDocumento?.codigo || "";
        return ["FAC", "BV", "NC", "ND"].includes(codigo);
      });
    } else if (filtroTipoLibro === "FISCAL_CSI") {
      // Fiscal con saldos iniciales: FAC, BV, NC, ND + todos los SI-*
      filtrados = filtrados.filter((item) => {
        const codigo = item.tipoDocumentoFinal?.codigo || item.tipoDocumento?.codigo || "";
        return ["FAC", "BV", "NC", "ND"].includes(codigo) || codigo.startsWith("SI-");
      });
    } else if (filtroTipoLibro === "GERENCIAL") {
      // Solo gerenciales: codigoSunat="00" excepto OTROS y SI-*
      filtrados = filtrados.filter((item) => {
        const codigo = item.tipoDocumentoFinal?.codigo || item.tipoDocumento?.codigo || "";
        const codigoSunat = item.tipoDocumentoFinal?.codigoSunat || item.tipoDocumento?.codigoSunat || "";
        return codigoSunat === "00" && codigo !== "00" && !codigo.startsWith("SI-");
      });
    }
    // Si es "TODOS", no se filtra

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    clienteSeleccionado,
    rangoFechas,
    estadoSeleccionado,
    tiposDocInternoAplicados,
    tiposDocFinalAplicados,
    filtroParticionadas,
    productoSeleccionado,
    nroLiquidacionBusqueda,
    filtroTipoLibro,
    items,
  ]);


  // ✅ Calcular totales por tipo de documento y moneda
  const calcularTotalesPorTipoYMoneda = () => {
    const totalesPorTipo = {};
    let totalGeneralSoles = 0;
    let totalGeneralDolares = 0;
    let simboloSoles = "S/";
    let simboloDolares = "$";
    let colorFondoSoles = "#FFE5B4";
    let colorFondoDolares = "#C8E6C9";

    preFacturasFiltradas.forEach((pf) => {
      const total = Number(pf.total) || 0;
      const codigo = pf.tipoDocumentoFinal?.codigo || pf.tipoDocumento?.codigo || "OTROS";
      const monedaId = Number(pf.monedaId);

      // Inicializar tipo si no existe
      if (!totalesPorTipo[codigo]) {
        totalesPorTipo[codigo] = { soles: 0, dolares: 0 };
      }

      // Acumular por tipo y moneda
      if (monedaId === 1) {
        totalesPorTipo[codigo].soles += total;
        totalGeneralSoles += total;
        if (pf.moneda?.simbolo) simboloSoles = pf.moneda.simbolo;
        if (pf.moneda?.colorFondo) colorFondoSoles = pf.moneda.colorFondo;
      } else if (monedaId === 2) {
        totalesPorTipo[codigo].dolares += total;
        totalGeneralDolares += total;
        if (pf.moneda?.simbolo) simboloDolares = pf.moneda.simbolo;
        if (pf.moneda?.colorFondo) colorFondoDolares = pf.moneda.colorFondo;
      }
    });

    return {
      totalesPorTipo,
      totalGeneralSoles,
      totalGeneralDolares,
      simboloSoles,
      simboloDolares,
      colorFondoSoles,
      colorFondoDolares,
    };
  };

  // ✅ Template para footer con totales en UNA LÍNEA
  const footerTemplate = () => {
    const {
      totalesPorTipo,
      totalGeneralSoles,
      totalGeneralDolares,
      simboloSoles,
      simboloDolares,
      colorFondoSoles,
      colorFondoDolares,
    } = calcularTotalesPorTipoYMoneda();

    return (
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "2px solid #dee2e6",
        }}
      >
        {/* IZQUIERDA: Totales por tipo documento */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {Object.entries(totalesPorTipo)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([codigo, montos]) => {
              // Solo mostrar si hay montos
              if (montos.soles === 0 && montos.dolares === 0) return null;

              return (
                <div
                  key={codigo}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {/* Label del tipo */}
                  <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#495057" }}>
                    {codigo}:
                  </span>

                  {/* Soles */}
                  {montos.soles !== 0 && (
                    <span
                      style={{
                        backgroundColor: colorFondoSoles,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: montos.soles < 0 ? "#c0392b" : "#000",
                      }}
                    >
                      {simboloSoles} {formatearNumero(montos.soles, 2)}
                    </span>
                  )}

                  {/* Dólares */}
                  {montos.dolares !== 0 && (
                    <span
                      style={{
                        backgroundColor: colorFondoDolares,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: montos.dolares < 0 ? "#c0392b" : "#000",
                      }}
                    >
                      {simboloDolares} {formatearNumero(montos.dolares, 2)}
                    </span>
                  )}

                  {/* Separador visual */}
                  <span style={{ color: "#dee2e6", fontWeight: "bold" }}>|</span>
                </div>
              );
            })}
        </div>

        {/* DERECHA: Total general */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            border: "2px solid #3498db",
            borderRadius: "4px",
            padding: "4px 10px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#2c3e50" }}>
            TOTAL:
          </span>

          {totalGeneralSoles !== 0 && (
            <span
              style={{
                backgroundColor: colorFondoSoles,
                padding: "3px 8px",
                borderRadius: "3px",
                fontSize: "0.95rem",
                fontWeight: "bold",
                color: totalGeneralSoles < 0 ? "#c0392b" : "#000",
              }}
            >
              {simboloSoles} {formatearNumero(totalGeneralSoles, 2)}
            </span>
          )}

          {totalGeneralDolares !== 0 && (
            <span
              style={{
                backgroundColor: colorFondoDolares,
                padding: "3px 8px",
                borderRadius: "3px",
                fontSize: "0.95rem",
                fontWeight: "bold",
                color: totalGeneralDolares < 0 ? "#c0392b" : "#000",
              }}
            >
              {simboloDolares} {formatearNumero(totalGeneralDolares, 2)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleIrAPreFacturaOrigen = async (preFacturaOrigenId) => {
    // Guardar la PreFactura actual en el stack antes de navegar
    if (selectedPreFactura) {
      setNavigationStack((prev) => [...prev, selectedPreFactura]);
    }

    // Primero buscar en el array local
    let preFacturaOrigen = preFacturas.find(
      (pf) => Number(pf.id) === Number(preFacturaOrigenId),
    );

    // Si no está en el array local, buscar en el backend
    if (!preFacturaOrigen) {
      try {
        const response = await getPreFacturaById(preFacturaOrigenId);
        preFacturaOrigen = response.data;
      } catch (error) {
        console.error("Error al buscar Venta Origen:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar la Venta Origen",
          life: 3000,
        });
        return;
      }
    }

    if (preFacturaOrigen) {
      setSelectedPreFactura(preFacturaOrigen);
      setDialogVisible(true);
      setIsEditing(true);
    } else {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se encontró la Venta Origen",
        life: 3000,
      });
    }
  };

  const handleIrAMovimientoAlmacen = async (movimientoId) => {
    try {
      const { getMovimientoAlmacenPorId } =
        await import("../api/movimientoAlmacen");
      const movimientoCompleto = await getMovimientoAlmacenPorId(movimientoId);

      setMovimientoAlmacenOrigen(movimientoCompleto);
      setShowMovimientoAlmacenDialog(true);
    } catch (error) {
      console.error("Error al cargar movimiento de almacén:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el movimiento de almacén",
        life: 3000,
      });
    }
  };

  const handleIrACotizacionVenta = async (cotizacionVentaId) => {
    try {
      const { getCotizacionVentasPorId } =
        await import("../api/cotizacionVentas");
      const cotizacionCompleta =
        await getCotizacionVentasPorId(cotizacionVentaId);

      setCotizacionOrigen(cotizacionCompleta);
      setShowCotizacionDialog(true);
    } catch (error) {
      console.error("Error al cargar cotización origen:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar la cotización origen",
        life: 3000,
      });
    }
  };

  const handleIrAContratoServicio = async (contratoServicioId) => {
    try {
      const { getContratoServicioPorId } =
        await import("../api/contratoServicio");
      const contratoCompleto =
        await getContratoServicioPorId(contratoServicioId);

      setContratoServicioOrigen(contratoCompleto);
      setShowContratoServicioDialog(true);
    } catch (error) {
      console.error("Error al cargar contrato de servicio:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el contrato de servicio",
        life: 3000,
      });
    }
  };
  const handleClienteCreado = async (cliente) => {
    try {
      // Recargar la lista completa de clientes
      const { getEntidadesComerciales } = await import("../api/entidadComercial");
      const clientesData = await getEntidadesComerciales();
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al recargar clientes:", error);
    }
  };

  const abrirDialogoNuevo = async () => {
    try {
      // ════════════════════════════════════════════════════════════
      // PRESELECCIÓN AUTOMÁTICA DE RESPONSABLE DE VENTAS
      // Busca en ParametroAprobador el responsable vigente del módulo VENTAS
      // para la empresa seleccionada
      // ════════════════════════════════════════════════════════════
      let respVentasId = null;

      if (empresaIdSelector) {
        const { getParametrosAprobadorPorModulo } = await import("../api/parametroAprobador");

        try {
          const parametros = await getParametrosAprobadorPorModulo(
            empresaIdSelector,
            MODULO_VENTAS
          );

          // Filtrar por activo (cesado=false) y vigencia
          const hoy = new Date();
          const parametroVigente = parametros.find((p) => {
            // Debe estar activo (no cesado)
            if (p.cesado !== false) return false;

            // Debe estar vigente
            const vigenteDesde = new Date(p.vigenteDesde);
            const vigenteHasta = p.vigenteHasta ? new Date(p.vigenteHasta) : null;

            const estaVigente = hoy >= vigenteDesde && (!vigenteHasta || hoy <= vigenteHasta);

            return estaVigente;
          });

          if (parametroVigente) {
            respVentasId = parametroVigente.personalRespId;
          } else {
            console.warn(
              `[PreFactura] No se encontró ParametroAprobador vigente para empresa ${empresaIdSelector}, módulo VENTAS (${MODULO_VENTAS})`
            );
          }
        } catch (error) {
          console.error("[PreFactura] Error al obtener ParametroAprobador:", error);
          // Continuar sin respVentasId si hay error
        }
      }

      // ════════════════════════════════════════════════════════════
      // PRESELECCIÓN AUTOMÁTICA DE UNIDAD DE NEGOCIO
      // Si viene desde Dashboard Unidades, preseleccionar la unidad activa
      // ════════════════════════════════════════════════════════════
      const { unidadSeleccionada } = useDashboardStore.getState();
      const unidadNegocioId = unidadSeleccionada?.id ? Number(unidadSeleccionada.id) : null;

      // Crear objeto inicial con campos preseleccionados
      const preFacturaInicial = {
        respVentasId,
        unidadNegocioId,
      };

      setSelectedPreFactura(preFacturaInicial);
      setIsEditing(false);
      setDialogVisible(true);
    } catch (error) {
      console.error("Error al abrir diálogo:", error);
      setSelectedPreFactura(null);
      setIsEditing(false);
      setDialogVisible(true);
    }
  };
  const abrirDialogoEdicion = (preFactura) => {
    setNavigationStack([]); // Limpiar el stack al abrir desde la lista
    setSelectedPreFactura(preFactura);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const handleGuardarPreFactura = async (datos) => {
    const esEdicion =
      selectedPreFactura &&
      selectedPreFactura.id &&
      selectedPreFactura.numeroDocumento;

    // Validar permisos antes de guardar
    if (esEdicion && !permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar registros.",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (esEdicion) {
        await actualizarPreFactura(selectedPreFactura.id, datos);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Pre-factura actualizada. Puedes seguir agregando detalles.",
        });

        // Recargar la pre-factura actualizada
        const { getPreFacturaPorId } = await import("../api/preFactura");
        const preFacturaActualizada = await getPreFacturaPorId(
          selectedPreFactura.id,
        );
        setSelectedPreFactura(preFacturaActualizada);
        setRefreshKey((prev) => prev + 1);
      } else {
        const resultado = await crearPreFactura(datos);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Pre-factura creada con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        // Cargar la pre-factura recién creada
        const { getPreFacturaPorId } = await import("../api/preFactura");
        const preFacturaCompleta = await getPreFacturaPorId(resultado.id);
        setSelectedPreFactura(preFacturaCompleta);
        // ❌ NO incrementar refreshKey aquí - causa reset del formulario
        // setRefreshKey((prev) => prev + 1);
      }

      cargarDatos();
    } catch (err) {
      // Si el backend devuelve campos faltantes, mostrar lista
      if (
        err.response?.data?.camposFaltantes &&
        Array.isArray(err.response.data.camposFaltantes)
      ) {
        toast.current.show({
          severity: "warn",
          summary: "Campos Obligatorios Faltantes",
          detail: (
            <div>
              <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Los siguientes campos son obligatorios:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {err.response.data.camposFaltantes.map((campo, index) => (
                  <li key={index}>{campo}</li>
                ))}
              </ul>
            </div>
          ),
          life: 6000,
        });
      } else {
        // Error genérico
        const errorMsg =
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          err.response?.data?.message ||
          "No se pudo guardar.";
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: errorMsg,
          life: 5000,
        });
      }
    }
    setLoading(false);
  };


  const handleAsignarTipoOperacion = async (ids, tipoOperacionSunatId) => {
    try {
      const resultado = await actualizarTipoOperacionSunatMasivo(ids, tipoOperacionSunatId);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.mensaje || `${resultado.actualizados} registro(s) actualizado(s)`,
        life: 3000,
      });

      setSelectedRecords([]);
      cargarDatos();
    } catch (error) {
      console.error("Error actualizando tipo de operación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar registros",
        life: 3000,
      });
      throw error;
    }
  };

  const handleAsignarTipoAfectacion = async (ids, tipoAfectacionIGVId) => {
    try {
      const resultado = await actualizarTipoAfectacionIGVMasivo(ids, tipoAfectacionIGVId);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.mensaje || `${resultado.actualizados} registro(s) actualizado(s)`,
        life: 3000,
      });

      setSelectedRecords([]);
      cargarDatos();
    } catch (error) {
      console.error("Error actualizando tipo de afectación IGV:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar registros",
        life: 3000,
      });
      throw error;
    }
  };
  const handleExportarExcel = async () => {
    try {
      setLoading(true);
      const response = await getPreFacturas();
      const blob = await generarPreFacturasExcel(response);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PreFacturas_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.current.show({
        severity: 'success',
        summary: 'Exportado',
        detail: 'Excel generado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al generar Excel',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  const cerrarDialogo = () => {
    // Si hay una PreFactura en el stack de navegación, volver a ella
    if (navigationStack.length > 0) {
      const previousPreFactura = navigationStack[navigationStack.length - 1];
      setNavigationStack((prev) => prev.slice(0, -1)); // Remover del stack
      setSelectedPreFactura(previousPreFactura);
      setDialogVisible(true);
      setIsEditing(true);
    } else {
      // Si no hay stack, cerrar el diálogo normalmente
      setDialogVisible(false);
      setSelectedPreFactura(null);
      setIsEditing(false);
      cargarDatos(); // Recargar la lista para reflejar cambios
    }
  };
  // ⭐ FUNCIÓN AUXILIAR: Recalcular totales de una PreFactura
  const recalcularTotalesPreFactura = async (preFacturaId) => {
    try {
      const { getDetallesPreFactura } = await import("../api/detallePreFactura");
      const { getPreFacturaPorId, actualizarPreFactura } = await import("../api/preFactura");

      const preFactura = await getPreFacturaPorId(preFacturaId);
      const detalles = await getDetallesPreFactura(preFacturaId);

      const subtotalCalc = detalles.reduce(
        (sum, det) =>
          sum + (Number(det.cantidad) * Number(det.precioUnitario) || 0),
        0,
      );
      const igvCalc = preFactura.esExoneradoAlIGV
        ? 0
        : subtotalCalc * (Number(preFactura.porcentajeIgv) / 100);
      const totalCalc = subtotalCalc + igvCalc;

      // Actualizar en BD
      await actualizarPreFactura(preFacturaId, {
        subtotal: subtotalCalc,
        totalIGV: igvCalc,
        total: totalCalc,
      });

      // Mostrar mensaje de éxito
      const monedaSimbolo = preFactura.moneda?.simbolo || "";
      toast.current?.show({
        severity: "success",
        summary: "Totales Actualizados",
        detail: `Subtotal: ${monedaSimbolo} ${subtotalCalc.toFixed(2)} | IGV: ${monedaSimbolo} ${igvCalc.toFixed(2)} | Total: ${monedaSimbolo} ${totalCalc.toFixed(2)}`,
        life: 4000,
      });

      return { subtotal: subtotalCalc, igv: igvCalc, total: totalCalc };
    } catch (err) {
      console.error("Error al recalcular totales:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron actualizar los totales en la base de datos",
        life: 5000,
      });
      throw err;
    }
  };
  const handleAprobarPreFactura = async (preFacturaId) => {
    if (!permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para aprobar pre-facturas.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      // ⭐ RECALCULAR Y GUARDAR TOTALES ANTES DE APROBAR
      await recalcularTotalesPreFactura(preFacturaId);
      const { aprobarPreFactura } = await import("../api/preFactura");
      const preFacturaAprobada = await aprobarPreFactura(preFacturaId);
      toast.current.show({
        severity: "success",
        summary: "Aprobado",
        detail: "Pre-factura aprobada exitosamente.",
        life: 3000,
      });

      // Actualizar el formulario con los datos aprobados
      setSelectedPreFactura(preFacturaAprobada);
      setRefreshKey((prev) => prev + 1);

      // Recargar la lista en segundo plano
      cargarDatos();
    } catch (err) {
      console.error("Error al aprobar pre-factura:", err);
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo aprobar la pre-factura.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnularPreFactura = async (preFacturaId) => {
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para anular pre-facturas.",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de anular esta pre-factura? Si tiene movimiento de almacén asociado, también será eliminado.",
      header: "Confirmar Anulación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, anular",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          await axios.put(
            `${API_BASE_URL}/api/ventas/prefacturas/${preFacturaId}/anular`,
          );

          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Pre-factura anulada correctamente.",
            life: 3000,
          });
          cargarDatos();
          cerrarDialogo();
        } catch (err) {
          console.error("Error al anular pre-factura:", err);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              err.response?.data?.message ||
              "No se pudo anular la pre-factura.",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };


  const handleReactivarPreFactura = async (preFacturaId) => {
    if (!permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para reactivar pre-facturas.",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de reactivar esta pre-factura? " +
        "Si tiene movimiento de almacén, el kardex será eliminado y los saldos recalculados. " +
        "Si tiene Cuenta por Cobrar sin pagos, será eliminada.",
      header: "Confirmar Reactivación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-warning",
      acceptLabel: "Sí, reactivar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          const { reactivarDocumentoPreFactura } = await import("../api/preFactura");
          const resultado = await reactivarDocumentoPreFactura(preFacturaId);

          // Construir mensaje detallado
          let mensajeDetalle = "PreFactura reactivada exitosamente:\n\n";

          // Movimientos de Almacén
          if (resultado.movimientosAlmacen?.eliminados > 0) {
            mensajeDetalle += `✅ Movimientos de Almacén ELIMINADOS: ${resultado.movimientosAlmacen.eliminados}\n`;
            resultado.movimientosAlmacen.movimientos.forEach((mov, index) => {
              mensajeDetalle += `   ${index + 1}. ID: ${mov.id} - Doc: ${mov.numeroDocumento}\n`;
            });
            mensajeDetalle += `   • Total Kardex eliminados: ${resultado.movimientosAlmacen.kardexEliminados}\n`;
            mensajeDetalle += `   • Total Detalles eliminados: ${resultado.movimientosAlmacen.detallesEliminados}\n\n`;
          }

          // Saldos
          if (resultado.saldos?.productosAfectados > 0) {
            mensajeDetalle += `✅ Saldos Recalculados:\n`;
            mensajeDetalle += `   • Productos afectados: ${resultado.saldos.productosAfectados}\n`;
            mensajeDetalle += `   • Saldos detallados: ${resultado.saldos.saldosDetActualizados}\n`;
            mensajeDetalle += `   • Saldos generales: ${resultado.saldos.saldosGenActualizados}\n\n`;
          }

          // Cuenta por Cobrar
          if (resultado.cuentaPorCobrar?.eliminada) {
            mensajeDetalle += `✅ Cuenta por Cobrar ELIMINADA:\n`;
            mensajeDetalle += `   • ID: ${resultado.cuentaPorCobrar.cxcId}\n`;
            mensajeDetalle += `   • Monto: S/ ${Number(resultado.cuentaPorCobrar.montoTotal).toFixed(2)}\n\n`;
          }

          // Comprobantes Electrónicos
          if (resultado.comprobantesElectronicos?.eliminados > 0) {
            mensajeDetalle += `✅ Comprobantes Electrónicos ELIMINADOS: ${resultado.comprobantesElectronicos.eliminados}\n\n`;
          }

          // Asientos Contables
          if (resultado.asientosContables?.eliminados > 0) {
            mensajeDetalle += `✅ Asientos Contables ELIMINADOS: ${resultado.asientosContables.eliminados}\n\n`;
          }

          mensajeDetalle += "La pre-factura volvió a estado PENDIENTE y puede ser editada.";

          toast.current.show({
            severity: "success",
            summary: "PreFactura Reactivada",
            detail: mensajeDetalle,
            life: 5000,
          });

          cargarDatos();
          cerrarDialogo();
        } catch (err) {
          console.error("Error al reactivar pre-factura:", err);
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "No se pudo reactivar la pre-factura.";
          toast.current.show({
            severity: "error",
            summary: "Error al Reactivar",
            detail: errorMsg,
            life: 5000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };


  /**
   * Recargar datos de la PreFactura actual sin cerrar el diálogo
   */
  const handleActualizarPreFactura = async () => {
    if (!selectedPreFactura?.id) return;

    try {
      setLoading(true);
      const preFacturaActualizada = await getPreFacturaPorId(selectedPreFactura.id);
      setSelectedPreFactura(preFacturaActualizada);
      setRefreshKey((prev) => prev + 1); // Forzar re-render del formulario
    } catch (err) {
      console.error("Error al actualizar pre-factura:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo actualizar la pre-factura",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };


  const confirmarEliminacion = (preFactura) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    confirmDialog({
      message: `¿Está seguro de eliminar la pre-factura ${preFactura.id}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => {
        handleEliminarPreFactura(preFactura.id);
      },
    });
  };

  const handleEliminarPreFactura = async (id) => {

    try {
      const resultado = await eliminarPreFactura(id);

      // Construir mensaje detallado con DATOS REALES del backend
      const { resultados } = resultado;

      // Calcular total de registros ELIMINADOS (no regenerados)
      const totalEliminados =
        resultados.preFacturas +
        resultados.detallesPreFactura +
        resultados.cuentasPorCobrar +
        resultados.pagos +
        resultados.movimientosAlmacen +
        resultados.detallesMovAlmacen +
        resultados.kardexEliminados +
        resultados.comprobantesElectronicos +
        resultados.preFacturasHijas;

      // Construir mensaje con información REAL de la base de datos
      const registrosEliminados = [];
      const saldosRegenerados = [];
      const otrosRegistros = [];

      // REGISTROS PRINCIPALES ELIMINADOS
      if (resultados.preFacturas > 0) {
        registrosEliminados.push(`✅ Pre-Factura: ${resultados.preFacturas} eliminada`);
      }
      if (resultados.detallesPreFactura > 0) {
        registrosEliminados.push(`📋 Detalles Pre-Factura: ${resultados.detallesPreFactura} eliminados`);
      }

      // REGISTROS FINANCIEROS
      if (resultados.cuentasPorCobrar > 0) {
        registrosEliminados.push(`🏦 Cuenta por Cobrar: ${resultados.cuentasPorCobrar} eliminada`);
      }
      if (resultados.pagos > 0) {
        registrosEliminados.push(`💰 Pagos: ${resultados.pagos} eliminados`);
      }

      // COMPROBANTES ELECTRÓNICOS (SUNAT)
      if (resultados.comprobantesElectronicos > 0) {
        registrosEliminados.push(`📄 Comprobantes Electrónicos: ${resultados.comprobantesElectronicos} eliminados`);
      }

      // REGISTROS DE INVENTARIO
      if (resultados.movimientosAlmacen > 0) {
        registrosEliminados.push(`📦 Movimiento Almacén: ${resultados.movimientosAlmacen} eliminado`);
      }
      if (resultados.detallesMovAlmacen > 0) {
        registrosEliminados.push(`📝 Detalles Mov. Almacén: ${resultados.detallesMovAlmacen} eliminados`);
      }
      if (resultados.kardexEliminados > 0) {
        registrosEliminados.push(`📊 Kardex: ${resultados.kardexEliminados} eliminados`);
      }

      // PREFACTURAS HIJAS (PARTICIONADAS)
      if (resultados.preFacturasHijas > 0) {
        registrosEliminados.push(`🔗 Pre-Facturas Hijas: ${resultados.preFacturasHijas} eliminadas`);
      }

      // OTROS REGISTROS DESVINCULADOS (NO ELIMINADOS)
      if (resultados.contratistasOT > 0) {
        otrosRegistros.push(`🔧 Contratistas OT: ${resultados.contratistasOT} desvinculados`);
      }

      // SALDOS REGENERADOS (información crítica de inventario)
      if (resultados.saldosDetRegenerados > 0) {
        saldosRegenerados.push(`🔄 Saldos detallados: ${resultados.saldosDetRegenerados} recalculados`);
      }
      if (resultados.saldosGenRegenerados > 0) {
        saldosRegenerados.push(`🔄 Saldos generales: ${resultados.saldosGenRegenerados} recalculados`);
      }

      // Construir mensaje final
      let mensajeCompleto = `${resultado.mensaje}\n\n`;
      mensajeCompleto += `📊 REGISTROS ELIMINADOS (${totalEliminados} total):\n`;
      mensajeCompleto += registrosEliminados.join('\n');

      if (otrosRegistros.length > 0) {
        mensajeCompleto += `\n\n🔗 REGISTROS DESVINCULADOS:\n`;
        mensajeCompleto += otrosRegistros.join('\n');
      }

      if (saldosRegenerados.length > 0) {
        mensajeCompleto += `\n\n🔄 INVENTARIO ACTUALIZADO:\n`;
        mensajeCompleto += saldosRegenerados.join('\n');
      }

      toast.current?.show({
        severity: "success",
        summary: "✅ Eliminación Completa Exitosa",
        detail: mensajeCompleto,
        life: 12000, // 12 segundos para leer toda la información
      });

      cargarDatos();
    } catch (error) {

      const mensajeError = error.response?.data?.error || error.message || "Error desconocido";

      toast.current?.show({
        severity: "error",
        summary: "Error al Eliminar",
        detail: `No se pudo eliminar la Pre-Factura.\n\n${mensajeError}\n\nTodos los cambios fueron revertidos (transacción atómica).`,
        life: 6000,
      });
    }
  };

  const handleGenerarKardex = async (id) => {
    try {
      const preFacturaActual = items.find((item) => Number(item.id) === Number(id));

      if (!preFacturaActual) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró la pre-factura",
        });
        return;
      }

      // ✅ VALIDAR ESTADOS PERMITIDOS (todos excepto 45 PENDIENTE y 47 ANULADA)
      const estadoId = Number(preFacturaActual.estadoId);
      const estadosPermitidos = [46, 48, 95, 96, 97, 98, 99]; // APROBADA, PARTICIONADA, FACTURADA, EMITIDA, CE GENERADO, VALIDADO SUNAT, NO VALIDADO SUNAT

      if (!estadosPermitidos.includes(estadoId)) {
        const mensajes = {
          45: "La pre-factura debe estar APROBADA para generar kardex",
          47: "No se puede generar kardex de una pre-factura ANULADA",
        };

        toast.current.show({
          severity: "warn",
          summary: "Acción no permitida",
          detail: mensajes[estadoId] || "Estado no válido para generar kardex",
          life: 5000,
        });
        return;
      }

      // Guardar pre-factura actual para el diálogo
      setKardexDocumentoActual(preFacturaActual);

      if (preFacturaActual.movSalidaAlmacenId) {
        // Ya tiene kardex - Mostrar confirmación nativa
        confirmDialog({
          message: '¿Desea regenerar el kardex con los datos actuales de la pre-factura?\n\nEsto actualizará el movimiento de almacén y recalculará los saldos.',
          header: 'Regenerar Kardex',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Sí, regenerar',
          rejectLabel: 'Cancelar',
          acceptClassName: 'p-button-warning',
          style: { width: '450px' },
          accept: async () => {
            await handleProcesarRegeneracionKardex(preFacturaActual.id);
          },
          reject: () => {
            toast.current.show({
              severity: 'info',
              summary: 'Cancelado',
              detail: 'Regeneración de kardex cancelada',
              life: 2000
            });
          }
        });
      } else {
        // No tiene kardex - Abrir diálogo directamente
        setShowKardexDialog(true);
      }
    } catch (error) {
      console.error("Error en handleGenerarKardex:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar la solicitud",
      });
    }
  };

  const handleProcesarGeneracionKardex = async (datosKardex) => {
    try {
      setLoading(true);

      const preFacturaId = kardexDocumentoActual.id;
      const esRegeneracion = Boolean(kardexDocumentoActual.movSalidaAlmacenId);

      let movimientoId = null;

      if (esRegeneracion) {
        // Regenerar kardex
        const resultado = await regenerarKardexPreFactura(preFacturaId);
        movimientoId = resultado?.movimientoId || kardexDocumentoActual.movSalidaAlmacenId;
      } else {
        // Generar movimiento por primera vez
        const resultado = await generarMovimientoAlmacenPreFactura(preFacturaId, datosKardex);
        movimientoId = resultado?.movimientoId;
      }

      toast.current.show({
        severity: "success",
        summary: esRegeneracion ? "Kardex Regenerado" : "Kardex Generado",
        detail: esRegeneracion
          ? "Movimiento actualizado correctamente con los datos actuales de la pre-factura"
          : `Movimiento de almacén creado correctamente. ID: ${movimientoId}`,
        life: 5000,
      });

      // Cerrar diálogo de kardex
      setShowKardexDialog(false);
      setKardexDocumentoActual(null);

      // Recargar datos de la PreFactura actual en el formulario
      if (preFacturaId) {
        const preFacturaActualizada = await getPreFacturaPorId(preFacturaId);
        setSelectedPreFactura(preFacturaActualizada);
      }

      // Recargar lista en segundo plano
      cargarDatos();
    } catch (error) {
      console.error("Error al generar movimiento:", error);

      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        "Error al generar el movimiento de almacén";

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarRegeneracionKardex = async (preFacturaId) => {
    try {
      setLoading(true);
      // Regenerar kardex (backend usa datos actuales de la PreFactura)
      const resultado = await regenerarKardexPreFactura(preFacturaId);
      const movimientoId = resultado?.movimientoId;
      toast.current.show({
        severity: "success",
        summary: "Kardex Regenerado Exitosamente",
        detail: `Movimiento de almacén actualizado correctamente.`,
        life: 5000,
      });

      // Limpiar estado
      setKardexDocumentoActual(null);

      // Recargar datos de la PreFactura actual en el formulario
      if (preFacturaId) {
        const preFacturaActualizada = await getPreFacturaPorId(preFacturaId);
        setSelectedPreFactura(preFacturaActualizada);
      }

      // Recargar lista en segundo plano
      await cargarDatos();
    } catch (error) {
      console.error("Error al regenerar kardex:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al regenerar el kardex",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };


  const onRowClick = (event) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      abrirDialogoEdicion(event.data);
    }
  };


  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => abrirDialogoEdicion(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          style={{ padding: "0.25rem", minWidth: "auto" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => confirmarEliminacion(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          style={{ padding: "0.25rem", minWidth: "auto" }}
        />
        <AuditoriaDialog
          data={rowData}
          fieldMapping={{
            fechaCreacion: "fechaCreacion",
            creadoPor: "creadoPor",
            fechaActualizacion: "fechaActualizacion",
            actualizadoPor: "actualizadoPor",
          }}
          usuarios={personalOptions}
        />
      </div>
    );
  };

  const empresaTemplate = (rowData) => {
    if (!rowData.empresa) return "N/A";

    return (
      <div>
        <div className="font-medium text-blue-600">
          {rowData.empresa.razonSocial || "Sin nombre"}
        </div>
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    if (!rowData.cliente) return "N/A";

    return (
      <div>
        <div className="font-medium">
          {rowData.cliente.razonSocial || "Sin nombre"}
        </div>
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    if (!rowData.estadoDoc) return "N/A";

    // Usar el severityColor del estado o 'secondary' por defecto
    const severity = rowData.estadoDoc.severityColor || "secondary";
    return (
      <Badge
        value={rowData.estadoDoc.descripcion}
        severity={severity}
        size="small"
      />
    );
  };

  const fechaDocumentoTemplate = (rowData) => {
    return formatearFecha(rowData.fechaDocumento, "");
  };

  const monedaTemplate = (rowData) => {
    return rowData.moneda?.codigoSunat || "";
  };

  const tipoCambioTemplate = (rowData) => {
    return rowData.tipoCambio
      ? Number(rowData.tipoCambio).toLocaleString("es-PE", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })
      : "";
  };
  const tipoDocumentoTemplate = (rowData) => {
    return rowData.tipoDocumentoFinal?.codigo || "N/A";
  };

  const fechaContableTemplate = (rowData) => {
    return formatearFecha(rowData.fechaContable, "");
  };

  const unidadNegocioTemplate = (rowData) => {
    return rowData.unidadNegocio?.nombre || "N/A";
  };
  const igvTemplate = (rowData) => {
    return rowData.exoneradoIgv ? (
      <Tag value="EXONERADO" severity="danger" />
    ) : (
      <Tag value="AFECTO" severity="success" />
    );
  };

  const montosTemplate = (rowData) => {
    const formato = formatearMontoConSigno(rowData.total || 0);
    const simboloMoneda = rowData.moneda?.simbolo || "";
    const colorFondoMoneda = rowData.moneda?.colorFondo || "#FFFF";

    return (
      <div style={{ textAlign: "right" }}>
        <Tag
          value={`${simboloMoneda} ${formato.valor}`}
          severity={formato.esNegativo ? "danger" : "info"}
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: formato.color,
            backgroundColor: colorFondoMoneda
          }}
        />
      </div>
    );
  };


  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setClienteSeleccionado(null);
    setRangoFechas(null);
    setEstadoSeleccionado(null);
    setTiposDocInternoAplicados([]);
    setTiposDocFinalAplicados([]);
    setTiposDocInternoTemp([]);
    setTiposDocFinalTemp([]);
    setFiltroParticionadas(null);
    setProductoSeleccionado(null);
    setNroLiquidacionBusqueda("");
  };


  // Abrir OverlayPanel de filtros avanzados
  const abrirFiltrosAvanzados = (event) => {
    // Sincronizar temporales con aplicados al abrir
    setTiposDocInternoTemp([...tiposDocInternoAplicados]);
    setTiposDocFinalTemp([...tiposDocFinalAplicados]);
    opFiltrosAvanzados.current.toggle(event);
  };

  // Aplicar filtros avanzados
  const aplicarFiltrosAvanzados = () => {
    setTiposDocInternoAplicados([...tiposDocInternoTemp]);
    setTiposDocFinalAplicados([...tiposDocFinalTemp]);
    opFiltrosAvanzados.current.hide();

    toast.current?.show({
      severity: "success",
      summary: "Filtros Aplicados",
      detail: "Los filtros se han aplicado correctamente",
      life: 2000,
    });
  };

  // Limpiar filtros avanzados (solo temporales)
  const limpiarFiltrosAvanzados = () => {
    setTiposDocInternoTemp([]);
    setTiposDocFinalTemp([]);
  };

  // Cancelar y cerrar sin aplicar
  const cancelarFiltrosAvanzados = () => {
    // Restaurar temporales a los aplicados
    setTiposDocInternoTemp([...tiposDocInternoAplicados]);
    setTiposDocFinalTemp([...tiposDocFinalAplicados]);
    opFiltrosAvanzados.current.hide();
  };


  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={preFacturasFiltradas}
          selection={selectedRecords}
          onSelectionChange={(e) => setSelectedRecords(e.value)}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          footer={footerTemplate}  // ✅ AGREGAR ESTA LÍNEA
          rows={25}
          rowsPerPageOptions={[25, 50, 100, 150]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Ventas"
          sortField="id"
          sortOrder={-1}
          style={{
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
          }
          emptyMessage="No se encontraron VENTAS"
          header={
            <div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2>VENTAS</h2>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>
                    Empresa*
                  </label>
                  <EmpresaSelector
                    empresaId={usuario?.empresaId}
                    onEmpresaChange={(id) => {
                      setEmpresaIdSelector(id);
                      setEmpresaSeleccionada(id);
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    onClick={abrirDialogoNuevo}
                    className="p-button-primary"
                    style={{ width: "100%" }}
                    disabled={
                      !permisos.puedeCrear || loading || !empresaIdSelector
                    }
                    tooltip={
                      !permisos.puedeCrear
                        ? "No tiene permisos para crear"
                        : !empresaIdSelector
                          ? "Seleccione una empresa primero"
                          : "Nueva Pre-Factura"
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    icon="pi pi-search"
                    label="Consultar Stock"
                    onClick={() => setShowConsultaStock(true)}
                    className="p-button-info"
                    style={{ width: "100%" }}
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
                    label="Asignar Tipo Operación SUNAT"
                    icon="pi pi-tag"
                    onClick={() => setShowAsignarTipoOpDialog(true)}
                    disabled={!selectedRecords || selectedRecords.length === 0}
                    className="p-button-info"
                    tooltip="Asignar tipo de operación SUNAT a registros seleccionados"
                    tooltipOptions={{ position: "top" }}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Asignar Tipo Afectación IGV"
                    icon="pi pi-percentage"
                    onClick={() => setShowAsignarTipoAfectacionDialog(true)}
                    disabled={!selectedRecords || selectedRecords.length === 0}
                    className="p-button-warning"
                    tooltip="Asignar tipo de afectación IGV a registros seleccionados"
                    tooltipOptions={{ position: "top" }}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Exportar Excel"
                    icon="pi pi-file-excel"
                    className="p-button-success"
                    onClick={handleExportarExcel}
                    disabled={loading}
                    tooltip="Exportar todas las Ventas a Excel"
                    style={{ width: "100%" }}
                  />
                </div>
                {/* Filtro Tipo Libro */}
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Tipo Libro
                  </label>
                  <FiltroTipoLibroButton
                    value={filtroTipoLibro}
                    onChange={setFiltroTipoLibro}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  {/* Filtro de Unidad de Negocio - Compacto */}
                  <UnidadNegocioFilter />
                </div>

              </div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <label htmlFor="clienteFiltro" style={{ fontWeight: "bold" }}>
                    Cliente
                  </label>
                  <Dropdown
                    id="clienteFiltro"
                    value={clienteSeleccionado}
                    options={clientesUnicos.map((p) => ({
                      label: p.razonSocial,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => setClienteSeleccionado(e.value)}
                    placeholder="Todos"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>
                    Rango de Fechas
                  </label>
                  <Calendar
                    id="rangoFechas"
                    value={rangoFechas}
                    onChange={(e) => setRangoFechas(e.value)}
                    selectionMode="range"
                    dateFormat="dd/mm/yy"
                    showIcon
                    placeholder="Seleccionar rango..."
                    style={{ width: "100%" }}
                    disabled={loading}
                    readOnlyInput
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
                    Estado
                  </label>
                  <Dropdown
                    id="estadoFiltro"
                    value={estadoSeleccionado}
                    options={estadosUnicos.map((e) => ({
                      label: e.descripcion,
                      value: Number(e.id),
                    }))}
                    onChange={(e) => setEstadoSeleccionado(e.value)}
                    placeholder="Todos"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    disabled={loading}
                  />
                </div>
                {/* Filtros Avanzados de Tipo de Documento */}
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Filtros Avanzados
                  </label>
                  <Button
                    label="Tipos de Documento"
                    icon="pi pi-filter"
                    onClick={abrirFiltrosAvanzados}
                    className="p-button-outlined"
                    badge={
                      (tiposDocInternoAplicados.length + tiposDocFinalAplicados.length) > 0
                        ? String(tiposDocInternoAplicados.length + tiposDocFinalAplicados.length)
                        : null
                    }
                    badgeClassName="p-badge-info"
                    style={{
                      width: "100%",
                      fontWeight: "bold",
                      justifyContent: "flex-start",
                    }}
                    disabled={loading}
                    tooltip={
                      (tiposDocInternoAplicados.length + tiposDocFinalAplicados.length) > 0
                        ? `${tiposDocInternoAplicados.length + tiposDocFinalAplicados.length} filtros activos`
                        : "Filtrar por tipos de documento"
                    }
                    tooltipOptions={{ position: "top" }}
                  />

                  {/* OverlayPanel de Filtros Avanzados */}
                  <OverlayPanel ref={opFiltrosAvanzados} style={{ width: "450px" }}>
                    <div style={{ padding: "10px" }}>
                      <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#2c3e50" }}>
                        <i className="pi pi-filter" style={{ marginRight: "8px" }}></i>
                        Filtros de Tipo de Documento
                      </h3>

                      {/* Tipo Documento Interno */}
                      <div style={{ marginBottom: "20px" }}>
                        <label htmlFor="tipoDocInternoTemp" style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                          Tipo Documento Interno
                        </label>
                        <MultiSelect
                          id="tipoDocInternoTemp"
                          value={tiposDocInternoTemp}
                          options={tiposDocInternoDisponibles.map((t) => ({
                            label: `${t.codigo || ""} - ${t.descripcion || t.nombre || ""}`,
                            value: Number(t.id),
                          }))}
                          onChange={(e) => setTiposDocInternoTemp(e.value)}
                          placeholder="Seleccionar tipos"
                          optionLabel="label"
                          optionValue="value"
                          display="chip"
                          filter
                          showSelectAll={true}
                          selectAllLabel="Seleccionar Todos"
                          style={{ width: "100%" }}
                          maxSelectedLabels={3}
                          emptyMessage="No hay tipos disponibles con los filtros actuales"
                        />
                        <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                          {tiposDocInternoDisponibles.length} tipo(s) disponible(s)
                        </small>
                      </div>

                      {/* Tipo Documento Final */}
                      <div style={{ marginBottom: "20px" }}>
                        <label htmlFor="tipoDocFinalTemp" style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                          Comprobante Final
                        </label>
                        <MultiSelect
                          id="tipoDocFinalTemp"
                          value={tiposDocFinalTemp}
                          options={tiposDocFinalDisponibles.map((t) => ({
                            label: `${t.codigo || ""} - ${t.descripcion || t.nombre || ""}`,
                            value: Number(t.id),
                          }))}
                          onChange={(e) => setTiposDocFinalTemp(e.value)}
                          placeholder="Seleccionar comprobantes"
                          optionLabel="label"
                          optionValue="value"
                          display="chip"
                          filter
                          showSelectAll={true}
                          selectAllLabel="Seleccionar Todos"
                          style={{ width: "100%" }}
                          maxSelectedLabels={3}
                          emptyMessage="No hay comprobantes disponibles con los filtros actuales"
                        />
                        <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                          {tiposDocFinalDisponibles.length} comprobante(s) disponible(s)
                        </small>
                      </div>

                      {/* Botones de acción */}
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", borderTop: "1px solid #dee2e6", paddingTop: "15px" }}>
                        <Button
                          label="Limpiar"
                          icon="pi pi-times"
                          onClick={limpiarFiltrosAvanzados}
                          className="p-button-text p-button-secondary"
                        />
                        <Button
                          label="Cancelar"
                          icon="pi pi-ban"
                          onClick={cancelarFiltrosAvanzados}
                          className="p-button-text"
                        />
                        <Button
                          label="Aplicar"
                          icon="pi pi-check"
                          onClick={aplicarFiltrosAvanzados}
                          className="p-button-success"
                        />
                      </div>
                    </div>
                  </OverlayPanel>
                </div>
                {/* Filtro por Producto - Dropdown */}
                <div style={{ flex: 2 }}>
                  <label htmlFor="productoDropdown" style={{ fontWeight: "bold" }}>
                    Producto
                  </label>
                  <Dropdown
                    id="productoDropdown"
                    value={productoSeleccionado}
                    options={productosUnicos.map((p) => ({
                      label: p.descripcionArmada,
                      value: p.id,
                    }))}
                    onChange={(e) => setProductoSeleccionado(e.value)}
                    placeholder="Seleccionar producto..."
                    filter
                    showClear
                    style={{ width: "100%" }}
                    disabled={loading}
                    emptyMessage="No hay productos en las Ventas filtradas"
                  />
                </div>
                {/* Filtro por Número de Liquidación */}
                <div style={{ flex: 2 }}>
                  <label htmlFor="nroLiquidacionInput" style={{ fontWeight: "bold" }}>
                    N° Ref./Dcmto/#ID
                  </label>
                  <InputText
                    id="nroLiquidacionInput"
                    value={nroLiquidacionBusqueda}
                    onChange={(e) => setNroLiquidacionBusqueda(e.target.value)}
                    placeholder="Buscar x N° Referencia/Doc (#ID para buscar por ID)..."
                    style={{ width: "100%" }}
                    disabled={loading}
                  />
                </div>
                {/* Filtro de Particionadas - Botón único que cicla */}
                <div style={{ flex: 1 }}>
                  <Button
                    label={
                      filtroParticionadas === null
                        ? "Todas"
                        : filtroParticionadas === "originales"
                          ? "Particionadas Originales"
                          : "Particionadas Copias"
                    }
                    icon={
                      filtroParticionadas === null
                        ? "pi pi-list"
                        : filtroParticionadas === "originales"
                          ? "pi pi-clone"
                          : "pi pi-copy"
                    }
                    severity={
                      filtroParticionadas === null
                        ? "info"
                        : filtroParticionadas === "originales"
                          ? "warning"
                          : "success"
                    }
                    onClick={() => {
                      if (filtroParticionadas === null) {
                        setFiltroParticionadas("originales");
                      } else if (filtroParticionadas === "originales") {
                        setFiltroParticionadas("copias");
                      } else {
                        setFiltroParticionadas(null);
                      }
                    }}
                    badge={
                      filtroParticionadas === "originales"
                        ? items
                          .filter((i) => i.esParticionada === true)
                          .length.toString()
                        : filtroParticionadas === "copias"
                          ? items
                            .filter(
                              (i) =>
                                i.preFacturaOrigenId !== null &&
                                i.preFacturaOrigenId !== undefined,
                            )
                            .length.toString()
                          : undefined
                    }
                    disabled={loading}
                    tooltip="Click para cambiar filtro: Todas → Originales → Copias → Todas"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>
            </div>
          }
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            exportable={false}
          />
          <Column
            field="id"
            header="ID"
            style={{ width: 80, verticalAlign: "top" }}
            sortable
          />
          <Column
            field="tipoDocumento.codigo"
            header="Tipo Dcmto Interno"
            body={(rowData) => rowData.tipoDocumento?.codigo || "N/A"}
            style={{ width: 150, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="empresaId"
            header="Empresa"
            body={empresaTemplate}
            style={{ verticalAlign: "top" }}
          />

          <Column
            field="unidadNegocioId"
            header="Unidad Negocio"
            body={unidadNegocioTemplate}
            style={{ width: 150, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="tipoDocumentoId"
            header="Tipo Dcmto Final"
            body={(rowData) => rowData.tipoDocumentoFinal?.codigo || "N/A"}
            style={{ width: 150, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="numeroDocumentoFinal"
            header="N° Docmto Final"
            body={(rowData) => rowData.numeroDocumentoFinal || rowData.numeroDocumento || "N/A"}
            style={{ width: 140, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="fechaDocumento"
            header="Fecha Documento"
            body={fechaDocumentoTemplate}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="clienteId"
            header="Cliente"
            body={clienteTemplate}
            style={{ verticalAlign: "top" }}
            sortable
          />
          <Column
            field="nroLiquidacionFacturacion"
            header="N° Referencia"
            style={{ width: 140, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="monedaId"
            header="Moneda"
            body={monedaTemplate}
            style={{ width: 80, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            header="Monto"
            body={montosTemplate}
            style={{ width: 180, textAlign: "right", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "right" }}
          />
          <Column
            field="tipoCambio"
            header="T/C"
            body={tipoCambioTemplate}
            style={{ width: 90, textAlign: "right", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "right" }}
            sortable
          />
          <Column
            field="estadoId"
            header="Estado"
            body={estadoTemplate}
            style={{ width: 150, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            header="Origen"
            body={(rowData) => {
              if (rowData.preFacturaOrigenId) {
                return (
                  <Tag
                    severity="info"
                    value="COPIA"
                    icon="pi pi-copy"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      handleIrAPreFacturaOrigen(rowData.preFacturaOrigenId)
                    }
                  />
                );
              } else if (rowData.esParticionada) {
                return (
                  <Tag severity="warning" value="ORIGINAL" icon="pi pi-clone" />
                );
              }
              return null;
            }}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
          />
          <Column
            field="esExoneradoAlIGV"
            header="IGV"
            body={igvTemplate}
            style={{ width: 110, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="fechaContable"
            header="Fecha Contable"
            body={fechaContableTemplate}
            style={{ width: 120, textAlign: "center", verticalAlign: "top" }}
            sortable
          />
          <Column
            field="tipoOperacionSunat.descripcion"
            header="Tipo Operación SUNAT"
            body={(rowData) =>
              rowData.tipoOperacionSunat?.descripcion
            }
            sortable
            filter
            filterPlaceholder="Buscar por tipo operación"
            style={{ minWidth: "100px" }}
          />
          <Column
            field="tipoAfectacionIGV.nombre"
            header="Tipo Afectación IGV"
            body={(rowData) =>
              rowData.tipoAfectacionIGV?.nombre
            }
            sortable
            filter
            filterPlaceholder="Buscar por tipo afectación"
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Detrac."
            body={(rowData) => {
              if (!rowData.aplicaDetraccion) return "-";
              return (
                <div style={{ textAlign: "center" }}>
                  <Tag
                    value={`${Number(rowData.porcentajeDetraccion || 0).toFixed(2)}%`}
                    severity="warning"
                    icon="pi pi-percentage"
                    style={{ fontSize: "0.75rem" }}
                  />
                </div>
              );
            }}
            style={{ width: 90, textAlign: "center", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            header="Reten."
            body={(rowData) => {
              if (!rowData.aplicaRetencion) return "-";
              return (
                <div style={{ textAlign: "center" }}>
                  <Tag
                    value={`${Number(rowData.porcentajeRetencion || 0).toFixed(2)}%`}
                    severity="help"
                    icon="pi pi-percentage"
                    style={{ fontSize: "0.75rem" }}
                  />
                </div>
              );
            }}
            style={{ width: 90, textAlign: "center", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            header="Percep."
            body={(rowData) => {
              if (!rowData.aplicaPercepcion) return "-";
              return (
                <div style={{ textAlign: "center" }}>
                  <Tag
                    value={`${Number(rowData.porcentajePercepcion || 0).toFixed(2)}%`}
                    severity="info"
                    icon="pi pi-percentage"
                    style={{ fontSize: "0.75rem" }}
                  />
                </div>
              );
            }}
            style={{ width: 90, textAlign: "center", verticalAlign: "top" }}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "110px", textAlign: "center", verticalAlign: "top" }}
            header="Acciones"
          />

        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        header={
          isEditing
            ? `Editar Pre-Factura: ${selectedPreFactura?.codigo || ""}`
            : "Nueva Pre-Factura"
        }
        style={{ width: "1300px" }}
        modal
        maximizable
        maximized={true}
        onHide={cerrarDialogo}
      >
        <PreFacturaForm
          key={`${selectedPreFactura?.id || "new"}-${refreshKey}`}
          isEdit={isEditing}
          defaultValues={selectedPreFactura}
          onSubmit={handleGuardarPreFactura}
          onCancel={cerrarDialogo}
          onAprobar={handleAprobarPreFactura}
          onAnular={handleAnularPreFactura}
          onReactivar={handleReactivarPreFactura}
          onActualizar={handleActualizarPreFactura}
          onClienteCreado={handleClienteCreado}
          onIrAPreFacturaOrigen={handleIrAPreFacturaOrigen}
          loading={loading}
          toast={toast}
          permisos={permisos}
          readOnly={
            !!selectedPreFactura &&
            !!selectedPreFactura.numeroDocumento &&
            !permisos.puedeEditar
          }
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          clientes={clientes}
          tiposProducto={tiposProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          monedas={monedas}
          unidadesNegocio={unidadesNegocio}
          bancos={bancos}
          periodosContables={periodosContables}
          motivosNCND={motivosNCND}
          incoterms={incoterms}
          tiposContenedor={tiposContenedor}
          empresaFija={empresaSeleccionada}
          onIrAMovimientoAlmacen={handleIrAMovimientoAlmacen}
          onIrACotizacionVenta={handleIrACotizacionVenta}
          onIrAContratoServicio={handleIrAContratoServicio}
          onGenerarKardex={handleGenerarKardex}
        />
      </Dialog>

      {/* DIALOG PARA MOSTRAR COTIZACIÓN ORIGEN */}
      <Dialog
        header="Cotización de Venta Origen"
        visible={showCotizacionDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowCotizacionDialog(false)}
        modal
        maximizable
        maximized={true}
      >
        <CotizacionVentasForm
          isEdit={true}
          defaultValues={cotizacionOrigen || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          clientes={clientes}
          tiposProducto={tiposProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          monedas={monedas}
          unidadesNegocio={unidadesNegocio}
          incoterms={incoterms}
          tiposContenedor={tiposContenedor}
          onSubmit={() => { }}
          onCancel={() => setShowCotizacionDialog(false)}
          onAprobar={() => { }}
          onAnular={() => { }}
          loading={false}
          readOnly={true}
          toast={toast}
          permisos={{ puedeEditar: false, puedeEliminar: false }}
        />
      </Dialog>

      {/* DIALOG PARA MOSTRAR MOVIMIENTO DE ALMACÉN */}
      <Dialog
        header="Movimiento de Almacén (Kardex)"
        visible={showMovimientoAlmacenDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowMovimientoAlmacenDialog(false)}
        modal
        maximizable
        maximized={true}
      >
        <MovimientoAlmacenForm
          isEdit={true}
          defaultValues={movimientoAlmacenOrigen || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          entidadesComerciales={clientes}
          productos={productos}
          personalOptions={personalOptions}
          empresaFija={empresaSeleccionada}
          centrosCosto={centrosCosto}
          monedas={monedas}
          onSubmit={() => { }}
          onCancel={() => setShowMovimientoAlmacenDialog(false)}
          onCerrar={() => { }}
          onAnular={() => { }}
          onGenerarKardex={() => { }}
          loading={false}
          toast={toast}
          permisos={{ puedeVer: true, puedeEditar: false }}
          readOnly={true}
        />
      </Dialog>

      {/* DIALOG PARA MOSTRAR CONTRATO DE SERVICIO */}
      <Dialog
        header="Contrato de Servicio Origen"
        visible={showContratoServicioDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowContratoServicioDialog(false)}
        modal
        maximizable
        maximized={true}
      >
        <ContratoServicioForm
          isEdit={true}
          defaultValues={contratoServicioOrigen || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          clientes={clientes}
          tiposProducto={tiposProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          monedas={monedas}
          unidadesNegocio={unidadesNegocio}
          incoterms={incoterms}
          tiposContenedor={tiposContenedor}
          onSubmit={() => { }}
          onCancel={() => setShowContratoServicioDialog(false)}
          onAprobar={() => { }}
          onAnular={() => { }}
          loading={false}
          readOnly={true}
          toast={toast}
          permisos={{ puedeEditar: false, puedeEliminar: false }}
        />
      </Dialog>

      {/* Diálogo de generación de Kardex */}
      {kardexDocumentoActual && (
        <GenerarKardexDialog
          visible={showKardexDialog}
          onHide={() => {
            setShowKardexDialog(false);
            setKardexDocumentoActual(null);
          }}
          tipoDocumento="preFactura"
          documentoId={kardexDocumentoActual?.id}
          numeroDocumento={kardexDocumentoActual?.numeroDocumento}
          serieDocumento={kardexDocumentoActual?.serieDocumento}
          entidadComercial={kardexDocumentoActual?.cliente?.razonSocial}
          entidadComercialId={kardexDocumentoActual?.clienteId}
          totalItems={kardexDocumentoActual?.detalles?.length || 0}
          empresaId={kardexDocumentoActual?.empresaId}
          empresaEntidadComercialId={kardexDocumentoActual?.empresa?.entidadComercialId}
          fechaDocumento={kardexDocumentoActual?.fechaDocumento}
          detallesDocumento={kardexDocumentoActual?.detalles || []}
          onGenerar={handleProcesarGeneracionKardex}
          loading={loading}
        />
      )}

      {/* Diálogo de Consulta de Stock */}
      <ConsultaStockForm
        visible={showConsultaStock}
        onHide={() => setShowConsultaStock(false)}
        empresaIdInicial={empresaSeleccionada}
      />

      <AsignarTipoOperacionSunatDialog
        visible={showAsignarTipoOpDialog}
        onHide={() => setShowAsignarTipoOpDialog(false)}
        selectedIds={selectedRecords.map(r => r.id)}
        onAplicar={handleAsignarTipoOperacion}
        toast={toast}
        entidadNombre="PreFacturas"
      />
      <AsignarTipoAfectacionIGVDialog
        visible={showAsignarTipoAfectacionDialog}
        onHide={() => setShowAsignarTipoAfectacionDialog(false)}
        selectedIds={selectedRecords.map(r => r.id)}
        onAplicar={handleAsignarTipoAfectacion}
        toast={toast}
        entidadNombre="PreFacturas"
      />
      <ConfirmDialog />
    </div>
  );
};

export default PreFactura;
