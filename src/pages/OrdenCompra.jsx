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
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
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
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import UnidadNegocioFilter from "../components/common/UnidadNegocioFilter";
import { useUnidadNegocioFilter } from "../hooks/useUnidadNegocioFilter";
import GenerarKardexDialog from "../components/common/kardex/GenerarKardexDialog";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { getMotivoNotaCreditoDebitoActivos } from "../api/ventas/motivoNotaCreditoDebito";

export default function OrdenCompra({ ruta }) {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const toast = useRef(null);
  const [items, setItems] = useState([]);

  // Filtrado automático por Unidad de Negocio
  const { datosFiltrados: ordenesFiltradas } = useUnidadNegocioFilter(items);

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
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [kardexDocumentoActual, setKardexDocumentoActual] = useState(null);

  // ========================================
  // 🆕 CARGAR DATOS AL MONTAR EL COMPONENTE
  // ========================================
  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    let filtrados = ordenesFiltradas;

    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada),
      );
    }

    if (proveedorSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.proveedorId) === Number(proveedorSeleccionado),
      );
    }

    if (fechaInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaDocumento);
        const fechaIni = new Date(fechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaDoc >= fechaIni;
      });
    }

    if (fechaFin) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaDocumento);
        const fechaFinDia = new Date(fechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaDoc <= fechaFinDia;
      });
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado),
      );
    }

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    proveedorSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSeleccionado,
    ordenesFiltradas,
  ]);

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
      await eliminarOrdenCompra(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Orden de compra eliminada correctamente.",
      });
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo eliminar.",
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
      if (esEdicion) {
        await actualizarOrdenCompra(editing.id, data);

        const { getOrdenCompraPorId } = await import("../api/ordenCompra");
        const ordenActualizada = await getOrdenCompraPorId(editing.id);
        setEditing(ordenActualizada);

        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Orden actualizada. Puedes seguir agregando detalles.",
        });
      } else {
        const resultado = await crearOrdenCompra(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Orden creada exitosamente. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        const { getOrdenCompraPorId } = await import("../api/ordenCompra");
        const ordenCompleta = await getOrdenCompraPorId(resultado.id);
        setEditing(ordenCompleta);
      }

      cargarDatos();
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
    setEditing({ empresaId: empresaSeleccionada });
    setShowDialog(true);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setProveedorSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSeleccionado(null);
  };

  const handleAprobar = async (id) => {
    setLoading(true);
    try {
      const ordenAprobada = await aprobarOrdenCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Orden Aprobada",
        detail: "La orden se aprobó exitosamente.",
        life: 3000,
      });

      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenActualizada = await getOrdenCompraPorId(id);

      setEditing(ordenActualizada);

      cargarDatos();
    } catch (err) {
      console.error("Error al aprobar:", err);
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

      toast.current.show({
        severity: "success",
        summary: "Orden Anulada",
        detail: "La orden se anuló exitosamente.",
        life: 3000,
      });

      setShowDialog(false);
      cargarDatos();
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
        "¿Está seguro de reactivar esta orden de compra? " +
        "Si tiene movimiento de almacén, el kardex será eliminado y los saldos recalculados. " +
        "Si tiene Cuenta por Pagar sin pagos, será eliminada. " +
        "Los asientos contables asociados también serán eliminados.",
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

          // Mostrar resumen detallado de la reactivación
          const mensajeDetalle = `
            Orden de Compra reactivada exitosamente:
            - Kardex eliminados: ${resultado.kardexEliminados || 0}
            - Productos afectados: ${resultado.productosAfectados || 0}
            - Saldos detallados actualizados: ${resultado.saldosDetActualizados || 0}
            - Saldos generales actualizados: ${resultado.saldosGenActualizados || 0}
            ${resultado.cuentaPorPagarEliminada ? '- Cuenta por Pagar eliminada' : ''}
            ${resultado.asientosEliminados ? `- Asientos contables eliminados: ${resultado.asientosEliminados}` : ''}
            
            Ahora puede editar el documento.
          `;

          toast.current.show({
            severity: "success",
            summary: "Orden de Compra Reactivada",
            detail: mensajeDetalle,
            life: 5000,
          });

          cargarDatos();
          setShowDialog(false);
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

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoDoc?.descripcion || "";
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
        value={itemsFiltrados}
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
                <h2>Órdenes de Compra</h2>
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
                  onClick={() => {
                    setEditing(null);
                    setShowDialog(true);
                  }}
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
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
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
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
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
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
                  Desde
                </label>
                <Calendar
                  id="fechaInicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.value)}
                  placeholder="Fecha inicio"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaFin" style={{ fontWeight: "bold" }}>
                  Hasta
                </label>
                <Calendar
                  id="fechaFin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.value)}
                  placeholder="Fecha fin"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
                  Estado
                </label>
                <Dropdown
                  id="estadoFiltro"
                  value={estadoSeleccionado}
                  options={estadosDoc.map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEstadoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />
        <Column
          field="numeroDocumento"
          header="N° Documento"
          style={{ width: 140, textAlign: "center" }}
          sortable
        />
        <Column
          field="fechaDocumento"
          header="Fecha Documento"
          body={(rowData) => fechaTemplate(rowData, "fechaDocumento")}
          style={{ width: 110, textAlign: "center" }}
          sortable
        />
        <Column
          field="proveedorId"
          header="Proveedor"
          body={proveedorNombre}
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
        onHide={() => setShowDialog(false)}
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

    </div>
  );
}
