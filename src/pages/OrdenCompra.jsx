// src/pages/OrdenCompra.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { OverlayPanel } from "primereact/overlaypanel";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { confirmDialog } from "primereact/confirmdialog";
import OrdenCompraForm from "../components/ordenCompra/OrdenCompraForm";
import RequerimientoCompraForm from "../components/requerimientoCompra/RequerimientoCompraForm";
import MovimientoAlmacenForm from "../components/movimientoAlmacen/MovimientoAlmacenForm";
import {
  getOrdenesCompra,
  getOrdenCompraPorId,
  crearOrdenCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  aprobarOrdenCompra,
  anularOrdenCompra,
  generarOrdenDesdeRequerimiento,
  generarMovimientoAlmacen,
  regenerarKardexOrdenCompra,
} from "../api/ordenCompra";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getRequerimientosCompra } from "../api/requerimientoCompra";
import { getMonedas } from "../api/moneda";
import { getUnidadesNegocio } from "../api/unidadNegocio";
import { getCentrosCosto } from "../api/centroCosto";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getSeriesDoc } from "../api/serieDoc";
import { getConceptosMovAlmacen } from "../api/conceptoMovAlmacen";
import { getTiposProducto } from "../api/tipoProducto";
import { getAllTipoEstadoProducto } from "../api/tipoEstadoProducto";
import { getAllDestinoProducto } from "../api/destinoProducto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha, formatearNumero } from "../utils/utils";
import UnidadNegocioFilter from "../components/common/UnidadNegocioFilter";
import { useUnidadNegocioFilter } from "../hooks/useUnidadNegocioFilter";
import GenerarKardexDialog from "../components/common/kardex/GenerarKardexDialog";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { getMotivoNotaCreditoDebitoActivos } from "../api/ventas/motivoNotaCreditoDebito";
import { getAllUbicacionesFisicas } from "../api/ubicacionFisica";
import ConsultaStockForm from "../components/common/ConsultaStockForm";
import { useActualizarRegistroEnLista } from "../hooks/useActualizarRegistroEnLista";
import { useDashboardStore } from "../shared/stores/useDashboardStore";
import { generarOrdenesCompraExcel } from "../components/ordenCompra/reports/generarOrdenesCompraExcel";
import AsignarCentroCostoMasivo from "../components/common/AsignarCentroCostoMasivo";
import { asignarCentroCostoMasivo } from "../api/ordenCompra";
import { formatearMontoConSigno } from "../utils/tiposDocumento.constants";
import FiltroTipoLibroButton from "../components/common/FiltroTipoLibroButton";

