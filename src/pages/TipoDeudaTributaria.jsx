// src/pages/TipoDeudaTributaria.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import TipoDeudaTributariaForm from "../components/tipoDeudaTributaria/TipoDeudaTributariaForm";
import {
  getTiposDeudaTributaria,
  getTipoDeudaTributariaById,
  createTipoDeudaTributaria,
  updateTipoDeudaTributaria,
  deleteTipoDeudaTributaria,
} from "../api/tesoreria/tipoDeudaTributaria";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import { Dropdown } from "primereact/dropdown";
import { getCategoriaTipoDeudaTributaria } from "../api/tesoreria/categoriaTipoDeudaTributaria";

export default function TipoDeudaTributaria({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [tipos, setTipos] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [tipoDialog, setTipoDialog] = useState(false);
  const [deleteTipoDialog, setDeleteTipoDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const categoriasData = await getCategoriaTipoDeudaTributaria();
      setCategorias(categoriasData || []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const tiposData = await getTiposDeudaTributaria();
      setTipos(tiposData || []);
    } catch (error) {
      console.error("Error al cargar tipos de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const tiposFiltrados = tipos.filter((tipo) => {
    if (!selectedCategoria) return true;
    if (selectedCategoria === "sin-categoria") {
      return !tipo.categoriaId;
    }
    return tipo.categoriaId === selectedCategoria;
  });

  const openNew = () => {
    setFormData({});
    setSelectedTipo(null);
    setIsEdit(false);
    setTipoDialog(true);
  };

  const hideDialog = () => {
    setTipoDialog(false);
    setFormData({});
    setSelectedTipo(null);
  };

  const editTipo = async (tipo) => {
    try {
      setLoading(true);
      const tipoCompleto = await getTipoDeudaTributariaById(tipo.id);
      setFormData(tipoCompleto);
      setSelectedTipo(tipo);
      setIsEdit(true);
      setTipoDialog(true);
    } catch (error) {
      console.error("Error al cargar tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTipo = async (data) => {
    const esEdicion = isEdit && selectedTipo;

    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      const dataConAuditoria = {
        ...data,
        creadoPor: esEdicion
          ? data.creadoPor
          : usuario?.personalId
            ? Number(usuario.personalId)
            : null,
        actualizadoPor:
          esEdicion && usuario?.personalId
            ? Number(usuario.personalId)
            : null,
      };

      if (esEdicion) {
        await updateTipoDeudaTributaria(selectedTipo.id, dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de deuda tributaria actualizado correctamente",
          life: 3000,
        });
      } else {
        await createTipoDeudaTributaria(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de deuda tributaria creado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTipo = (tipo) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedTipo(tipo);
    setDeleteTipoDialog(true);
  };

  const deleteTipoConfirmed = async () => {
    try {
      setLoading(true);
      await deleteTipoDeudaTributaria(selectedTipo.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de deuda tributaria eliminado correctamente",
        life: 3000,
      });

      setDeleteTipoDialog(false);
      setSelectedTipo(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteTipoDialog = () => {
    setDeleteTipoDialog(false);
    setSelectedTipo(null);
  };

  const activoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const entidadRecaudadoraBodyTemplate = (rowData) => {
    return rowData.entidadRecaudadora?.razonSocial || "-";
  };

  const cuentaContableBodyTemplate = (rowData) => {
    return rowData.cuentaContable
      ? `${rowData.cuentaContable.codigoCuenta} - ${rowData.cuentaContable.nombreCuenta}`
      : "-";
  };

  const periodicidadBodyTemplate = (rowData) => {
    const periodicidades = {
      DIARIO: "Diario",
      SEMANAL: "Semanal",
      QUINCENAL: "Quincenal",
      MENSUAL: "Mensual",
      BIMESTRAL: "Bimestral",
      TRIMESTRAL: "Trimestral",
      CUATRIMESTRAL: "Cuatrimestral",
      SEMESTRAL: "Semestral",
      ANUAL: "Anual",
      UNICO: "Único",
    };
    return periodicidades[rowData.periodicidad] || rowData.periodicidad;
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="p-button-warning"
          onClick={() => editTipo(rowData)}
          disabled={!permisos.puedeEditar}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDeleteTipo(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const headerTemplate = () => {
    const hasFilters = selectedCategoria !== null || globalFilter !== "";
    const clearFilters = () => {
      setSelectedCategoria(null);
      setGlobalFilter("");
    };

    // Obtener categorías únicas de los datos actuales
    const categoriasEnDatos = tipos.reduce((acc, tipo) => {
      if (tipo.categoria && !acc.find(c => c.id === tipo.categoria.id)) {
        acc.push(tipo.categoria);
      }
      return acc;
    }, []);

    // Verificar si hay tipos sin categoría
    const haySinCategoria = tipos.some(tipo => !tipo.categoriaId);

    return (
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>
            Tipos de Deuda Tributaria
          </h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            severity="success"
            onClick={openNew}
            disabled={!permisos.puedeCrear}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Dropdown
            value={selectedCategoria}
            options={[
              { label: "Todas las categorías", value: null },
              ...categoriasEnDatos
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map((cat) => ({
                  label: cat.nombre,
                  value: cat.id,
                })),
              ...(haySinCategoria ? [{ label: "Sin categoría", value: "sin-categoria" }] : []),
            ]}
            onChange={(e) => setSelectedCategoria(e.value)}
            placeholder="Filtrar por categoría"
            showClear
            filter
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              style={{ width: "100%" }}
            />
          </span>
        </div>
        {hasFilters && (
          <div style={{ flex: 1 }}>
            <Button
              icon="pi pi-filter-slash"
              label="Limpiar"
              outlined
              onClick={clearFilters}
              tooltip="Limpiar todos los filtros"
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    );
  };

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteTipoDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteTipoConfirmed}
      />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <DataTable
        value={tiposFiltrados}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron tipos de deuda tributaria"
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 60, 150]}
        size="small"
        stripedRows
        showGridlines
        onRowClick={(e) => editTipo(e.data)}
        selectionMode="single"
        style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
        header={headerTemplate}
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ width: "80px" }}
        />
        <Column
          field="categoria.nombre"
          header="Categoría"
          sortable
          body={(rowData) => rowData.categoria?.nombre || "Sin categoría"}
          style={{ width: "200px" }}
        />
        <Column
          field="nombre"
          header="Nombre"
          sortable
          filter
          filterPlaceholder="Buscar por nombre"
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
        />
        <Column
          header="Entidad Recaudadora"
          body={entidadRecaudadoraBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Cuenta Contable"
          body={cuentaContableBodyTemplate}
          sortable
          style={{ minWidth: "250px" }}
        />
        <Column
          header="Periodicidad"
          body={periodicidadBodyTemplate}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={activoBodyTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "120px" }}
          header="Acciones"
        />
      </DataTable>

      <Dialog
        visible={tipoDialog}
        style={{ width: "800px" }}
        header={
          isEdit
            ? "Editar Tipo de Deuda Tributaria"
            : "Nuevo Tipo de Deuda Tributaria"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <TipoDeudaTributariaForm
          isEdit={isEdit}
          defaultValues={formData}
          onSubmit={saveTipo}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deleteTipoDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteTipoDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedTipo && (
            <span>
              ¿Está seguro de eliminar el tipo de deuda tributaria{" "}
              <b>{selectedTipo.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}