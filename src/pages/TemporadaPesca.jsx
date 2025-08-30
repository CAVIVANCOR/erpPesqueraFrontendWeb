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
import { ConfirmDialog } from "primereact/confirmdialog";
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
        summary: "Error",
        detail: "No se pudieron cargar las temporadas de pesca",
        life: 3000,
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
        detail: "No tiene permisos para eliminar registros",
        life: 3000,
      });
      return;
    }

    // ConfirmDialog profesional con estilo rojo
    const confirmDialog = document.createElement("div");
    confirmDialog.innerHTML = `
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;"></i>
        <h3>Confirmar Eliminación</h3>
        <p>¿Está seguro de que desea eliminar la temporada "${temporada.nombre}"?</p>
        <p><strong>Esta acción no se puede deshacer.</strong></p>
      </div>
    `;

    import("primereact/api").then(({ confirmDialog: confirm }) => {
      confirm({
        message: confirmDialog.innerHTML,
        header: "Confirmar Eliminación",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        acceptLabel: "Sí, Eliminar",
        rejectLabel: "Cancelar",
        accept: () => deleteItem(temporada.id),
      });
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
        summary: "Éxito",
        detail: "Temporada eliminada correctamente",
        life: 3000,
      });

      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar temporada:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "No se pudo eliminar la temporada",
        life: 3000,
      });
    }
  };

  /**
   * Guardar temporada (crear o actualizar)
   */
  const saveItem = async (data) => {
    try {
      if (editingItem?.id) {
        // Actualizar temporada existente
        await actualizarTemporadaPesca(editingItem.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Temporada actualizada correctamente",
          life: 3000,
        });
      } else {
        // Crear nueva temporada
        await crearTemporadaPesca(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Temporada creada correctamente",
          life: 3000,
        });
      }

      setShowForm(false);
      setEditingItem(null);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar temporada:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "No se pudo guardar la temporada",
        life: 3000,
      });
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
            onClick={() => window.open(rowData.urlResolucionPdf, "_blank")}
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
                  tooltip={!filtroEmpresa ? "Seleccione una empresa para crear una nueva temporada" : "Crear nueva temporada"}
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
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="numeroResolucion"
            header="Resolución"
            body={resolucionTemplate}
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="nombre"
            header="Nombre de Temporada"
            sortable
            style={{ minWidth: "200px" }}
            className="font-semibold"
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
            style={{ minWidth: "120px" }}
            className="text-center"
          />
          <Column
            field="fechaFin"
            header="Fecha Fin"
            body={(rowData) => fechaTemplate(rowData, "fechaFin")}
            sortable
            style={{ minWidth: "120px" }}
            className="text-center"
          />
          <Column
            field="cuotaPropiaTon"
            header="Cuota Propia"
            body={(rowData) => cuotaTemplate(rowData, "cuotaPropiaTon")}
            sortable
            style={{ minWidth: "130px" }}
            className="text-center"
          />

          <Column
            field="cuotaAlquiladaTon"
            header="Cuota Alquilada"
            body={(rowData) => cuotaTemplate(rowData, "cuotaAlquiladaTon")}
            sortable
            style={{ minWidth: "140px" }}
            className="text-center"
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
      />
    </div>
  );
};

export default TemporadaPesca;
