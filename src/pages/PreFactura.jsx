// src/pages/PreFactura.jsx
// Pantalla CRUD profesional para PreFactura. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
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
  getAllPreFactura,
  deletePreFactura,
  crearPreFactura,
  actualizarPreFactura,
} from "../api/preFactura";
import PreFacturaForm from "../components/preFactura/PreFacturaForm";
import CotizacionVentasForm from "../components/cotizacionVentas/CotizacionVentasForm"; // ⬅️ AGREGAR
import MovimientoAlmacenForm from "../components/movimientoAlmacen/MovimientoAlmacenForm"; // ⬅️ AGREGAR
import ContratoServicioForm from "../components/contratoServicio/ContratoServicioForm"; // ⬅️ AGREGAR
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
import { usePermissions } from "../hooks/usePermissions";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import ColorTag from "../components/shared/ColorTag";
import UnidadNegocioFilter from "../components/common/UnidadNegocioFilter";
import { useUnidadNegocioFilter } from "../hooks/useUnidadNegocioFilter";
/**
 * Componente PreFactura
 * Gestión CRUD de pre-facturas con patrón profesional ERP Megui
 */
const PreFactura = ({ ruta }) => {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
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
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [filtroParticionadas, setFiltroParticionadas] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPreFactura, setSelectedPreFactura] = useState(null);

  // Filtrado automático por Unidad de Negocio
  const { datosFiltrados: preFacturasFiltradas } = useUnidadNegocioFilter(preFacturas);
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
  const toast = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Extraer clientes únicos de las pre-facturas
  useEffect(() => {
    const clientesMap = new Map();
    preFacturas.forEach((preFactura) => {
      if (preFactura.clienteId && preFactura.cliente) {
        clientesMap.set(preFactura.clienteId, preFactura.cliente);
      }
    });
    const clientesArray = Array.from(clientesMap.values());
    setClientesUnicos(clientesArray);
  }, [preFacturas]);

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
      ] = await Promise.all([
        getAllPreFactura(),
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

      // Normalizar pre-facturas agregando estadoDoc manualmente
      const preFacturasNormalizadas = preFacturasData.map((pf) => ({
        ...pf,
        estadoDoc: estadosDocFiltrados.find(
          (e) => Number(e.id) === Number(pf.estadoId),
        ),
      }));
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
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

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

    // Filtro por estado
    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado),
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

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    clienteSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSeleccionado,
    filtroParticionadas,
    items,
  ]);
  const handleIrAPreFacturaOrigen = async (preFacturaOrigenId) => {
    // Guardar la PreFactura actual en el stack antes de navegar
    if (selectedPreFactura) {
      setNavigationStack(prev => [...prev, selectedPreFactura]);
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
        console.error("Error al buscar PreFactura Origen:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar la PreFactura Origen",
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
        detail: "No se encontró la PreFactura Origen",
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

  const abrirDialogoNuevo = async () => {
    try {
      // Crear objeto inicial
      const preFacturaInicial = {};

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
        setRefreshKey((prev) => prev + 1);
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

  const cerrarDialogo = () => {
    // Si hay una PreFactura en el stack de navegación, volver a ella
    if (navigationStack.length > 0) {
      const previousPreFactura = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1)); // Remover del stack
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

          cargarPreFacturas();
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
      accept: () => eliminarPreFactura(preFactura.id),
    });
  };

  const eliminarPreFactura = async (id) => {
    try {
      await deletePreFactura(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pre-factura eliminada correctamente",
      });
      cargarPreFacturas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la pre-factura",
      });
    }
  };

  const onRowClick = (event) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      abrirDialogoEdicion(event.data);
    }
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

  const igvTemplate = (rowData) => {
    return rowData.esExoneradoAlIGV ? (
      <Tag value="EXONERADO" severity="danger" />
    ) : (
      <Tag value="AFECTO" severity="success" />
    );
  };

  const montosTemplate = (rowData) => {
    const subtotal = (rowData.detalles || []).reduce((sum, det) => {
      const cantidad = Number(det.cantidad) || 0;
      const precio = Number(det.precioUnitario) || 0;
      return sum + cantidad * precio;
    }, 0);

    const porcentajeIGV = Number(rowData.porcentajeIGV) || 0;
    const igv = rowData.esExoneradoAlIGV ? 0 : subtotal * (porcentajeIGV / 100);
    const total = subtotal + igv;
    const simboloMoneda = rowData.moneda?.simbolo || "";

    return (
      <div style={{ textAlign: "right" }}>
        <Tag
          value={`${simboloMoneda} ${formatearNumero(total)}`}
          severity="info"
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
          }}
        />
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            confirmarEliminacion(rowData);
          }}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setClienteSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSeleccionado(null);
    setFiltroParticionadas(null);
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="card">
        <DataTable
          value={preFacturasFiltradas}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={50}
          rowsPerPageOptions={[50, 100, 200, 500]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pre-facturas"
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
          emptyMessage="No se encontraron pre-facturas"
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
                  <h2>Pre-Facturas</h2>
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="empresaFiltro" style={{ fontWeight: "bold" }}>
                    Empresa*
                  </label>
                  <Dropdown
                    id="empresaFiltro"
                    value={empresaSeleccionada}
                    options={empresas.map((e) => ({
                      label: e.razonSocial,
                      value: Number(e.id),
                    }))}
                    onChange={(e) => setEmpresaSeleccionada(e.value)}
                    placeholder="Seleccionar empresa para filtrar"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    onClick={abrirDialogoNuevo}
                    className="p-button-primary"
                    disabled={
                      !permisos.puedeCrear || loading || !empresaSeleccionada
                    }
                    tooltip={
                      !permisos.puedeCrear
                        ? "No tiene permisos para crear"
                        : !empresaSeleccionada
                          ? "Seleccione una empresa primero"
                          : "Nueva Pre-Factura"
                    }
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
                <div style={{ flex: 2 }}>
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
          <Column field="id" header="ID" style={{ width: 80 }} sortable />
          <Column field="empresaId" header="Empresa" body={empresaTemplate} />
          <Column
            field="numeroDocumento"
            header="N° Documento"
            style={{ width: 140, textAlign: "center" }}
            sortable
          />
          <Column
            field="fechaDocumento"
            header="Fecha Documento"
            body={fechaDocumentoTemplate}
            style={{ width: 110, textAlign: "center" }}
            sortable
          />
          <Column
            field="clienteId"
            header="Cliente"
            body={clienteTemplate}
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
            header="Montos"
            body={montosTemplate}
            style={{ width: 120, textAlign: "right" }}
            bodyStyle={{ textAlign: "right" }}
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
            style={{ width: 120, textAlign: "center" }}
          />
          <Column
            field="esExoneradoAlIGV"
            header="IGV"
            body={igvTemplate}
            style={{ width: 110, textAlign: "center" }}
            sortable
          />
          <Column
            body={accionesTemplate}
            header="Acciones"
            style={{ width: 120, textAlign: "center" }}
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
          incoterms={incoterms}
          tiposContenedor={tiposContenedor}
          empresaFija={empresaSeleccionada}
          onIrAMovimientoAlmacen={handleIrAMovimientoAlmacen}
          onIrACotizacionVenta={handleIrACotizacionVenta}
          onIrAContratoServicio={handleIrAContratoServicio}
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
          onSubmit={() => {}}
          onCancel={() => setShowCotizacionDialog(false)}
          onAprobar={() => {}}
          onAnular={() => {}}
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
          onSubmit={() => {}}
          onCancel={() => setShowMovimientoAlmacenDialog(false)}
          onCerrar={() => {}}
          onAnular={() => {}}
          onGenerarKardex={() => {}}
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
          onSubmit={() => {}}
          onCancel={() => setShowContratoServicioDialog(false)}
          onAprobar={() => {}}
          onAnular={() => {}}
          loading={false}
          readOnly={true}
          toast={toast}
          permisos={{ puedeEditar: false, puedeEliminar: false }}
        />
      </Dialog>
    </div>
  );
};

export default PreFactura;
