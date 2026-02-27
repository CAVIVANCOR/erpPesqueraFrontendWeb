/**
 * Pantalla de gestión de Temporadas de Pesca
 *
 * Características:
 * - DataTable con scroll horizontal para múltiples columnas
 * - Edición por clic en fila (regla transversal ERP Megui)
 * - Eliminación solo para superusuario/admin con ConfirmDialog
 * - Filtros por empresa, bahía y estado
 * - Templates especializados para fechas, cuotas y resoluciones
 * - Indicadores visuales de temporadas activas
 * - Upload de archivos PDF para resoluciones
 * - Validación de períodos no superpuestos
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Tooltip } from "primereact/tooltip";
import { FilterMatchMode } from "primereact/api";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import UnidadNegocioFilter from "../components/common/UnidadNegocioFilter";
import { useUnidadNegocioFilter } from "../hooks/useUnidadNegocioFilter";
import {
  getTemporadasPesca,
  getTemporadaPescaPorId,
  crearTemporadaPesca,
  actualizarTemporadaPesca,
  eliminarTemporadaPesca,
  subirDocumentoTemporada,
} from "../api/temporadaPesca";
import { getEmpresas } from "../api/empresa";
import { getUnidadesNegocio } from "../api/unidadNegocio";
import { getEstadosMultiFuncionParaTemporadaPesca } from "../api/estadoMultiFuncion";
import { getTiposDocumento } from "../api/tipoDocumento";
import TemporadaPescaForm from "../components/temporadaPesca/TemporadaPescaForm";
import { getResponsiveFontSize } from "../utils/utils";
import { abrirPdfEnNuevaPestana } from "../utils/pdfUtils";
import PDFActionButtons from "../components/pdf/PDFActionButtons";

/**
 * Componente principal para gestión de temporadas de pesca
 * Implementa las reglas transversales del ERP Megui
 */
