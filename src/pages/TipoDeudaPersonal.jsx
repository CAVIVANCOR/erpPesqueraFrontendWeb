// src/pages/TipoDeudaPersonal.jsx
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
import TipoDeudaPersonalForm from "../components/tipoDeudaPersonal/TipoDeudaPersonalForm";
import {
  getTiposDeudaPersonal,
  getTipoDeudaPersonalById,
  createTipoDeudaPersonal,
  updateTipoDeudaPersonal,
  deleteTipoDeudaPersonal,
} from "../api/tesoreria/tipoDeudaPersonal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

export default function TipoDeudaPersonal({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tiposData = await getTiposDeudaPersonal();
      setTipos(tiposData || []);
    } catch (error) {
      console.error("Error al cargar tipos de deuda personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de deuda personal",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

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
      const tipoCompleto = await getTipoDeudaPersonalById(tipo.id);
      setFormData(tipoCompleto);
      setSelectedTipo(tipo);
      setIsEdit(true);
      setTipoDialog(true);
    } catch (error) {
      console.error("Error al cargar tipo de deuda personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipo de deuda personal",
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
        await updateTipoDeudaPersonal(selectedTipo.id, dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de deuda personal actualizado correctamente",
          life: 3000,
        });
      } else {
        await createTipoDeudaPersonal(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de deuda personal creado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar tipo de deuda personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar tipo de deuda personal",
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
      await deleteTipoDeudaPersonal(selectedTipo.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de deuda personal eliminado correctamente",
        life: 3000,
      });

      setDeleteTipoDialog(false);
      setSelectedTipo(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar tipo de deuda personal:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar tipo de deuda personal",
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
      <h2 style={{ fontSize: getResponsiveFontSize() }}>
        Tipos de Deuda Personal
      </h2>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={tipos}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron tipos de deuda personal"
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
        visible={tipoDialog}
        style={{ width: "600px" }}
        header={
          isEdit
            ? "Editar Tipo de Deuda Personal"
            : "Nuevo Tipo de Deuda Personal"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <TipoDeudaPersonalForm
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
              ¿Está seguro de eliminar el tipo de deuda personal{" "}
              <b>{selectedTipo.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}