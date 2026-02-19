// src/pages/CotizacionVentas.jsx
// Pantalla CRUD profesional para CotizacionVentas. Cumple regla transversal ERP Megui:
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
  getAllCotizacionVentas,
  deleteCotizacionVentas,
  crearCotizacionVentas,
  actualizarCotizacionVentas,
  getCotizacionVentasPorId,
} from "../api/cotizacionVentas";
import CotizacionVentasForm from "../components/cotizacionVentas/CotizacionVentasForm";
import {
  getResponsiveFontSize,
  formatearFecha,
  formatearNumero,
  getSeverityColors,
} from "../utils/utils";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getTiposProducto } from "../api/tipoProducto";
import { getAllTipoEstadoProducto } from "../api/tipoEstadoProducto";
import { getAllDestinoProducto } from "../api/destinoProducto";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getCentrosCosto } from "../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getMonedas } from "../api/moneda";
import { getUnidadesNegocio } from "../api/unidadNegocio";
import { getIncoterms } from "../api/incoterm";
import { getPaises } from "../api/pais";
import { getPuertosPesca } from "../api/puertoPesca";
import { getBancos } from "../api/banco";
import { getAllFormaTransaccion } from "../api/formaTransaccion";
import { getAllModoDespachoRecepcion } from "../api/modoDespachoRecepcion";
import { getTiposContenedor } from "../api/tipoContenedor";
import UnidadNegocioFilter from "../components/common/UnidadNegocioFilter";
import { useUnidadNegocioFilter } from "../hooks/useUnidadNegocioFilter";
import { getDocRequeridaVentasActivos } from "../api/docRequeridaVentas";
import { usePermissions } from "../hooks/usePermissions";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import ColorTag from "../components/shared/ColorTag";

/**
 * Componente CotizacionVentas
 * Gestión CRUD de cotizaciones de ventas con patrón profesional ERP Megui
 */