const TemporadaPesca = ({ ruta }) => {
  // Store de autenticación y permisos
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Estados principales
  const [temporadas, setTemporadas] = useState([]);

  // Filtrado automático por Unidad de Negocio
  const { datosFiltrados: temporadasFiltradas } =
    useUnidadNegocioFilter(temporadas);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  // Estados para combos de filtro
  const [empresas, setEmpresas] = useState([]);
  const [estadosTemporada, setEstadosTemporada] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  // Constante con todas las zonas disponibles (escalable)
  const ZONAS_DISPONIBLES = [
    { value: "NORTE", label: "NORTE", color: "#3b82f6", icon: "pi-arrow-up" },
    { value: "SUR", label: "SUR", color: "#10b981", icon: "pi-arrow-down" },
    // Agregar más zonas aquí en el futuro:
    // { value: "CENTRO", label: "CENTRO", color: "#f59e0b", icon: "pi-circle" },
    // { value: "ESTE", label: "ESTE", color: "#8b5cf6", icon: "pi-arrow-right" },
  ];
  // Estados para diálogo de selección de zona
  const [showZonaDialog, setShowZonaDialog] = useState(false);
  const [zonaIndex, setZonaIndex] = useState(0); // Índice de la zona actual
  // Referencias
  const toast = useRef(null);
  const dt = useRef(null);
  const isMounted = useRef(false);

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    cargarDatos();
    cargarCombos();
  }, []);

  /**
   * Aplicar filtros cuando cambien
   * Previene race conditions con la carga inicial
   */
  useEffect(() => {
    // Prevenir ejecución en montaje inicial (evita race condition con cargarDatos)
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // Si todos los filtros son null, no aplicar (se limpiaron los filtros)
    if (
      filtroEmpresa === null &&
      filtroEstado === null &&
      fechaDesde === null &&
      fechaHasta === null
    ) {
      return;
    }

    aplicarFiltros();
  }, [filtroEmpresa, filtroEstado, fechaDesde, fechaHasta]);

  /**
   * Cargar todas las temporadas de pesca sin filtros
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getTemporadasPesca();
      setTemporadas(data);
    } catch (error) {
      console.error("Error al cargar temporadas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error de Carga",
        detail:
          "No se pudieron cargar las temporadas de pesca. Verifique su conexión e intente nuevamente.",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar datos para combos de filtro
   */
  const cargarCombos = async () => {
    try {
      const [
        empresasData,
        estadosData,
        tiposDocumentoData,
        unidadesNegocioData,
      ] = await Promise.all([
        getEmpresas(),
        getEstadosMultiFuncionParaTemporadaPesca(),
        getTiposDocumento(),
        getUnidadesNegocio({ activo: true }),
      ]);

      if (empresasData && Array.isArray(empresasData)) {
        setEmpresas(empresasData.map((e) => ({ ...e, id: Number(e.id) })));
      }

      if (estadosData && Array.isArray(estadosData)) {
        setEstadosTemporada(
          estadosData.map((e) => ({ ...e, id: Number(e.id) })),
        );
      }

      if (tiposDocumentoData && Array.isArray(tiposDocumentoData)) {
        setTiposDocumento(
          tiposDocumentoData.map((td) => ({ ...td, id: Number(td.id) })),
        );
      }

      if (unidadesNegocioData && Array.isArray(unidadesNegocioData)) {
        setUnidadesNegocio(
          unidadesNegocioData.map((un) => ({ ...un, id: Number(un.id) })),
        );
      }
    } catch (error) {
      console.error("Error al cargar combos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error de Carga",
        detail:
          "No se pudieron cargar los datos de los combos. Verifique su conexión e intente nuevamente.",
        life: 4000,
      });
    }
  };

  /**
   * Aplicar filtros a los datos
   * Construye el objeto de filtros y llama a la API
   */
  const aplicarFiltros = async () => {
    try {
      const filtros = {};

      if (filtroEmpresa) filtros.empresaId = filtroEmpresa;
      if (filtroEstado !== null) filtros.estadoTemporadaId = filtroEstado;
      if (fechaDesde)
        filtros.fechaDesde = fechaDesde.toISOString().split("T")[0];
      if (fechaHasta)
        filtros.fechaHasta = fechaHasta.toISOString().split("T")[0];

      const data = await getTemporadasPesca(filtros);
      setTemporadas(data);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error de Filtro",
        detail:
          "No se pudieron aplicar los filtros. Verifique su conexión e intente nuevamente.",
        life: 4000,
      });
    }
  };

  /**
   * Limpiar todos los filtros y recargar datos completos
   */
  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroEstado(null);
    setFechaDesde(null);
    setFechaHasta(null);
    setGlobalFilterValue("");
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    cargarDatos();
  };

  /**
   * Manejar filtro global
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  /**
   * Abrir diálogo de selección de zona antes de crear nueva temporada
   */
  const openNew = () => {
    setZonaIndex(0); // Resetear a primera zona (NORTE)
    setShowZonaDialog(true);
  };

  /**
   * Permutar a la siguiente zona
   */
  const permutarZona = () => {
    setZonaIndex((prevIndex) => (prevIndex + 1) % ZONAS_DISPONIBLES.length);
  };

  /**
   * Confirmar zona y abrir formulario de nueva temporada
   */
  const confirmarZonaYAbrirFormulario = () => {
    const zonaSeleccionada = ZONAS_DISPONIBLES[zonaIndex].value;
    setShowZonaDialog(false);
    setEditingItem({
      empresaId: filtroEmpresa,
      zona: zonaSeleccionada,
    });
    setIsEdit(false);
    setShowForm(true);
  };

   /**
   * Editar temporada (clic en fila - regla transversal ERP Megui)
   * ⚠️ CRÍTICO: Obtiene datos FRESCOS de la BD para garantizar integridad de datos
   */
  const editItem = async (temporada) => {
    try {
      setLoading(true);
      
      // Obtener datos 100% REALES Y ACTUALIZADOS de la base de datos
      const temporadaActualizada = await getTemporadaPescaPorId(temporada.id);
      
      if (temporadaActualizada) {
        setEditingItem(temporadaActualizada);
        setIsEdit(true);
        setShowForm(true);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar la temporada desde la base de datos",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al cargar temporada desde BD:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al obtener datos actualizados de la base de datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmar eliminación de temporada
   */
  const confirmDelete = (temporada) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de que desea eliminar la temporada "${temporada.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: () => deleteItem(temporada.id),
    });
  };

  /**
   * Eliminar temporada
   */
  const deleteItem = async (id) => {
    try {
      await eliminarTemporadaPesca(id);

      toast.current?.show({
        severity: "success",
        summary: "Eliminación Exitosa",
        detail: "La temporada ha sido eliminada correctamente.",
        life: 3000,
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar temporada:", error);

      let mensajeError =
        "No se pudo eliminar la temporada. Verifique su conexión e intente nuevamente.";

      // Manejo específico de errores HTTP
      if (error.response) {
        const { status, data } = error.response;

        switch (status) {
          case 409: // Conflict
            if (
              data.mensaje &&
              data.mensaje.includes("faenas, entregas o liquidación")
            ) {
              mensajeError =
                "No se puede eliminar esta temporada porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados antes de poder eliminar la temporada.";
            } else if (
              data.mensaje &&
              data.mensaje.includes("faenas, entregas o liquidación")
            ) {
              mensajeError =
                "No se puede eliminar esta temporada porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados.";
            } else {
              mensajeError =
                "Ya existe un registro similar. Por favor, verifique los datos ingresados.";
            }
            break;
          case 400: // Bad Request
            mensajeError =
              "Solicitud inválida. Verifique que el registro existe y es válido para eliminación.";
            break;
          case 404: // Not Found
            mensajeError =
              "La temporada que intenta eliminar no existe o ya ha sido eliminada.";
            break;
          case 403: // Forbidden
            mensajeError = "No tiene permisos para eliminar este registro.";
            break;
          case 500: // Internal Server Error
            mensajeError =
              "Error interno del servidor. Por favor, contacte al administrador del sistema.";
            break;
          default:
            mensajeError = `Error del servidor (${status}). Por favor, intente nuevamente o contacte al soporte técnico.`;
        }
      }

      toast.current?.show({
        severity: "error",
        summary: "Error de Eliminación",
        detail: mensajeError,
        life: 5000,
      });
    }
  };

  /**
   * Guardar temporada (crear o actualizar)
   */
  const saveItem = async (data) => {
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar registros.",
        life: 3000,
      });
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }

    try {
      let temporadaGuardada;

      if (editingItem?.id) {
        // Actualizar temporada existente
        temporadaGuardada = await actualizarTemporadaPesca(
          editingItem.id,
          data,
        );
        toast.current?.show({
          severity: "success",
          summary: "Actualización Exitosa",
          detail: "La temporada ha sido actualizada correctamente.",
          life: 3000,
        });
      } else {
        // Crear nueva temporada
        temporadaGuardada = await crearTemporadaPesca(data);
        toast.current?.show({
          severity: "success",
          summary: "Creación Exitosa",
          detail: "La temporada ha sido creada correctamente.",
          life: 3000,
        });

        // Para nuevas temporadas, actualizar editingItem con los datos guardados
        // para mantener el formulario en modo edición
        setEditingItem(temporadaGuardada);
        setIsEdit(true); // Cambiar a modo edición para que el botón muestre "Actualizar"
      }

      // NO cerrar el formulario - mantener modo edición activo
      // setShowForm(false);
      // setEditingItem(null);

      // Recargar datos para actualizar la tabla
      cargarDatos();

      // Devolver el objeto resultado
      return temporadaGuardada;
    } catch (error) {
      console.error("Error al guardar temporada:", error);

      let mensajeError =
        "No se pudo guardar la temporada. Verifique su conexión e intente nuevamente.";

      // Manejo específico de errores HTTP
      if (error.response) {
        const { status, data } = error.response;

        switch (status) {
          case 409: // Conflict
            if (
              data.mensaje &&
              data.mensaje.includes("fechas que se superponen")
            ) {
              mensajeError =
                "Ya existe una temporada con el mismo nombre para esta empresa en fechas que se superponen. Por favor, verifique las fechas de inicio y fin o cambie el nombre de la temporada.";
            } else if (
              data.mensaje &&
              data.mensaje.includes("faenas, entregas o liquidación")
            ) {
              mensajeError =
                "No se puede eliminar esta temporada porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados.";
            } else {
              mensajeError =
                "Ya existe un registro similar. Por favor, verifique los datos ingresados.";
            }
            break;
          case 400: // Bad Request
            mensajeError =
              "Los datos ingresados no son válidos. Por favor, revise la información y corrija los errores.";
            break;
          case 404: // Not Found
            mensajeError =
              "El registro que intenta modificar no existe o ha sido eliminado.";
            break;
          case 403: // Forbidden
            mensajeError = "No tiene permisos para realizar esta operación.";
            break;
          case 500: // Internal Server Error
            mensajeError =
              "Error interno del servidor. Por favor, contacte al administrador del sistema.";
            break;
          default:
            mensajeError = `Error del servidor (${status}). Por favor, intente nuevamente o contacte al soporte técnico.`;
        }
      }

      toast.current?.show({
        severity: "error",
        summary: "Error de Guardado",
        detail: mensajeError,
        life: 5000,
      });
      throw error; // Re-lanzar el error para que el formulario lo maneje
    }
  };

  // Funciones helper eliminadas - ahora usamos relaciones directas del backend

  /**
   * Template para estado de temporada desde EstadoMultiFuncion
   */
  const estadoTemplate = (rowData) => {
    const estadoDescripcion =
      rowData.estadoTemporada?.descripcion || "Sin estado";

    // Determinar el color según el estado
    let severity = "secondary";
    let icon = "pi pi-question-circle";

    switch (estadoDescripcion) {
      case "EN ESPERA DE INICIO":
        severity = "warning";
        icon = "pi pi-clock";
        break;
      case "ACTIVA":
        severity = "success";
        icon = "pi pi-check-circle";
        break;
      case "SUSPENDIDA":
        severity = "danger";
        icon = "pi pi-pause-circle";
        break;
      case "FINALIZADA":
        severity = "info";
        icon = "pi pi-flag";
        break;
      case "CANCELADA":
        severity = "danger";
        icon = "pi pi-times-circle";
        break;
    }

    return <Tag value={estadoDescripcion} severity={severity} icon={icon} />;
  };

  /**
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = new Date(rowData[field]);
    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /**
   * Template para cuotas en toneladas
   */
  const cuotaTemplate = (rowData, field) => {
    const valor = rowData[field];

    // Para toneladas capturadas, mostrar 0.00 si es null/undefined
    if (field === "toneladasCapturadasTemporada") {
      const valorNumerico = Number(valor) || 0;
      return (
        <div className="text-right">
          <Badge
            value={`${valorNumerico.toFixed(2)} Ton`}
            severity={valorNumerico > 0 ? "success" : "secondary"}
          />
        </div>
      );
    }

    // Para otros campos, mantener comportamiento original
    if (!valor) return "-";

    return (
      <div className="text-right">
        <Badge value={`${Number(valor).toFixed(2)} Ton`} severity="info" />
      </div>
    );
  };

  /**
   * Template para resolución (solo texto)
   */
  const resolucionTemplate = (rowData) => {
    return rowData.numeroResolucion || "-";
  };

  /**
   * Template para empresa
   */
  const empresaTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "Sin empresa";
  };

  /**
   * Template para acciones (PDF, eliminar, edición por clic en fila)
   */
  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-2 align-items-center">
        {rowData.urlResolucionPdf && (
          <div style={{ display: "inline-block" }}>
            <PDFActionButtons
              pdfUrl={rowData.urlResolucionPdf}
              moduleName="temporada-pesca"
              fileName={`Resolucion_${rowData.numeroResolucion}.pdf`}
              showViewButton={true}
              showDownloadButton={false}
              viewButtonLabel=""
              className="p-0"
              toast={toast}
            />
          </div>
        )}
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          tooltip="Eliminar temporada"
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeEliminar}
          onClick={() => {
            if (permisos.puedeEliminar) {
              confirmDelete(rowData);
            }
          }}
        />
      </div>
    );
  };

  /**
   * Template para cuota total (Cuota Propia + Cuota Alquilada)
   */
  const cuotaTotalTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon) || 0;
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon) || 0;
    const cuotaTotal = cuotaPropia + cuotaAlquilada;

    return (
      <div className="text-right">
        <Badge value={`${cuotaTotal.toFixed(2)} Ton`} severity="primary" />
      </div>
    );
  };

  /**
   * Template para toneladas pendientes (Cuota Total - Toneladas Capturadas)
   */
  const toneladasPendientesTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon) || 0;
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon) || 0;
    const cuotaTotal = cuotaPropia + cuotaAlquilada;
    const capturadas = Number(rowData.toneladasCapturadasTemporada) || 0;
    const pendientes = cuotaTotal - capturadas;

    // Determinar color según el estado
    let severity = "secondary";
    if (pendientes > 0) {
      severity = "warning"; // Amarillo para pendientes
    } else if (pendientes === 0) {
      severity = "success"; // Verde para completado
    } else {
      severity = "danger"; // Rojo para sobrepesca
    }

    return (
      <div className="text-right">
        <Badge value={`${pendientes.toFixed(2)} Ton`} severity={severity} />
      </div>
    );
  };

  /**
   * Template para porcentaje avanzado (Toneladas Capturadas / Cuota Total * 100)
   */
  const porcentajeAvanzadoTemplate = (rowData) => {
    const cuotaPropia = Number(rowData.cuotaPropiaTon) || 0;
    const cuotaAlquilada = Number(rowData.cuotaAlquiladaTon) || 0;
    const cuotaTotal = cuotaPropia + cuotaAlquilada;
    const capturadas = Number(rowData.toneladasCapturadasTemporada) || 0;

    // Evitar división por cero
    if (cuotaTotal === 0) {
      return (
        <div className="text-center">
          <Badge value="0%" severity="secondary" />
        </div>
      );
    }

    const porcentaje = (capturadas / cuotaTotal) * 100;

    // Determinar color según el porcentaje
    let severity = "secondary";
    if (porcentaje >= 100) {
      severity = "success"; // Verde para 100% o más
    } else if (porcentaje >= 75) {
      severity = "info"; // Azul para 75-99%
    } else if (porcentaje >= 50) {
      severity = "warning"; // Amarillo para 50-74%
    } else if (porcentaje > 0) {
      severity = "secondary"; // Gris para 1-49%
    } else {
      severity = "danger"; // Rojo para 0%
    }

    return (
      <div className="text-center">
        <Badge value={`${porcentaje.toFixed(1)}%`} severity={severity} />
      </div>
    );
  };

  /**
   * Actualizar datos de la temporada en edición
   */
  const actualizarEditingItem = async (temporadaActualizada) => {
    if (temporadaActualizada && editingItem?.id === temporadaActualizada.id) {
      setEditingItem(temporadaActualizada);

      // También actualizar la lista de temporadas
      await cargarDatos();
    }
  };

  return (
    <div className="temporada-pesca-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Tooltip mouseTrack target=".custom-tooltip" />
      <div className="card">
        <DataTable
          ref={dt}
          value={temporadasFiltradas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} temporadas"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={["nombre", "numeroResolucion"]}
          emptyMessage="No se encontraron temporadas de pesca"
          showGridlines
          stripedRows
          scrollable
          scrollHeight="600px"
          sortField="id"
          sortOrder={-1}
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar
              ? (e) => editItem(e.data)
              : undefined
          }
          rowClassName={() => "cursor-pointer hover:bg-primary-50"}
          style={{
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
          header={
            <div>
              {/* Primera fila: Título, empresa, botón nuevo y búsqueda */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  marginBottom: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2>Pesca Industrial</h2>
                </div>
              </div>

              {/* Segunda fila: Filtros de fecha, estado y botón limpiar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroEmpresa}
                    options={empresas}
                    onChange={(e) => setFiltroEmpresa(e.value)}
                    optionLabel="razonSocial"
                    optionValue="id"
                    placeholder="Filtrar por empresa"
                    className="w-12rem"
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    className="p-button-success"
                    onClick={openNew}
                    disabled={!permisos.puedeCrear || !filtroEmpresa}
                    tooltip={
                      !permisos.puedeCrear
                        ? "No tiene permisos para crear temporadas"
                        : !filtroEmpresa
                          ? "Seleccione una empresa para crear una nueva temporada"
                          : "Crear nueva temporada"
                    }
                    tooltipOptions={{ position: "bottom" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="p-input-icon-left">
                    <InputText
                      value={globalFilterValue}
                      onChange={onGlobalFilterChange}
                      placeholder="Búsqueda global..."
                      className="w-full"
                    />
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <Calendar
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.value)}
                    placeholder="Fecha desde"
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    className="w-12rem"
                    tooltip="Filtrar por fecha de inicio desde"
                    tooltipOptions={{ position: "bottom" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Calendar
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.value)}
                    placeholder="Fecha hasta"
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    className="w-12rem"
                    tooltip="Filtrar por fecha de inicio hasta"
                    tooltipOptions={{ position: "bottom" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroEstado}
                    options={estadosTemporada}
                    onChange={(e) => setFiltroEstado(e.value)}
                    optionLabel="descripcion"
                    optionValue="id"
                    placeholder="Filtrar por estado"
                    className="w-12rem"
                    showClear
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    icon="pi pi-refresh"
                    className="p-button-outlined p-button-info"
                    onClick={async () => {
                      await cargarDatos();
                      await cargarCombos();
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
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-filter-slash"
                    className="p-button-outlined p-button-secondary"
                    onClick={limpiarFiltros}
                    tooltip="Limpiar todos los filtros y mostrar todas las temporadas"
                    tooltipOptions={{ position: "bottom" }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  {/* Filtro de Unidad de Negocio - Compacto */}
                  <UnidadNegocioFilter />
                </div>
              </div>
            </div>
          }
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="numeroResolucion"
            header="Resolución"
            body={resolucionTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: "120px" }}
            className="text-center"
          />
          <Column
            field="fechaInicio"
            header="Fecha Inicio"
            body={(rowData) => fechaTemplate(rowData, "fechaInicio")}
            sortable
            style={{ minWidth: "100px" }}
            className="text-center"
          />
          <Column
            field="fechaFin"
            header="Fecha Fin"
            body={(rowData) => fechaTemplate(rowData, "fechaFin")}
            sortable
            style={{ minWidth: "100px" }}
            className="text-center"
          />
          <Column
            field="cuotaTotal"
            header="Cuota Total"
            body={cuotaTotalTemplate}
            sortable
            style={{ minWidth: "130px" }}
            className="text-right"
          />
          <Column
            field="toneladasCapturadasTemporada"
            header="Toneladas Capturadas"
            body={(rowData) =>
              cuotaTemplate(rowData, "toneladasCapturadasTemporada")
            }
            sortable
            style={{ minWidth: "130px" }}
            className="text-right"
          />

          <Column
            field="toneladasPendientes"
            header="Toneladas Pendientes"
            body={toneladasPendientesTemplate}
            sortable
            style={{ minWidth: "130px" }}
            className="text-right"
          />

          <Column
            field="porcentajeAvanzado"
            header="Porcentaje Avanzado"
            body={porcentajeAvanzadoTemplate}
            sortable
            style={{ minWidth: "120px" }}
            className="text-right"
          />

          <Column
            header="Acciones"
            body={actionTemplate}
            exportable={false}
            style={{ minWidth: "100px", maxWidth: "150px" }}
            className="text-center"
          />
        </DataTable>
      </div>
      {/* Diálogo de selección de zona con botón permutante */}
      <Dialog
        visible={showZonaDialog}
        onHide={() => setShowZonaDialog(false)}
        header="Seleccionar Zona de Temporada"
        modal
        style={{ width: "500px" }}
        closable={false}
      >
        <div className="p-fluid" style={{ padding: "1rem" }}>
          {/* Pregunta */}
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#495057",
                margin: 0,
              }}
            >
              ¿A qué zona pertenece la temporada?
            </h3>
            <small
              style={{
                color: "#6c757d",
                display: "block",
                marginTop: "0.5rem",
              }}
            >
              Haga clic en el botón para cambiar de zona
            </small>
          </div>

          {/* Botón permutante de zona */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <Button
              label={ZONAS_DISPONIBLES[zonaIndex].label}
              icon={`pi ${ZONAS_DISPONIBLES[zonaIndex].icon}`}
              onClick={permutarZona}
              style={{
                width: "280px",
                height: "100px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                backgroundColor: ZONAS_DISPONIBLES[zonaIndex].color,
                borderColor: ZONAS_DISPONIBLES[zonaIndex].color,
                color: "#ffffff",
                transition: "all 0.3s ease",
                boxShadow: `0 6px 12px ${ZONAS_DISPONIBLES[zonaIndex].color}40`,
                transform: "scale(1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          </div>

          {/* Indicador de zona actual */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: `2px solid ${ZONAS_DISPONIBLES[zonaIndex].color}`,
            }}
          >
            <div style={{ marginBottom: "0.5rem" }}>
              <strong style={{ color: "#495057", fontSize: "0.9rem" }}>
                Zona seleccionada:
              </strong>
            </div>
            <div
              style={{
                color: ZONAS_DISPONIBLES[zonaIndex].color,
                fontWeight: "bold",
                fontSize: "1.3rem",
              }}
            >
              {ZONAS_DISPONIBLES[zonaIndex].label}
            </div>
            <small
              style={{
                color: "#6c757d",
                display: "block",
                marginTop: "0.5rem",
              }}
            >
              {ZONAS_DISPONIBLES.length > 1 &&
                `(${zonaIndex + 1} de ${ZONAS_DISPONIBLES.length} zonas disponibles)`}
            </small>
          </div>

          {/* Botones de acción */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowZonaDialog(false)}
              className="p-button-text p-button-secondary"
            />
            <Button
              label="PROCEDER"
              icon="pi pi-check"
              onClick={confirmarZonaYAbrirFormulario}
              className="p-button-success"
              style={{
                fontWeight: "bold",
                minWidth: "140px",
              }}
            />
          </div>
        </div>
      </Dialog>
      {/* Formulario de temporada */}
      <TemporadaPescaForm
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingItem(null);
          setIsEdit(false);
        }}
        onSave={saveItem}
        editingItem={editingItem}
        empresas={empresas}
        tiposDocumento={tiposDocumento}
        unidadesNegocio={unidadesNegocio}
        onTemporadaDataChange={actualizarEditingItem}
        readOnly={isEdit && !permisos.puedeEditar}
        isEdit={isEdit}
      />
    </div>
  );
};

export default TemporadaPesca;
