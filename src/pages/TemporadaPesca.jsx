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
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Tooltip } from "primereact/tooltip";
import { FilterMatchMode } from "primereact/api";
import { useAuthStore } from "../shared/stores/useAuthStore";
import {
  getTemporadasPesca,
  getTemporadaPescaPorId,
  crearTemporadaPesca,
  actualizarTemporadaPesca,
  eliminarTemporadaPesca,
  subirDocumentoTemporada,
} from "../api/temporadaPesca";
import { getEmpresas } from "../api/empresa";
import { getEstadosMultiFuncionParaTemporadaPesca } from "../api/estadoMultiFuncion";
import TemporadaPescaForm from "../components/temporadaPesca/TemporadaPescaForm";
import { getResponsiveFontSize } from "../utils/utils";
import { abrirPdfEnNuevaPestana } from "../utils/pdfUtils";

/**
 * Componente principal para gestión de temporadas de pesca
 * Implementa las reglas transversales del ERP Megui
 */
const TemporadaPesca = () => {
  // Estados principales
  const [temporadas, setTemporadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados para combos de filtro
  const [empresas, setEmpresas] = useState([]);
  const [estadosTemporada, setEstadosTemporada] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);

  // Referencias
  const toast = useRef(null);
  const dt = useRef(null);

  // Store de autenticación
  const { usuario } = useAuthStore();

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    cargarDatos();
    cargarCombos();
  }, []);

  /**
   * Aplicar filtros cuando cambien
   */
  useEffect(() => {
    aplicarFiltros();
  }, [filtroEmpresa, filtroEstado]);

  /**
   * Cargar temporadas de pesca
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
        detail: "No se pudieron cargar las temporadas de pesca. Verifique su conexión e intente nuevamente.",
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
      const [empresasData, estadosData] = await Promise.all([
        getEmpresas(),
        getEstadosMultiFuncionParaTemporadaPesca(),
      ]);

      if (empresasData && Array.isArray(empresasData)) {
        setEmpresas(empresasData.map((e) => ({ ...e, id: Number(e.id) })));
      }

      if (estadosData && Array.isArray(estadosData)) {
        setEstadosTemporada(
          estadosData.map((e) => ({ ...e, id: Number(e.id) }))
        );
      }
    } catch (error) {
      console.error("Error al cargar combos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error de Carga",
        detail: "No se pudieron cargar los datos de los combos. Verifique su conexión e intente nuevamente.",
        life: 4000,
      });
    }
  };

  /**
   * Aplicar filtros a los datos
   */
  const aplicarFiltros = async () => {
    try {
      const filtros = {};

      if (filtroEmpresa) filtros.empresaId = filtroEmpresa;
      if (filtroEstado !== null) filtros.estadoTemporadaId = filtroEstado;

      const data = await getTemporadasPesca(filtros);
      setTemporadas(data);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error de Filtro",
        detail: "No se pudieron aplicar los filtros. Verifique su conexión e intente nuevamente.",
        life: 4000,
      });
    }
  };

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroEstado(null);
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
   * Abrir formulario para nueva temporada
   */
  const openNew = () => {
    setEditingItem({ empresaId: filtroEmpresa });
    setShowForm(true);
  };

  /**
   * Editar temporada (clic en fila - regla transversal ERP Megui)
   */
  const editItem = (temporada) => {
    setEditingItem(temporada);
    setShowForm(true);
  };

  /**
   * Confirmar eliminación de temporada
   */
  const confirmDelete = (temporada) => {
    // Solo superusuario o admin pueden eliminar (regla transversal ERP Megui)
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
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
      
      let mensajeError = "No se pudo eliminar la temporada. Verifique su conexión e intente nuevamente.";
      
      // Manejo específico de errores HTTP
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 409: // Conflict
            if (data.mensaje && data.mensaje.includes("faenas, entregas o liquidación")) {
              mensajeError = "No se puede eliminar esta temporada porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados antes de poder eliminar la temporada.";
            } else if (data.mensaje && data.mensaje.includes("faenas, entregas o liquidación")) {
              mensajeError = "No se puede eliminar esta temporada porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados.";
            } else {
              mensajeError = "Ya existe un registro similar. Por favor, verifique los datos ingresados.";
            }
            break;
          case 400: // Bad Request
            mensajeError = "Solicitud inválida. Verifique que el registro existe y es válido para eliminación.";
            break;
          case 404: // Not Found
            mensajeError = "La temporada que intenta eliminar no existe o ya ha sido eliminada.";
            break;
          case 403: // Forbidden
            mensajeError = "No tiene permisos para eliminar este registro.";
            break;
          case 500: // Internal Server Error
            mensajeError = "Error interno del servidor. Por favor, contacte al administrador del sistema.";
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
    try {
      let temporadaGuardada;
      
      if (editingItem?.id) {
        // Actualizar temporada existente
        temporadaGuardada = await actualizarTemporadaPesca(editingItem.id, data);
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
      
      let mensajeError = "No se pudo guardar la temporada. Verifique su conexión e intente nuevamente.";
      
      // Manejo específico de errores HTTP
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 409: // Conflict
            if (data.mensaje && data.mensaje.includes("fechas que se superponen")) {
              mensajeError = "Ya existe una temporada con el mismo nombre para esta empresa en fechas que se superponen. Por favor, verifique las fechas de inicio y fin o cambie el nombre de la temporada.";
            } else if (data.mensaje && data.mensaje.includes("faenas, entregas o liquidación")) {
              mensajeError = "No se puede eliminar esta temporada porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados.";
            } else {
              mensajeError = "Ya existe un registro similar. Por favor, verifique los datos ingresados.";
            }
            break;
          case 400: // Bad Request
            mensajeError = "Los datos ingresados no son válidos. Por favor, revise la información y corrija los errores.";
            break;
          case 404: // Not Found
            mensajeError = "El registro que intenta modificar no existe o ha sido eliminado.";
            break;
          case 403: // Forbidden
            mensajeError = "No tiene permisos para realizar esta operación.";
            break;
          case 500: // Internal Server Error
            mensajeError = "Error interno del servidor. Por favor, contacte al administrador del sistema.";
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

  /**
   * Obtener descripción del estado por ID
   */
  const getEstadoDescripcion = (id) => {
    const estado = estadosTemporada.find((e) => Number(e.id) === Number(id));
    return estado ? estado.descripcion : "Sin estado";
  };

  /**
   * Obtener razón social de empresa por ID
   */
  const getEmpresaRazonSocial = (id) => {
    const empresa = empresas.find((e) => Number(e.id) === Number(id));
    return empresa ? empresa.razonSocial : "Sin empresa";
  };

  /**
   * Template para estado de temporada desde EstadoMultiFuncion
   */
  const estadoTemplate = (rowData) => {
    const estadoDescripcion = getEstadoDescripcion(rowData.estadoTemporadaId);

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
   * Template para resolución con enlace al PDF
   */
  const resolucionTemplate = (rowData) => {
    if (!rowData.numeroResolucion) return "-";

    return (
      <div className="flex align-items-center gap-2">
        <span>{rowData.numeroResolucion}</span>
        {rowData.urlResolucionPdf && (
          <Button
            icon="pi pi-file-pdf"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip="Ver PDF"
            tooltipOptions={{ position: "top" }}
            onClick={() => abrirPdfEnNuevaPestana(rowData.urlResolucionPdf, toast, "No hay PDF disponible para esta resolución.")}
          />
        )}
      </div>
    );
  };

  /**
   * Template para empresa
   */
  const empresaTemplate = (rowData) => {
    return getEmpresaRazonSocial(rowData.empresaId);
  };

  /**
   * Template para acciones (solo eliminar, edición por clic en fila)
   */
  const actionTemplate = (rowData) => {
    // Solo mostrar botón eliminar para superusuario o admin (regla transversal ERP Megui)
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      return null;
    }

    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          tooltip="Eliminar temporada"
          tooltipOptions={{ position: "top" }}
          onClick={() => confirmDelete(rowData)}
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
      <Tooltip target=".custom-tooltip" />
      <div className="card">
        <DataTable
          ref={dt}
          value={temporadas}
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
          scrollable
          scrollHeight="600px"
          onRowClick={(e) => editItem(e.data)}
          rowClassName={() => "cursor-pointer hover:bg-primary-50"}
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
          sortField="id"
          sortOrder={-1}
          header={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
                gap: 5,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Gestión de Temporadas de Pesca</h2>
              </div>
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
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nueva Temporada"
                  icon="pi pi-plus"
                  className="p-button-success"
                  raised
                  outlined
                  size="small"
                  onClick={openNew}
                  disabled={!filtroEmpresa}
                  tooltip={
                    !filtroEmpresa
                      ? "Seleccione una empresa para crear una nueva temporada"
                      : "Crear nueva temporada"
                  }
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
                  className="w-10rem"
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  icon="pi pi-filter-slash"
                  className="p-button-outlined"
                  tooltip="Limpiar filtros"
                  onClick={limpiarFiltros}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span className="p-input-icon-left">
                  <InputText
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Búsqueda global..."
                    className="w-15rem"
                  />
                </span>
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
            style={{ minWidth: "100px", maxWidth: "100px" }}
            className="text-center"
          />
        </DataTable>
      </div>
      {/* Formulario de temporada */}
      <TemporadaPescaForm
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={saveItem}
        editingItem={editingItem}
        empresas={empresas}
        onTemporadaDataChange={actualizarEditingItem}
      />
    </div>
  );
};

export default TemporadaPesca;