const CotizacionVentas = ({ ruta }) => {
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
  const [agenteAduanas, setAgenteAduanas] = useState([]);
  const [operadoresLogisticos, setOperadoresLogisticos] = useState([]);
  const [navieras, setNavieras] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState([]);
  const [destinosProducto, setDestinosProducto] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [paises, setPaises] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [tiposContenedor, setTiposContenedor] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [formasTransaccion, setFormasTransaccion] = useState([]);
  const [modosDespacho, setModosDespacho] = useState([]);
  const [docRequeridaVentas, setDocRequeridaVentas] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useRef(null);

  // Filtrado automático por Unidad de Negocio
  const { datosFiltrados: cotizacionesFiltradas, unidadActiva } = useUnidadNegocioFilter(cotizaciones);

  useEffect(() => {
    cargarCotizaciones();
    cargarDatos();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await getAllCotizacionVentas();
      setCotizaciones(data);
    } catch (error) {
      console.error("Error detallado al cargar cotizaciones:", error);
      console.error("Response:", error.response);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al cargar cotizaciones: ${
          error.response?.data?.message || error.message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Extraer clientes únicos de las cotizaciones
  useEffect(() => {
    const clientesMap = new Map();
    cotizaciones.forEach((cotizacion) => {
      if (cotizacion.clienteId && cotizacion.cliente) {
        clientesMap.set(cotizacion.clienteId, cotizacion.cliente);
      }
    });
    const clientesArray = Array.from(clientesMap.values());
    setClientesUnicos(clientesArray);
  }, [cotizaciones]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        empresasData,
        tiposDocData,
        clientesData,
        tiposProductoData,
        tiposEstadoProductoData,
        destinosProductoData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        centrosCostoData,
        tiposMovimientoData,
        monedasData,
        unidadesNegocioData,
        incotermsData,
        paisesData,
        puertosData,
        tiposContenedorData,
        bancosData,
        formasTransaccionData,
        modosDespachoData,
        docRequeridaVentasData,
      ] = await Promise.all([
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getAllDestinoProducto(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getMonedas(),
        getUnidadesNegocio({ activo: true }),
        getIncoterms(),
        getPaises(),
        getPuertosPesca(),
        getTiposContenedor(),
        getBancos(),
        getAllFormaTransaccion(),
        getAllModoDespachoRecepcion(),
        getDocRequeridaVentasActivos(),
      ]);
      setEmpresas(empresasData);
      setTiposDocumento(tiposDocData);
      setClientes(clientesData);

      // Filtrar entidades comerciales por tipo
      const agenteAduanasData = clientesData.filter(
        (e) => Number(e.tipoEntidadId) === 12,
      );
      const operadoresLogisticosData = clientesData.filter(
        (e) => Number(e.tipoEntidadId) === 13,
      );
      const navierasData = clientesData.filter(
        (e) => Number(e.tipoEntidadId) === 14,
      );
      setAgenteAduanas(agenteAduanasData);
      setOperadoresLogisticos(operadoresLogisticosData);
      setNavieras(navierasData);
      setTiposProducto(tiposProductoData);
      setTiposEstadoProducto(tiposEstadoProductoData);
      setDestinosProducto(destinosProductoData);
      setFormasPago(formasPagoData);
      setProductos(productosData);
      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);
      // Filtrar estados de documentos (tipoProvieneDeId = 13 para COTIZACION VENTA)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 13 && !e.cesado,
      );
      setEstadosDoc(estadosDocFiltrados);
      // Normalizar cotizaciones agregando estadoDoc manualmente
      const cotizacionesNormalizadas = cotizaciones.map((req) => ({
        ...req,
        estadoDoc: estadosDocFiltrados.find(
          (e) => Number(e.id) === Number(req.estadoId),
        ),
      }));
      setItems(cotizacionesNormalizadas);
      setCentrosCosto(centrosCostoData);
      setTiposMovimiento(tiposMovimientoData);
      setMonedas(monedasData);
      if (unidadesNegocioData && Array.isArray(unidadesNegocioData)) {
        setUnidadesNegocio(
          unidadesNegocioData.map((un) => ({ ...un, id: Number(un.id) })),
        );
      }
      setIncoterms(incotermsData);
      setPaises(paisesData);
      setPuertos(puertosData);
      setTiposContenedor(tiposContenedorData);
      setBancos(bancosData);
      setFormasTransaccion(formasTransaccionData);
      setModosDespacho(modosDespachoData);
      setDocRequeridaVentas(docRequeridaVentasData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
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

    // Filtro por proveedor
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

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    clienteSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSeleccionado,
    items,
  ]);

  const abrirDialogoNuevo = async () => {
    try {
      // Obtener autorizaVentaId desde ParametroAprobador
      let autorizaVentaId = null;
      if (empresaSeleccionada) {
        const { getParametrosAprobadorPorModulo } =
          await import("../api/parametroAprobador");
        const parametros = await getParametrosAprobadorPorModulo(
          empresaSeleccionada,
          5,
        ); // 5 = VENTAS

        // Filtrar por cesado=false y tomar el primero
        const parametroActivo = parametros.find((p) => p.cesado === false);
        if (parametroActivo) {
          autorizaVentaId = parametroActivo.personalRespId;
        } else {
          console.warn(
            `[CotizacionVentas] No se encontró ParametroAprobador activo para empresa ${empresaSeleccionada}, módulo VENTAS`,
          );
        }
      }

      // Crear objeto inicial con autorizaVentaId pre-cargado
      const cotizacionInicial = {
        autorizaVentaId,
      };

      setSelectedCotizacion(cotizacionInicial);
      setIsEditing(false);
      setDialogVisible(true);
    } catch (error) {
      console.error("Error al obtener parámetro aprobador:", error);
      // Abrir diálogo sin autorizaVentaId si hay error
      setSelectedCotizacion(null);
      setIsEditing(false);
      setDialogVisible(true);
    }
  };

  const abrirDialogoEdicion = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const recargarCotizacionActual = async () => {
    if (!selectedCotizacion?.id) return;

    try {
      const cotizacionActualizada = await getCotizacionVentasPorId(
        selectedCotizacion.id,
      );
      setSelectedCotizacion(cotizacionActualizada);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo recargar la cotización desde el servidor.",
        life: 3000,
      });
    }
  };

  const handleGuardarCotizacion = async (datos) => {
    const esEdicion =
      selectedCotizacion &&
      selectedCotizacion.id &&
      selectedCotizacion.numeroDocumento;

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
        await actualizarCotizacionVentas(selectedCotizacion.id, datos);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Cotización actualizada. Puedes seguir agregando detalles.",
        });

        // Recargar la cotización actualizada para obtener campos actualizados
        const { getCotizacionVentasPorId } =
          await import("../api/cotizacionVentas");
        const cotizacionActualizada = await getCotizacionVentasPorId(
          selectedCotizacion.id,
        );
        setSelectedCotizacion(cotizacionActualizada);
        setRefreshKey((prev) => prev + 1); // Forzar re-mount del formulario
      } else {
        const resultado = await crearCotizacionVentas(datos);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Cotización creada con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        // Cargar la cotización recién creada
        const { getCotizacionVentasPorId } =
          await import("../api/cotizacionVentas");
        const cotizacionCompleta = await getCotizacionVentasPorId(resultado.id);
        setSelectedCotizacion(cotizacionCompleta);
        setRefreshKey((prev) => prev + 1); // Forzar re-mount del formulario
      }

      cargarCotizaciones();
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
    setDialogVisible(false);
    setSelectedCotizacion(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (cotizacion) => {
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
      message: `¿Está seguro de eliminar la cotización ${cotizacion.id}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarCotizacion(cotizacion.id),
    });
  };

  const eliminarCotizacion = async (id) => {
    try {
      await deleteCotizacionVentas(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cotización eliminada correctamente",
      });
      cargarCotizaciones();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la cotización",
      });
    }
  };

  const onRowClick = (event) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      abrirDialogoEdicion(event.data);
    }
  };

  const formatearMoneda = (valor) => {
    if (!valor) return "S/ 0.00";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const fechaRegistroTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">
          {rowData.codigo || `ID: ${rowData.id}`}
        </div>
        <div className="text-sm text-gray-600">
          {formatearFecha(rowData.fechaDocumento || rowData.fechaRegistro)}
        </div>
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
        <div className="text-sm text-gray-600">
          RUC: {rowData.empresa.ruc || "N/A"}
        </div>
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    if (!rowData.cliente) return "N/A";

    const severity = rowData.estado?.severityColor || "success";

    return (
      <ColorTag
        value={rowData.cliente.razonSocial || "Sin nombre"}
        severity={severity}
        size="normal"
      />
    );
  };

  const estadoTemplate = (rowData) => {
    if (!rowData.estado) return "N/A";
    // Usar el severityColor del estado o 'secondary' por defecto
    const severity = rowData.estado.severityColor || "secondary";
    return (
      <Badge
        value={rowData.estado.descripcion}
        severity={severity}
        size="small"
      />
    );
  };

  const fechasTemplate = (rowData) => {
    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Entrega:</span>{" "}
          {formatearFecha(rowData.fechaEntregaEstimada)}
        </div>
        {rowData.fechaZarpeEstimada && (
          <div>
            <span className="font-medium">Zarpe:</span>{" "}
            {formatearFecha(rowData.fechaZarpeEstimada)}
          </div>
        )}
        {rowData.fechaArriboEstimada && (
          <div>
            <span className="font-medium">Arribo:</span>{" "}
            {formatearFecha(rowData.fechaArriboEstimada)}
          </div>
        )}
      </div>
    );
  };

  const productoInfoTemplate = (rowData) => {
    return (
      <div className="text-sm">
        <div className="font-medium text-blue-700">
          {rowData.tipoProducto?.nombre || "N/A"}
        </div>
        {rowData.tipoEstadoProducto && (
          <div className="text-gray-600">
            <span className="font-medium">Estado:</span>{" "}
            {rowData.tipoEstadoProducto.nombre}
          </div>
        )}
        {rowData.destinoProducto && (
          <div className="text-gray-600">
            <span className="font-medium">Destino:</span>{" "}
            {rowData.destinoProducto.nombre}
          </div>
        )}
      </div>
    );
  };

  const montosTemplate = (rowData) => {
    // Calcular subtotal desde detalles
    const subtotal = (rowData.detallesProductos || []).reduce((sum, det) => {
      const cantidad = Number(det.cantidad) || 0;
      const precio = Number(det.precioUnitarioFinal) || 0;
      return sum + cantidad * precio;
    }, 0);

    // Calcular IGV
    const porcentajeIGV = Number(rowData.porcentajeIGV) || 0;
    const igv = rowData.esExoneradoAlIGV ? 0 : subtotal * (porcentajeIGV / 100);

    // Total
    const total = subtotal + igv;

    // Símbolo de moneda
    const simboloMoneda = rowData.moneda?.codigoSunat === "USD" ? "$" : "S/";

    return (
      <div className="text-right">
        <Tag
          value={`${simboloMoneda} ${formatearNumero(total)}`}
          severity="info"
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            padding: "6px 10px",
          }}
        />
        {rowData.tipoCambio && (
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>
            T/C: {formatearNumero(rowData.tipoCambio)}
          </div>
        )}
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
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
    setClienteSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSeleccionado(null);
  };

  return (
    <div className="cotizacion-ventas-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Cotizaciones de Ventas</h2>
        </div>

        <DataTable
          value={cotizacionesFiltradas}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={5}
          rowsPerPageOptions={[5, 10, 15, 20]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cotizaciones"
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
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron cotizaciones de ventas"
          scrollable
          scrollHeight="600px"
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
                  <h2>Cotizaciones Venta</h2>
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
                          : "Nueva Cotización"
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    icon="pi pi-refresh"
                    className="p-button-outlined p-button-info"
                    onClick={async () => {
                      await cargarCotizaciones();
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
              </div>
            </div>
          }
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ width: "80px", verticalAlign: "top" }}
            frozen
          />
          <Column
            field="fechaRegistro"
            header="N° Cotización"
            body={fechaRegistroTemplate}
            sortable
            style={{ width: "160px", verticalAlign: "top", fontWeight: "bold" }}
          />
          <Column
            field="empresaId"
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ width: "100px", verticalAlign: "top" }}
          />
          <Column
            field="tipoProductoId"
            header="Producto"
            body={productoInfoTemplate}
            sortable
            style={{ width: "200px", verticalAlign: "top", fontWeight: "bold" }}
          />
          <Column
            field="clienteId"
            header="Cliente"
            body={clienteTemplate}
            sortable
            style={{ width: "200px", verticalAlign: "top" }}
          />
          <Column
            field="estadoCotizacionId"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ width: "120px", verticalAlign: "top" }}
            className="text-center"
          />
          <Column
            header="Fechas"
            body={fechasTemplate}
            style={{ width: "150px", verticalAlign: "top" }}
          />
          <Column
            header="Montos"
            body={montosTemplate}
            style={{ width: "120px", verticalAlign: "top" }}
            className="text-right"
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "100px" }}
            className="text-center"
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={
          isEditing
            ? `Editar Cotización de Ventas: ${selectedCotizacion?.codigo || ""}`
            : "Nueva Cotización de Ventas"
        }
        modal
        maximized={true}
        maximizable
        onHide={cerrarDialogo}
      >
        <CotizacionVentasForm
          key={`${selectedCotizacion?.id || "new"}-${refreshKey}`}
          isEdit={isEditing}
          defaultValues={selectedCotizacion}
          onSubmit={handleGuardarCotizacion}
          onCancel={cerrarDialogo}
          loading={loading}
          toast={toast}
          permisos={permisos}
          readOnly={
            !!selectedCotizacion &&
            !!selectedCotizacion.numeroDocumento &&
            !permisos.puedeEditar
          }
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          clientes={clientes}
          agenteAduanas={agenteAduanas}
          operadoresLogisticos={operadoresLogisticos}
          navieras={navieras}
          tiposProducto={tiposProducto}
          tiposEstadoProducto={tiposEstadoProducto}
          destinosProducto={destinosProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          monedas={monedas}
          unidadesNegocio={unidadesNegocio}
          incoterms={incoterms}
          paises={paises}
          puertos={puertos}
          tiposContenedor={tiposContenedor}
          bancos={bancos}
          formasTransaccion={formasTransaccion}
          modosDespacho={modosDespacho}
          docRequeridaVentasOptions={docRequeridaVentas.map((d) => ({
            value: d.id,
            label: d.nombre,
            descripcion: d.descripcion,
          }))}
          empresaFija={empresaSeleccionada}
          onRecargarRegistro={recargarCotizacionActual}
        />
      </Dialog>
    </div>
  );
};

export default CotizacionVentas;