export default function OrdenCompra({ ruta }) {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const toast = useRef(null);
  const opFiltrosAvanzados = useRef(null);

  const [items, setItems] = useState([]);

  // ✅ DECLARAR itemsFiltrados ANTES de usarlo
  const [itemsFiltrados, setItemsFiltrados] = useState([]);

  // ✅ Hook para actualizar registros sin recargar
  const { actualizarRegistro, agregarRegistro, eliminarRegistro } =
    useActualizarRegistroEnLista(items, setItems);


  // Filtrado automático por Unidad de Negocio
  const { datosFiltrados: ordenesFiltradas } = useUnidadNegocioFilter(itemsFiltrados);

  const [empresas, setEmpresas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState([]);
  const [destinosProducto, setDestinosProducto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [conceptosMovAlmacen, setConceptosMovAlmacen] = useState([]);
  const [estadosMercaderia, setEstadosMercaderia] = useState([]);
  const [estadosCalidad, setEstadosCalidad] = useState([]);
  const [ubicacionesFisicas, setUbicacionesFisicas] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [motivosNCND, setMotivosNCND] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequerimientoDialog, setShowRequerimientoDialog] = useState(false);
  const [requerimientoOrigen, setRequerimientoOrigen] = useState(null);
  const [showMovimientoAlmacenDialog, setShowMovimientoAlmacenDialog] =
    useState(false);
  const [movimientoAlmacenOrigen, setMovimientoAlmacenOrigen] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [empresaIdSelector, setEmpresaIdSelector] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosUnicos, setProductosUnicos] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [kardexDocumentoActual, setKardexDocumentoActual] = useState(null);
  const [showConsultaStock, setShowConsultaStock] = useState(false);

  // Estados para filtros de rango de fechas
  const [rangoFechaFacturacion, setRangoFechaFacturacion] = useState(null);
  const [tipoDocumentoFinalIdSeleccionado, setTipoDocumentoFinalIdSeleccionado] = useState(null);

  // Estados para filtros avanzados de tipo documento
  const [tiposDocInternoAplicados, setTiposDocInternoAplicados] = useState([]);
  const [tiposDocFinalAplicados, setTiposDocFinalAplicados] = useState([]);
  const [tiposDocInternoDisponibles, setTiposDocInternoDisponibles] = useState([]);
  const [tiposDocFinalDisponibles, setTiposDocFinalDisponibles] = useState([]);
  const [tiposDocInternoTemp, setTiposDocInternoTemp] = useState([]);
  const [tiposDocFinalTemp, setTiposDocFinalTemp] = useState([]);

  // Estados para opciones de dropdowns
  const [tiposDocumentoFinal, setTiposDocumentoFinal] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]); // ✅ AGREGAR
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState([]);
  const [showAsignarCentroCostoDialog, setShowAsignarCentroCostoDialog] = useState(false);
  const [filtroTipoLibro, setFiltroTipoLibro] = useState("FISCAL_SSI");
  const [busquedaDocumento, setBusquedaDocumento] = useState("");

  // ========================================
  // 🆕 CARGAR DATOS AL MONTAR EL COMPONENTE
  // ========================================
  useEffect(() => {
    cargarDatos();
  }, []);


  useEffect(() => {
    const proveedoresMap = new Map();
    ordenesFiltradas.forEach((item) => {
      if (item.proveedorId && item.proveedor) {
        proveedoresMap.set(item.proveedorId, item.proveedor);
      }
    });
    const proveedoresArray = Array.from(proveedoresMap.values());
    setProveedoresUnicos(proveedoresArray);
  }, [ordenesFiltradas]);

  // ✅ Extraer productos únicos de los detalles de las órdenes filtradas
  useEffect(() => {
    const productosMap = new Map();
    ordenesFiltradas.forEach((orden) => {
      if (orden.detalles && Array.isArray(orden.detalles)) {
        orden.detalles.forEach((detalle) => {
          if (detalle.producto && detalle.producto.id) {
            productosMap.set(detalle.producto.id, {
              id: detalle.producto.id,
              descripcionArmada: detalle.producto.descripcionArmada || "Sin descripción",
            });
          }
        });
      }
    });
    const productosArray = Array.from(productosMap.values()).sort((a, b) =>
      a.descripcionArmada.localeCompare(b.descripcionArmada)
    );
    setProductosUnicos(productosArray);

    // Limpiar selección si el producto ya no existe en los filtrados
    if (productoSeleccionado && !productosArray.find(p => Number(p.id) === Number(productoSeleccionado))) {
      setProductoSeleccionado(null);
    }
  }, [ordenesFiltradas, productoSeleccionado]);


  // ✅ Calcular tipos de documento disponibles dinámicamente
  useEffect(() => {
    // Tipos de Documento Interno disponibles
    const tiposInternoMap = new Map();
    ordenesFiltradas.forEach((orden) => {
      if (orden.tipoDocumento) {
        tiposInternoMap.set(orden.tipoDocumento.id, orden.tipoDocumento);
      }
    });
    const tiposInternoArray = Array.from(tiposInternoMap.values()).sort((a, b) =>
      (a.descripcion || a.nombre || "").localeCompare(b.descripcion || b.nombre || "")
    );
    setTiposDocInternoDisponibles(tiposInternoArray);

    // Tipos de Documento Final disponibles
    const tiposFinalMap = new Map();
    ordenesFiltradas.forEach((orden) => {
      if (orden.tipoDocumentoFinal) {
        tiposFinalMap.set(orden.tipoDocumentoFinal.id, orden.tipoDocumentoFinal);
      }
    });
    const tiposFinalArray = Array.from(tiposFinalMap.values()).sort((a, b) =>
      (a.descripcion || a.nombre || "").localeCompare(b.descripcion || b.nombre || "")
    );
    setTiposDocFinalDisponibles(tiposFinalArray);
  }, [ordenesFiltradas]);


  // ✅ Filtrado completo de órdenes
  useEffect(() => {
    let filtered = items;

    // Filtro por empresa
    if (empresaSeleccionada) {
      filtered = filtered.filter(
        (orden) => Number(orden.empresaId) === Number(empresaSeleccionada),
      );
    }

    // Filtro por estado
    if (estadoSeleccionado) {
      filtered = filtered.filter(
        (orden) => Number(orden.estadoId) === Number(estadoSeleccionado),
      );
    }

    // Filtro por proveedor
    if (proveedorSeleccionado) {
      filtered = filtered.filter(
        (orden) => Number(orden.proveedorId) === Number(proveedorSeleccionado),
      );
    }


    // ✅ Filtro por rango de fecha facturación
    if (rangoFechaFacturacion && rangoFechaFacturacion[0] && rangoFechaFacturacion[1]) {
      const fechaInicio = new Date(rangoFechaFacturacion[0]);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(rangoFechaFacturacion[1]);
      fechaFin.setHours(23, 59, 59, 999);

      filtered = filtered.filter((orden) => {
        if (!orden.fechaFacturacion) return false;
        const fechaFact = new Date(orden.fechaFacturacion);
        return fechaFact >= fechaInicio && fechaFact <= fechaFin;
      });
    }


    // ✅ Filtro por tipo documento final (antiguo - mantener por compatibilidad)
    if (tipoDocumentoFinalIdSeleccionado) {
      filtered = filtered.filter(
        (orden) => Number(orden.tipoDocumentoFinalId) === Number(tipoDocumentoFinalIdSeleccionado),
      );
    }

    // ✅ Filtros avanzados por tipos de documento interno (múltiple)
    if (tiposDocInternoAplicados && tiposDocInternoAplicados.length > 0) {
      filtered = filtered.filter((orden) =>
        tiposDocInternoAplicados.some(id => Number(orden.tipoDocumentoId) === Number(id))
      );
    }

    // ✅ Filtros avanzados por tipos de documento final (múltiple)
    if (tiposDocFinalAplicados && tiposDocFinalAplicados.length > 0) {
      filtered = filtered.filter((orden) =>
        tiposDocFinalAplicados.some(id => Number(orden.tipoDocumentoFinalId) === Number(id))
      );
    }

    // ✅ Filtro por centro de costo
    if (centroCostoSeleccionado) {
      filtered = filtered.filter(
        (orden) => Number(orden.centroCostoId) === Number(centroCostoSeleccionado),
      );
    }

    // ✅ Filtro por producto (en detalles)
    if (productoSeleccionado) {
      filtered = filtered.filter((orden) => {
        if (orden.detalles && Array.isArray(orden.detalles)) {
          return orden.detalles.some((detalle) => {
            return Number(detalle.producto?.id) === Number(productoSeleccionado);
          });
        }
        return false;
      });
    }

    // Filtro por ID (#) o número de documento final
    if (busquedaDocumento && busquedaDocumento.trim() !== "") {
      const busqueda = busquedaDocumento.trim();

      // Si empieza con #, buscar por ID
      if (busqueda.startsWith("#")) {
        const idBuscado = busqueda.substring(1).trim();
        if (idBuscado && !isNaN(idBuscado)) {
          filtered = filtered.filter((orden) => {
            return String(orden.id) === idBuscado;
          });
        }
      } else {
        // Búsqueda normal en número de documento final
        const busquedaLower = busqueda.toLowerCase();
        filtered = filtered.filter((orden) => {
          const numeroDocFinal = orden.numeroDocumentoFinal || "";
          return numeroDocFinal.toLowerCase().includes(busquedaLower);
        });
      }
    }

    // Filtro por tipo de libro
    if (filtroTipoLibro === "FISCAL_SSI") {
      // Fiscal sin saldos iniciales: FAC, BV, NC, ND
      filtered = filtered.filter((orden) => {
        const codigo = orden.tipoDocumentoFinal?.codigo || orden.tipoDocumento?.codigo || "";
        return ["FAC", "BV", "NC", "ND"].includes(codigo);
      });
    } else if (filtroTipoLibro === "FISCAL_CSI") {
      // Fiscal con saldos iniciales: FAC, BV, NC, ND + todos los SI-*
      filtered = filtered.filter((orden) => {
        const codigo = orden.tipoDocumentoFinal?.codigo || orden.tipoDocumento?.codigo || "";
        return ["FAC", "BV", "NC", "ND"].includes(codigo) || codigo.startsWith("SI-");
      });
    } else if (filtroTipoLibro === "GERENCIAL") {
      // Solo gerenciales: codigoSunat="00" excepto OTROS y SI-*
      filtered = filtered.filter((orden) => {
        const codigo = orden.tipoDocumentoFinal?.codigo || orden.tipoDocumento?.codigo || "";
        const codigoSunat = orden.tipoDocumentoFinal?.codigoSunat || orden.tipoDocumento?.codigoSunat || "";
        return codigoSunat === "00" && codigo !== "00" && !codigo.startsWith("SI-");
      });
    }
    // Si es "TODOS", no se filtra

    setItemsFiltrados(filtered);
  }, [
    items,
    empresaSeleccionada,
    estadoSeleccionado,
    proveedorSeleccionado,
    rangoFechaFacturacion,
    tipoDocumentoFinalIdSeleccionado,
    tiposDocInternoAplicados,
    tiposDocFinalAplicados,
    centroCostoSeleccionado,
    productoSeleccionado,
    filtroTipoLibro,
    busquedaDocumento,
  ]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        ordenesData,
        empresasData,
        proveedoresData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        requerimientosData,
        monedasData,
        centrosCostoData,
        tiposDocumentoData,
        seriesDocData,
        tiposProductoData,
        tiposEstadoProductoData,
        destinosProductoData,
        tiposMovimientoData,
        conceptosMovAlmacenData,
        unidadesNegocioData,
        periodosContablesData,
        motivosNCNDData,
        ubicacionesData,
      ] = await Promise.all([
        getOrdenesCompra(),
        getEmpresas(),
        getEntidadesComerciales(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getRequerimientosCompra(),
        getMonedas(),
        getCentrosCosto(),
        getTiposDocumento(),
        getSeriesDoc(),
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getAllDestinoProducto(),
        getAllTipoMovEntregaRendir(),
        getConceptosMovAlmacen(),
        getUnidadesNegocio({ activo: true }),
        getPeriodosContables(), // ✅ AGREGADO
        getMotivoNotaCreditoDebitoActivos(),
        getAllUbicacionesFisicas(),
      ]);
      setEmpresas(empresasData);
      setProveedores(proveedoresData);
      setFormasPago(formasPagoData);
      setProductos(productosData);
      setMonedas(monedasData);
      setCentrosCosto(centrosCostoData);
      setTiposDocumento(tiposDocumentoData);
      setSeriesDoc(seriesDocData);
      setTiposProducto(tiposProductoData);
      setTiposEstadoProducto(tiposEstadoProductoData);
      setDestinosProducto(destinosProductoData);
      setTiposMovimiento(tiposMovimientoData);
      setConceptosMovAlmacen(conceptosMovAlmacenData);

      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 12 && !e.cesado,
      );
      setEstadosDoc(estadosDocFiltrados);

      const estadosMercaderiaFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 2 && !e.cesado,
      );
      setEstadosMercaderia(estadosMercaderiaFiltrados);

      const estadosCalidadFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 10 && !e.cesado,
      );
      setEstadosCalidad(estadosCalidadFiltrados);
      setUbicacionesFisicas(ubicacionesData || []);

      const ordenesNormalizadas = ordenesData.map((orden) => ({
        ...orden,
        estadoDoc: estadosDocFiltrados.find(
          (e) => Number(e.id) === Number(orden.estadoId),
        ),
      }));
      setItems(ordenesNormalizadas);

      const requerimientosAprobados = requerimientosData.filter(
        (r) => r.estadoDocId === 33,
      );
      setRequerimientos(requerimientosAprobados);
      setPeriodosContables(periodosContablesData || []);
      setMotivosNCND(motivosNCNDData || []);
      if (unidadesNegocioData && Array.isArray(unidadesNegocioData)) {
        setUnidadesNegocio(
          unidadesNegocioData.map((un) => ({ ...un, id: Number(un.id) })),
        );
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };


  // ✅ Cargar tipos de documento DINÁMICAMENTE desde órdenes filtradas
  useEffect(() => {
    if (items.length > 0) {  // ✅ Usar items (todos los datos)
      // Tipos de documento final (únicos)
      const tiposFinal = items
        .filter(o => o.tipoDocumentoFinal)
        .map(o => ({
          label: `${o.tipoDocumentoFinal.codigo} - ${o.tipoDocumentoFinal.descripcion}`,
          value: o.tipoDocumentoFinalId,
        }))
        .filter((item, index, self) =>
          index === self.findIndex(t => t.value === item.value)
        );
      setTiposDocumentoFinal(tiposFinal);
    } else {
      setTiposDocumentoFinal([]);
    }
  }, [items]);  // ✅ Dependencia correcta

  // ✅ Cargar estados únicos desde items filtrados
  useEffect(() => {
    if (itemsFiltrados.length > 0) {
      const estadosMap = new Map();
      itemsFiltrados.forEach((orden) => {
        if (orden.estado) {
          estadosMap.set(Number(orden.estadoId), {
            label: orden.estado.descripcion,
            value: Number(orden.estadoId),
          });
        }
      });
      const estadosArray = Array.from(estadosMap.values());
      setEstadosUnicos(estadosArray);
    } else {
      setEstadosUnicos([]);
    }
  }, [itemsFiltrados]);

  // Función para recargar solo proveedores
  const recargarProveedores = async () => {
    try {
      const proveedoresData = await getEntidadesComerciales();
      setProveedores(proveedoresData);
    } catch (err) {
      console.error(
        "🔴 [OrdenCompra] Error al recargar proveedores:",
        err,
      );
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo recargar el listado de proveedores",
        life: 3000,
      });
    }
  };

  const handleEdit = async (rowData) => {
    try {
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenCompleta = await getOrdenCompraPorId(rowData.id);

      setEditing(ordenCompleta);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar orden:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la orden para edición",
      });
    }
  };

  const recargarOrdenActual = async () => {
    if (!editing?.id) return;

    try {
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenActualizada = await getOrdenCompraPorId(editing.id);
      setEditing(ordenActualizada);
    } catch (error) {
      console.error("❌ [OrdenCompra] Error al recargar orden:", error);
    }
  };

  const handleDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);

    try {
      const resultado = await eliminarOrdenCompra(toDelete.id);

      const { resultados } = resultado;

      const totalEliminados =
        resultados.ordenesCompra +
        resultados.detallesOrdenCompra +
        resultados.cuentasPorPagar +
        resultados.pagos +
        resultados.movimientosAlmacen +
        resultados.detallesMovAlmacen +
        resultados.kardexEliminados +
        resultados.asientosContables +
        resultados.percepciones +
        resultados.datosAdicionales +
        resultados.ordenesCompraHijas;

      const registrosEliminados = [];
      const saldosRegenerados = [];
      const otrosRegistros = [];

      if (resultados.ordenesCompra > 0) {
        registrosEliminados.push(`✅ Orden de Compra: ${resultados.ordenesCompra} eliminada`);
      }
      if (resultados.detallesOrdenCompra > 0) {
        registrosEliminados.push(`📋 Detalles Orden Compra: ${resultados.detallesOrdenCompra} eliminados`);
      }
      if (resultados.cuentasPorPagar > 0) {
        registrosEliminados.push(`🏦 Cuenta por Pagar: ${resultados.cuentasPorPagar} eliminada`);
      }
      if (resultados.pagos > 0) {
        registrosEliminados.push(`💰 Pagos: ${resultados.pagos} eliminados`);
      }
      if (resultados.asientosContables > 0) {
        registrosEliminados.push(`📒 Asientos Contables: ${resultados.asientosContables} eliminados`);
      }
      if (resultados.percepciones > 0) {
        registrosEliminados.push(`📊 Percepciones: ${resultados.percepciones} eliminadas`);
      }
      if (resultados.movimientosAlmacen > 0) {
        registrosEliminados.push(`📦 Movimiento Almacén: ${resultados.movimientosAlmacen} eliminado`);
      }
      if (resultados.detallesMovAlmacen > 0) {
        registrosEliminados.push(`📝 Detalles Mov. Almacén: ${resultados.detallesMovAlmacen} eliminados`);
      }
      if (resultados.kardexEliminados > 0) {
        registrosEliminados.push(`📊 Kardex: ${resultados.kardexEliminados} eliminados`);
      }
      if (resultados.datosAdicionales > 0) {
        registrosEliminados.push(`📄 Datos Adicionales: ${resultados.datosAdicionales} eliminados`);
      }
      if (resultados.ordenesCompraHijas > 0) {
        registrosEliminados.push(`🔗 Órdenes Compra Hijas: ${resultados.ordenesCompraHijas} eliminadas`);
      }

      if (resultados.repuestosContratistas > 0) {
        otrosRegistros.push(`🔧 Repuestos Contratistas: ${resultados.repuestosContratistas} desvinculados`);
      }

      if (resultados.saldosDetRegenerados > 0) {
        saldosRegenerados.push(`🔄 Saldos detallados: ${resultados.saldosDetRegenerados} recalculados`);
      }
      if (resultados.saldosGenRegenerados > 0) {
        saldosRegenerados.push(`🔄 Saldos generales: ${resultados.saldosGenRegenerados} recalculados`);
      }

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

      toast.current.show({
        severity: "success",
        summary: "✅ Eliminación Completa Exitosa",
        detail: mensajeCompleto,
        life: 12000,
      });

      cargarDatos();
    } catch (error) {
      const mensajeError = error.response?.data?.error || error.message || "Error desconocido";

      toast.current.show({
        severity: "error",
        summary: "Error al Eliminar",
        detail: `No se pudo eliminar la Orden de Compra.\n\n${mensajeError}\n\nTodos los cambios fueron revertidos (transacción atómica).`,
        life: 6000,
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    const esEdicion = editing && editing.id;

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
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      let ordenResultado;

      if (esEdicion) {
        await actualizarOrdenCompra(editing.id, data);
        ordenResultado = await getOrdenCompraPorId(editing.id);
        setEditing(ordenResultado);

        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Orden actualizada. Puedes seguir agregando detalles.",
        });

        actualizarRegistro(editing.id, ordenResultado);
      } else {
        const resultado = await crearOrdenCompra(data);
        ordenResultado = await getOrdenCompraPorId(resultado.id);
        setEditing(ordenResultado);

        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Orden creada exitosamente. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        agregarRegistro(ordenResultado);
      }

    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    const { unidadSeleccionada } = useDashboardStore.getState();
    const unidadNegocioId = unidadSeleccionada?.id ? Number(unidadSeleccionada.id) : null;
    const objetoEditing = {
      empresaId: empresaSeleccionada,
      unidadNegocioId
    };
    setEditing(objetoEditing);
    setShowDialog(true);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setProveedorSeleccionado(null);
    setEstadoSeleccionado(null);
    setProductoSeleccionado(null);
    setRangoFechaFacturacion(null);
    setTipoDocumentoFinalIdSeleccionado(null);
    setTiposDocInternoAplicados([]);
    setTiposDocFinalAplicados([]);
    setTiposDocInternoTemp([]);
    setTiposDocFinalTemp([]);
    setCentroCostoSeleccionado(null);
  };



  // ✅ Abrir OverlayPanel de filtros avanzados
  const abrirFiltrosAvanzados = (event) => {
    setTiposDocInternoTemp([...tiposDocInternoAplicados]);
    setTiposDocFinalTemp([...tiposDocFinalAplicados]);
    opFiltrosAvanzados.current.toggle(event);
  };

  // ✅ Aplicar filtros avanzados
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

  // ✅ Limpiar filtros avanzados (solo temporales)
  const limpiarFiltrosAvanzados = () => {
    setTiposDocInternoTemp([]);
    setTiposDocFinalTemp([]);
  };

  // ✅ Cancelar y cerrar sin aplicar
  const cancelarFiltrosAvanzados = () => {
    setTiposDocInternoTemp([...tiposDocInternoAplicados]);
    setTiposDocFinalTemp([...tiposDocFinalAplicados]);
    opFiltrosAvanzados.current.hide();
  };


  const handleAsignarCentroCosto = async (centroCostoId, ordenesIds) => {
    try {
      const resultado = await asignarCentroCostoMasivo(centroCostoId, ordenesIds);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.message || `${resultado.count} órdenes actualizadas`,
        life: 3000,
      });

      await cargarDatos();
      setOrdenesSeleccionadas([]);
    } catch (error) {
      console.error("Error al asignar centro de costo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al asignar centro de costo",
        life: 3000,
      });
    }
  };

  const handleAprobar = async (id) => {
    setLoading(true);
    try {
      const ordenAprobada = await aprobarOrdenCompra(id);

      actualizarRegistro(id, ordenAprobada);

      toast.current.show({
        severity: "success",
        summary: "Orden Aprobada",
        detail: "La orden se aprobó exitosamente.",
        life: 3000,
      });

      setEditing(ordenAprobada);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "No se pudo aprobar la orden.";
      toast.current.show({
        severity: "error",
        summary: "Error al Aprobar",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };


  const handleAnular = async (id) => {
    setLoading(true);
    try {
      await anularOrdenCompra(id);

      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenActualizada = await getOrdenCompraPorId(id);

      actualizarRegistro(id, ordenActualizada);

      toast.current.show({
        severity: "success",
        summary: "Orden Anulada",
        detail: "La orden se anuló exitosamente.",
        life: 3000,
      });

      setShowDialog(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo anular.";
      toast.current.show({
        severity: "error",
        summary: "Error al Anular",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };


  const handleReactivar = async (ordenCompraId) => {
    if (!permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para reactivar órdenes de compra.",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de reactivar esta orden de compra?\n\n" +
        "• Si tiene movimiento de almacén, será ELIMINADO completamente y los saldos recalculados.\n" +
        "• Si tiene Cuenta por Pagar sin pagos, será ELIMINADA.\n" +
        "• Si tiene Asientos Contables, serán ELIMINADOS.\n\n" +
        "Esta operación NO se puede deshacer.",
      header: "Confirmar Reactivación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-warning",
      acceptLabel: "Sí, reactivar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          const { reactivarDocumentoOrdenCompra } = await import("../api/ordenCompra");
          const resultado = await reactivarDocumentoOrdenCompra(ordenCompraId);

          // Construir mensaje detallado
          let mensajeDetalle = "Orden de Compra reactivada exitosamente:\n\n";

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

          // Cuenta por Pagar
          if (resultado.cuentaPorPagar?.eliminada) {
            mensajeDetalle += `✅ Cuenta por Pagar ELIMINADA:\n`;
            mensajeDetalle += `   • ID: ${resultado.cuentaPorPagar.cxpId}\n`;
            mensajeDetalle += `   • Monto: S/ ${Number(resultado.cuentaPorPagar.montoTotal).toFixed(2)}\n\n`;
          }

          // Asientos Contables
          if (resultado.asientosContables?.eliminados > 0) {
            mensajeDetalle += `✅ Asientos Contables ELIMINADOS: ${resultado.asientosContables.eliminados}\n\n`;
          }

          mensajeDetalle += "La orden volvió a estado PENDIENTE y puede ser editada.";

          toast.current.show({
            severity: "success",
            summary: "Orden de Compra Reactivada",
            detail: mensajeDetalle,
            life: 8000,
          });

          actualizarRegistro(ordenCompraId, resultado.ordenCompra);

          setShowDialog(false);
          setEditing(null);
        } catch (err) {
          console.error("Error al reactivar orden de compra:", err);
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "No se pudo reactivar la orden de compra.";
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

  const handleIrAlOrigen = async (requerimientoId) => {
    try {
      const { getRequerimientoCompraPorId } =
        await import("../api/requerimientoCompra");
      const requerimientoCompleto =
        await getRequerimientoCompraPorId(requerimientoId);

      setRequerimientoOrigen(requerimientoCompleto);
      setShowRequerimientoDialog(true);
    } catch (error) {
      console.error("Error al cargar requerimiento origen:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el requerimiento origen",
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

  const handleGenerarDesdeRequerimiento = async (requerimientoId) => {
    setLoading(true);
    try {
      const resultado = await generarOrdenDesdeRequerimiento(requerimientoId);
      toast.current.show({
        severity: "success",
        summary: "Orden Generada",
        detail: `Orden generada exitosamente desde requerimiento.`,
        life: 5000,
      });
      cargarDatos();

      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenCompleta = await getOrdenCompraPorId(resultado.id);
      setEditing(ordenCompleta);
      setShowDialog(true);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo generar la orden.",
      });
    }
    setLoading(false);
  };

  const handleGenerarKardex = async (id) => {
    try {
      const ordenActual = items.find((item) => Number(item.id) === Number(id));

      if (!ordenActual) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró la orden de compra",
        });
        return;
      }

      // ✅ VALIDAR ESTADOS PERMITIDOS
      const estadoId = Number(ordenActual.estadoId);
      const estadosPermitidos = [39, 112, 113]; // APROBADO, PARTICIONADA, FACTURADA

      if (!estadosPermitidos.includes(estadoId)) {
        const mensajes = {
          38: "La orden debe estar APROBADA para generar kardex",
          40: "No se puede generar kardex de una orden ANULADA",
        };

        toast.current.show({
          severity: "warn",
          summary: "Acción no permitida",
          detail: mensajes[estadoId] || "Estado no válido para generar kardex",
          life: 5000,
        });
        return;
      }

      // Guardar orden actual para el diálogo
      setKardexDocumentoActual(ordenActual);

      if (ordenActual.movIngresoAlmacenId) {
        // Ya tiene kardex - Mostrar confirmación de regeneración
        confirmDialog({
          message: "¿Desea regenerar el kardex con los datos actuales de la orden?\n\nEsto actualizará el movimiento de almacén y recalculará los saldos.",
          header: "Regenerar Kardex",
          icon: "pi pi-exclamation-triangle",
          acceptLabel: "Sí, regenerar",
          rejectLabel: "Cancelar",
          acceptClassName: "p-button-warning",
          style: { width: '450px' },
          accept: async () => {
            await handleProcesarRegeneracionKardex(ordenActual.id);
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

  const handleGenerarCxP = async (id) => {
    try {
      const ordenActual = items.find((item) => Number(item.id) === Number(id));

      if (!ordenActual) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró la orden de compra",
        });
        return;
      }

      // ✅ VALIDAR ESTADOS PERMITIDOS (>= APROBADA)
      const estadoId = Number(ordenActual.estadoId);

      if (estadoId < 39) {
        toast.current.show({
          severity: "warn",
          summary: "Acción no permitida",
          detail: "La orden debe estar APROBADA para generar la Cuenta por Pagar",
          life: 5000,
        });
        return;
      }

      if (estadoId === 40) {
        toast.current.show({
          severity: "warn",
          summary: "Acción no permitida",
          detail: "No se puede generar CxP de una orden ANULADA",
          life: 5000,
        });
        return;
      }

      // ✅ VALIDAR QUE NO ESTÉ YA FACTURADA
      if (ordenActual.facturado) {
        toast.current.show({
          severity: "warn",
          summary: "Acción no permitida",
          detail: "Esta orden ya tiene una Cuenta por Pagar generada",
          life: 5000,
        });
        return;
      }


      // Mostrar confirmación
      confirmDialog({
        message: "¿Está seguro de generar la Cuenta por Pagar?\n\nEsto creará la deuda con el proveedor y cambiará el estado de la orden a FACTURADA.",
        header: "Confirmar Generación de CxP",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Sí, generar",
        rejectLabel: "Cancelar",
        acceptClassName: "p-button-success",
        accept: async () => {
          setLoading(true);
          try {
            const { generarCuentaPorPagar } = await import("../api/ordenCompra");
            const resultado = await generarCuentaPorPagar(id);

            // Validar que la respuesta tenga la estructura esperada
            if (!resultado || !resultado.cuentaPorPagar) {
              console.error("Estructura de resultado:", resultado);
              throw new Error("Respuesta inválida del servidor al generar CxP");
            }

            toast.current.show({
              severity: "success",
              summary: "Cuenta por Pagar Generada",
              detail: resultado.mensaje || `CxP generada exitosamente. Monto: ${Number(resultado.cuentaPorPagar.montoTotal).toFixed(2)}`,
              life: 5000,
            });

            cargarDatos();
            setShowDialog(false);
          } catch (err) {
            console.error("Error al generar CxP:", err);
            console.error("Error completo:", err.response?.data); // ⭐ LOG ADICIONAL
            const errorMsg =
              err.response?.data?.mensaje ||
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "No se pudo generar la Cuenta por Pagar.";
            toast.current.show({
              severity: "error",
              summary: "Error al Generar CxP",
              detail: errorMsg,
              life: 5000,
            });
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (error) {
      console.error("Error en handleGenerarCxP:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar la solicitud",
      });
    }
  };

  const handleProcesarRegeneracionKardex = async (ordenId) => {
    try {
      setLoading(true);
      // Regenerar kardex (backend usa datos actuales de la OrdenCompra)
      const resultado = await regenerarKardexOrdenCompra(ordenId);
      const movimientoId = resultado?.movimientoId;
      toast.current.show({
        severity: "success",
        summary: "Kardex Regenerado Exitosamente",
        detail: `Movimiento de almacén actualizado correctamente.`,
        life: 5000,
      });
      // Limpiar estado
      setKardexDocumentoActual(null);
      // Recargar datos de la OrdenCompra actual en el formulario
      if (ordenId) {
        const ordenActualizada = await getOrdenCompraPorId(ordenId);
        setEditing(ordenActualizada);
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

  const handleProcesarGeneracionKardex = async (datosKardex) => {
    try {
      setLoading(true);

      const ordenId = kardexDocumentoActual.id;
      const esRegeneracion = Boolean(kardexDocumentoActual.movIngresoAlmacenId);

      let movimientoId = null;

      if (esRegeneracion) {
        // Regenerar kardex
        const resultado = await regenerarKardexOrdenCompra(ordenId);
        movimientoId = resultado?.movimientoId || kardexDocumentoActual.movIngresoAlmacenId;
      } else {
        // Generar movimiento por primera vez
        const resultado = await generarMovimientoAlmacen(ordenId, datosKardex);
        movimientoId = resultado?.movimientoId;
      }

      toast.current.show({
        severity: "success",
        summary: esRegeneracion ? "Kardex Regenerado" : "Kardex Generado",
        detail: esRegeneracion
          ? "Movimiento actualizado correctamente con los datos actuales de la orden"
          : `Movimiento de almacén creado correctamente. ID: ${movimientoId}`,
        life: 5000,
      });

      // Cerrar diálogo de kardex
      setShowKardexDialog(false);
      setKardexDocumentoActual(null);

      // Recargar datos de la OrdenCompra actual en el formulario
      if (ordenId) {
        const ordenActualizada = await getOrdenCompraPorId(ordenId);
        setEditing(ordenActualizada);
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
  const handleExportarExcel = async () => {
    try {
      setLoading(true);
      const response = await getOrdenesCompra();
      const blob = await generarOrdenesCompraExcel(response);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OrdenesCompra_${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const empresaNombre = (rowData) => {
    return rowData.empresa?.razonSocial || "";
  };

  const proveedorNombre = (rowData) => {
    return rowData.proveedor?.razonSocial || "";
  };

  const requerimientoTemplate = (rowData) => {
    return (
      rowData.requerimientoCompra?.numeroDocumento ||
      rowData.requerimientoCompra?.nroDocumento ||
      ""
    );
  };

  // Template para Centro de Costo con tags profesionales
  const centroCostoTemplate = (rowData) => {
    const centroCosto = rowData.centroCosto;

    if (!centroCosto) {
      return <span style={{ color: "#999" }}>-</span>;
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
        {/* Categoría */}
        {centroCosto.categoria && (
          <Tag
            value={centroCosto.categoria.nombre}
            severity="info"
            style={{
              fontWeight: "bold",
              fontSize: "0.7rem",
              backgroundColor: "#2196F3",
              color: "#FFFFFF"
            }}
          />
        )}
        {/* ParentCentroID (Subcategoría) */}
        {centroCosto.ParentCentroID && (
          <Tag
            value={centroCosto.ParentCentroID}
            severity="warning"
            style={{
              fontWeight: "500",
              fontSize: "0.7rem",
              backgroundColor: "#FF9800",
              color: "#FFFFFF"
            }}
          />
        )}
        {/* Descripción */}
        <Tag
          value={centroCosto.Descripcion || centroCosto.Nombre}
          severity="success"
          style={{
            fontSize: "0.7rem",
            backgroundColor: "#4CAF50",
            color: "#FFFFFF"
          }}
        />
      </div>
    );
  };

  // Template para Tipo Documento Interno
  const tipoDocumentoInternoTemplate = (rowData) => {
    return rowData.tipoDocumento?.codigo || "-";
  };

  // Template para Tipo Documento Final
  const tipoDocumentoFinalTemplate = (rowData) => {
    return rowData.tipoDocumentoFinal?.codigo || "-";
  };

  // Template para Número Documento Final
  const numeroDocumentoFinalTemplate = (rowData) => {
    return rowData.numeroDocumentoFinal || "-";
  };

  // Template para Fecha Facturación
  const fechaFacturacionTemplate = (rowData) => {
    return formatearFecha(rowData.fechaFacturacion, "-");
  };

  // Template para Total con color de fondo de moneda
  const totalTemplate = (rowData) => {
    const simbolo = rowData.moneda?.simbolo || "";
    const total = formatearNumero(rowData.total || 0, 2);
    const colorFondo = rowData.moneda?.colorFondo || "#ffffff";

    return (
      <div
        style={{
          backgroundColor: colorFondo,
          padding: "4px 8px",
          borderRadius: "4px",
          fontWeight: "bold",
          textAlign: "right",
        }}
      >
        {simbolo} {total}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estado?.descripcion || "";
    let severity = "info";

    if (estado.includes("PENDIENTE")) severity = "warning";
    if (estado.includes("APROBAD")) severity = "success";
    if (estado.includes("ANULAD")) severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const fechaTemplate = (rowData, field) => {
    return formatearFecha(rowData[field], "");
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

  const igvTemplate = (rowData) => {
    return rowData.esExoneradoAlIGV ? (
      <Tag value="EXONERADO" severity="danger" />
    ) : (
      <Tag value="AFECTO" severity="success" />
    );
  };

  // ✅ Calcular totales por tipo de documento y moneda
  const calcularTotalesPorTipoYMoneda = () => {
    const totalesPorTipo = {};
    let totalGeneralSoles = 0;
    let totalGeneralDolares = 0;
    let simboloSoles = "S/";
    let simboloDolares = "$";
    let colorFondoSoles = "#FFE5B4";
    let colorFondoDolares = "#C8E6C9";

    ordenesFiltradas.forEach((orden) => {
      const total = Number(orden.total) || 0;
      const codigo = orden.tipoDocumentoFinal?.codigo || orden.tipoDocumento?.codigo || "OTROS";
      const monedaId = Number(orden.monedaId);

      // Inicializar tipo si no existe
      if (!totalesPorTipo[codigo]) {
        totalesPorTipo[codigo] = { soles: 0, dolares: 0 };
      }

      // Acumular por tipo y moneda
      if (monedaId === 1) {
        totalesPorTipo[codigo].soles += total;
        totalGeneralSoles += total;
        if (orden.moneda?.simbolo) simboloSoles = orden.moneda.simbolo;
        if (orden.moneda?.colorFondo) colorFondoSoles = orden.moneda.colorFondo;
      } else if (monedaId === 2) {
        totalesPorTipo[codigo].dolares += total;
        totalGeneralDolares += total;
        if (orden.moneda?.simbolo) simboloDolares = orden.moneda.simbolo;
        if (orden.moneda?.colorFondo) colorFondoDolares = orden.moneda.colorFondo;
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
  const actionBody = (rowData) => (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "4px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        aria-label={permisos.puedeEditar ? "Editar" : "Ver"}
        style={{ padding: "0.25rem" }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        aria-label="Eliminar"
        tooltip="Eliminar"
        disabled={!permisos.puedeEliminar}
        style={{ padding: "0.25rem" }}
      />
    </div>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar esta orden de compra?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={ordenesFiltradas}
        selection={ordenesSeleccionadas}
        onSelectionChange={(e) => setOrdenesSeleccionadas(e.value)}
        loading={loading}
        dataKey="id"
        paginator
        rows={25}
        rowsPerPageOptions={[25, 50, 100, 150]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
        size="small"
        showGridlines
        stripedRows
        sortField="id"
        sortOrder={-1}
        footer={footerTemplate}  // ✅ AGREGAR FOOTER
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
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
              <div style={{ flex: 2 }}>
                <h2>Compras y Gastos</h2>
              </div>
              <div style={{ flex: 2 }}>
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
                  onClick={handleAdd}
                  disabled={!permisos.puedeCrear || !empresaIdSelector}
                  tooltip={
                    !empresaIdSelector
                      ? "Seleccione una empresa primero"
                      : !permisos.puedeCrear
                        ? "No tiene permisos para crear"
                        : "Nueva Orden de Compra"
                  }
                  tooltipOptions={{ position: "top" }}
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail:
                        "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                  tooltipOptions={{ position: "bottom" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  icon="pi pi-search"
                  label="Consultar Stock"
                  onClick={() => setShowConsultaStock(true)}
                  className="p-button-info"
                  tooltip="Consultar stock de productos"
                  tooltipOptions={{ position: "bottom" }}
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
                  label="Exportar Excel"
                  icon="pi pi-file-excel"
                  className="p-button-success"
                  onClick={handleExportarExcel}
                  disabled={loading}
                  tooltip="Exportar todas las Compras a Excel"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                {/* Filtro de Unidad de Negocio - Compacto */}
                <UnidadNegocioFilter />
              </div>
              {/* Filtro Tipo Libro */}
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>
                  Tipo Libro
                </label>
                <FiltroTipoLibroButton
                  value={filtroTipoLibro}
                  onChange={setFiltroTipoLibro}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="proveedorFiltro" style={{ fontWeight: "bold" }}>
                  Proveedor
                </label>
                <Dropdown
                  id="proveedorFiltro"
                  value={proveedorSeleccionado}
                  options={proveedoresUnicos.map((p) => ({
                    label: p.razonSocial,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setProveedorSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="productoFiltro" style={{ fontWeight: "bold" }}>
                  Producto
                </label>
                <Dropdown
                  id="productoFiltro"
                  value={productoSeleccionado}
                  options={productosUnicos.map((p) => ({
                    label: p.descripcionArmada,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setProductoSeleccionado(e.value)}
                  placeholder="Todos los productos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Filtros Avanzados:
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
              <div style={{ flex: 1 }}>
                <label htmlFor="busquedaDocumento" style={{ fontWeight: "bold" }}>
                  N° Dcmto / #ID
                </label>
                <InputText
                  id="busquedaDocumento"
                  value={busquedaDocumento}
                  onChange={(e) => setBusquedaDocumento(e.target.value)}
                  placeholder="N° Doc (#ID para buscar por ID)..."
                  style={{ width: "100%" }}
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Rango Fecha Facturación:
                </label>
                <Calendar
                  value={rangoFechaFacturacion}
                  onChange={(e) => setRangoFechaFacturacion(e.value)}
                  selectionMode="range"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione rango"
                  showIcon
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
                  Estado
                </label>
                <Dropdown
                  id="estadoFiltro"
                  value={estadoSeleccionado}
                  options={estadosUnicos}
                  onChange={(e) => setEstadoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Asignar Centro Costo"
                  icon="pi pi-tag"
                  className="p-button-help"
                  onClick={() => setShowAsignarCentroCostoDialog(true)}
                  disabled={loading || ordenesSeleccionadas.length === 0}
                  tooltip={
                    ordenesSeleccionadas.length === 0
                      ? "Seleccione órdenes primero"
                      : `Asignar centro de costo a ${ordenesSeleccionadas.length} órdenes`
                  }
                  tooltipOptions={{ position: "bottom" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="centroCostoFiltro" style={{ fontWeight: "bold" }}>
                  Centro de Costo
                </label>
                <Dropdown
                  id="centroCostoFiltro"
                  value={centroCostoSeleccionado}
                  options={centrosCosto.map((c) => ({
                    label: `${c.categoria?.nombre || ''} - ${c.ParentCentroID || ''} - ${c.Descripcion || c.Nombre}`.trim(),
                    value: Number(c.id),
                  }))}
                  onChange={(e) => setCentroCostoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  disabled={loading}
                  style={{ width: "100%" }}

                />
              </div>
            </div>
          </div>
        }
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        {/* Tipo Documento Interno */}
        <Column
          field="tipoDocumento.codigo"
          header="Tipo Doc Interno"
          body={tipoDocumentoInternoTemplate}
          style={{ width: 110, textAlign: "center" }}
          sortable
        />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />

        <Column
          field="proveedorId"
          header="Proveedor"
          body={proveedorNombre}
          sortable
        />

        {/* Tipo Documento Final */}
        <Column
          field="tipoDocumentoFinal.codigo"
          header="Tipo Doc Final"
          body={tipoDocumentoFinalTemplate}
          style={{ width: 100, textAlign: "center" }}
          sortable
        />

        {/* Número Documento Final */}
        <Column
          field="numeroDocumentoFinal"
          header="N° Doc Final"
          body={numeroDocumentoFinalTemplate}
          style={{ width: 140, textAlign: "center" }}
          sortable
        />

        {/* Fecha Facturación */}
        <Column
          field="fechaFacturacion"
          header="Fecha Fact."
          body={fechaFacturacionTemplate}
          style={{ width: 110, textAlign: "center" }}
          sortable
        />

        {/* Total con color de fondo */}
        <Column
          field="total"
          header="Total"
          body={totalTemplate}
          style={{ width: 140 }}
          sortable
        />

        <Column
          field="monedaId"
          header="Moneda"
          body={monedaTemplate}
          style={{ width: 80, textAlign: "center" }}
          sortable
        />

        <Column
          field="tipoCambio"
          header="T/C"
          body={tipoCambioTemplate}
          style={{ width: 90, textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          sortable
        />

        <Column
          field="estadoId"
          header="Estado"
          body={estadoTemplate}
          style={{ width: 150, textAlign: "center" }}
          sortable
        />

        <Column
          field="esExoneradoAlIGV"
          header="IGV"
          body={igvTemplate}
          style={{ width: 110, textAlign: "center" }}
          sortable
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

        {/* Centro de Costo */}
        <Column
          field="centroCostoId"
          header="Centro de Costo"
          body={centroCostoTemplate}
          sortable
          style={{ minWidth: "300px" }}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 100, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing?.id ? "Editar Orden de Compra" : "Nueva Orden de Compra"
        }
        visible={showDialog}
        style={{ width: "1300px" }}
        onHide={() => {
          setShowDialog(false);
        }}
        modal
        maximizable
        maximized={true}
      >
        <OrdenCompraForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          proveedores={proveedores}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          tiposDocumento={tiposDocumento}
          seriesDoc={seriesDoc}
          estadosOrden={estadosDoc}
          onProveedorCreado={recargarProveedores}
          requerimientos={requerimientos}
          monedas={monedas}
          centrosCosto={centrosCosto}
          unidadesNegocio={unidadesNegocio}
          periodosContables={periodosContables}
          motivosNCND={motivosNCND}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onAprobar={handleAprobar}
          onAnular={handleAnular}
          onReactivar={handleReactivar}
          onGenerarKardex={handleGenerarKardex}
          onGenerarCxP={handleGenerarCxP}
          onGenerarDesdeRequerimiento={handleGenerarDesdeRequerimiento}
          onIrAlOrigen={handleIrAlOrigen}
          onIrAMovimientoAlmacen={handleIrAMovimientoAlmacen}
          loading={loading}
          toast={toast}
          permisos={permisos}
          readOnly={!!editing && !!editing.id && !permisos.puedeEditar}
          onRecargarRegistro={recargarOrdenActual}
        />
      </Dialog>

      <Dialog
        header="Requerimiento de Compra Origen"
        visible={showRequerimientoDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowRequerimientoDialog(false)}
        modal
        maximizable
        maximized={true}
      >
        <RequerimientoCompraForm
          isEdit={true}
          defaultValues={requerimientoOrigen || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          proveedores={proveedores}
          tiposProducto={tiposProducto}
          tiposEstadoProducto={tiposEstadoProducto}
          destinosProducto={destinosProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          monedas={monedas}
          onSubmit={() => { }}
          onCancel={() => setShowRequerimientoDialog(false)}
          onAprobar={() => { }}
          onAnular={() => { }}
          onAutorizarCompra={() => { }}
          loading={false}
          toast={toast}
          permisos={{ puedeVer: true, puedeEditar: false }}
          readOnly={true}
        />
      </Dialog>

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
          entidadesComerciales={proveedores}
          conceptosMovAlmacen={conceptosMovAlmacen}
          productos={productos}
          personalOptions={personalOptions}
          estadosMercaderia={estadosMercaderia}
          estadosCalidad={estadosCalidad}
          ubicacionesFisicas={ubicacionesFisicas}
          empresaFija={empresaSeleccionada}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
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

      {/* Diálogo de generación de Kardex */}
      {kardexDocumentoActual && (
        <GenerarKardexDialog
          visible={showKardexDialog}
          onHide={() => {
            setShowKardexDialog(false);
            setKardexDocumentoActual(null);
          }}
          tipoDocumento="ordenCompra"
          documentoId={kardexDocumentoActual.id}
          numeroDocumento={kardexDocumentoActual.numeroDocumento}
          serieDocumento={kardexDocumentoActual.serieDoc?.serie}
          entidadComercial={kardexDocumentoActual.proveedor?.razonSocial}
          entidadComercialId={kardexDocumentoActual.proveedorId}
          totalItems={kardexDocumentoActual.detalles?.length || 0}
          empresaId={kardexDocumentoActual.empresaId}
          empresaEntidadComercialId={kardexDocumentoActual.empresa?.entidadComercialId}
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

      <AsignarCentroCostoMasivo
        visible={showAsignarCentroCostoDialog}
        onHide={() => setShowAsignarCentroCostoDialog(false)}
        registrosSeleccionados={ordenesSeleccionadas.map(o => o.id)}
        onAsignar={handleAsignarCentroCosto}
        nombreModulo="órdenes de compra"
      />
    </div>
  );
}
