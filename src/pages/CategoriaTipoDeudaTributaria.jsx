// src/pages/CategoriaTipoDeudaTributaria.jsx
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
import CategoriaTipoDeudaTributariaForm from "../components/categoriaTipoDeudaTributaria/CategoriaTipoDeudaTributariaForm";
import {
  getCategoriaTipoDeudaTributaria,
  getCategoriaTipoDeudaTributariaById,
  createCategoriaTipoDeudaTributaria,
  updateCategoriaTipoDeudaTributaria,
  deleteCategoriaTipoDeudaTributaria,
} from "../api/tesoreria/categoriaTipoDeudaTributaria";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

export default function CategoriaTipoDeudaTributaria({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [categoriaDialog, setCategoriaDialog] = useState(false);
  const [deleteCategoriaDialog, setDeleteCategoriaDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const categoriasData = await getCategoriaTipoDeudaTributaria();
      setCategorias(categoriasData || []);
    } catch (error) {
      console.error("Error al cargar categorías de tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar categorías de tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setFormData({});
    setSelectedCategoria(null);
    setIsEdit(false);
    setCategoriaDialog(true);
  };

  const hideDialog = () => {
    setCategoriaDialog(false);
    setFormData({});
    setSelectedCategoria(null);
  };

  const editCategoria = async (categoria) => {
    try {
      setLoading(true);
      const categoriaCompleta = await getCategoriaTipoDeudaTributariaById(categoria.id);
      setFormData(categoriaCompleta);
      setSelectedCategoria(categoria);
      setIsEdit(true);
      setCategoriaDialog(true);
    } catch (error) {
      console.error("Error al cargar categoría de tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar categoría de tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCategoria = async (data) => {
    const esEdicion = isEdit && selectedCategoria;

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
        await updateCategoriaTipoDeudaTributaria(selectedCategoria.id, dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Categoría de tipo de deuda tributaria actualizada correctamente",
          life: 3000,
        });
      } else {
        await createCategoriaTipoDeudaTributaria(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Categoría de tipo de deuda tributaria creada correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar categoría de tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar categoría de tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteCategoria = (categoria) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedCategoria(categoria);
    setDeleteCategoriaDialog(true);
  };

  const deleteCategoriaConfirmed = async () => {
    try {
      setLoading(true);
      await deleteCategoriaTipoDeudaTributaria(selectedCategoria.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Categoría de tipo de deuda tributaria eliminada correctamente",
        life: 3000,
      });

      setDeleteCategoriaDialog(false);
      setSelectedCategoria(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar categoría de tipo de deuda tributaria:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar categoría de tipo de deuda tributaria",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteCategoriaDialog = () => {
    setDeleteCategoriaDialog(false);
    setSelectedCategoria(null);
  };

  const activoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="p-button-warning"
          onClick={() => editCategoria(rowData)}
          disabled={!permisos.puedeEditar}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDeleteCategoria(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
          disabled={!permisos.puedeCrear}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
          style={{ width: "300px" }}
        />
      </span>
    );
  };

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteCategoriaDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteCategoriaConfirmed}
      />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <h2 style={{ fontSize: getResponsiveFontSize() }}>
        Categorías de Tipo de Deuda Tributaria
      </h2>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={categorias}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron categorías de tipo de deuda tributaria"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        size="small"
        stripedRows
        showGridlines
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ width: "80px" }}
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
        visible={categoriaDialog}
        style={{ width: "600px" }}
        header={
          isEdit
            ? "Editar Categoría de Tipo de Deuda Tributaria"
            : "Nueva Categoría de Tipo de Deuda Tributaria"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <CategoriaTipoDeudaTributariaForm
          isEdit={isEdit}
          defaultValues={formData}
          onSubmit={saveCategoria}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deleteCategoriaDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteCategoriaDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedCategoria && (
            <span>
              ¿Está seguro de eliminar la categoría de tipo de deuda tributaria{" "}
              <b>{selectedCategoria.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}