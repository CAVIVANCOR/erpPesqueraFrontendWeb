// src/pages/RegimenLaboral.jsx
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
import RegimenLaboralForm from "../components/regimenLaboral/RegimenLaboralForm";
import {
  getRegimenesLaborales,
  getRegimenLaboralById,
  createRegimenLaboral,
  updateRegimenLaboral,
  deleteRegimenLaboral,
} from "../api/recursosHumanos/regimenLaboral";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import { mensajeDeError } from "../utils/mensajeError";

export default function RegimenLaboral({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [regimenes, setRegimenes] = useState([]);
  const [regimenSeleccionado, setRegimenSeleccionado] = useState(null);
  const [regimenDialog, setRegimenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: mensajeDeError(error, accionFallida),
      life: 5000,
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setRegimenes((await getRegimenesLaborales()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los regímenes laborales");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setFormData({});
    setRegimenSeleccionado(null);
    setIsEdit(false);
    setRegimenDialog(true);
  };

  const hideDialog = () => {
    setRegimenDialog(false);
    setFormData({});
    setRegimenSeleccionado(null);
  };

  const editRegimen = async (regimen) => {
    try {
      setLoading(true);
      setFormData(await getRegimenLaboralById(regimen.id));
      setRegimenSeleccionado(regimen);
      setIsEdit(true);
      setRegimenDialog(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar el régimen laboral");
    } finally {
      setLoading(false);
    }
  };

  const saveRegimen = async (data) => {
    const esEdicion = isEdit && regimenSeleccionado;

    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para editar", life: 3000 });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para crear", life: 3000 });
      return;
    }

    try {
      setLoading(true);
      const personalId = usuario?.personalId ? Number(usuario.personalId) : null;
      const dataConAuditoria = {
        ...data,
        creadoPor: esEdicion ? undefined : personalId,
        actualizadoPor: esEdicion ? personalId : undefined,
      };

      if (esEdicion) {
        await updateRegimenLaboral(regimenSeleccionado.id, dataConAuditoria);
      } else {
        await createRegimenLaboral(dataConAuditoria);
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Régimen laboral actualizado correctamente" : "Régimen laboral creado correctamente",
        life: 3000,
      });
      hideDialog();
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el régimen laboral");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (regimen) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para eliminar", life: 3000 });
      return;
    }
    setRegimenSeleccionado(regimen);
    setDeleteDialog(true);
  };

  const deleteConfirmed = async () => {
    try {
      setLoading(true);
      await deleteRegimenLaboral(regimenSeleccionado.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Régimen laboral eliminado correctamente", life: 3000 });
      setDeleteDialog(false);
      setRegimenSeleccionado(null);
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo eliminar el régimen laboral");
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteDialog = () => {
    setDeleteDialog(false);
    setRegimenSeleccionado(null);
  };

  const remypeBodyTemplate = (rowData) => (
    <Tag value={rowData.requiereRemype ? "SÍ" : "NO"} severity={rowData.requiereRemype ? "warning" : "secondary"} />
  );

  const activoBodyTemplate = (rowData) => (
    <Tag value={rowData.activo ? "ACTIVO" : "INACTIVO"} severity={rowData.activo ? "success" : "danger"} />
  );

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="p-button-warning"
        onClick={() => editRegimen(rowData)}
        disabled={!permisos.puedeEditar}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => confirmDelete(rowData)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const leftToolbarTemplate = () => (
    <div className="flex flex-wrap gap-2">
      <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} disabled={!permisos.puedeCrear} />
    </div>
  );

  const rightToolbarTemplate = () => (
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

  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteConfirmed} />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <h2 style={{ fontSize: getResponsiveFontSize() }}>Regímenes Laborales</h2>

      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <DataTable
        value={regimenes}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron regímenes laborales"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        size="small"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column field="codigoSunat" header="Código SUNAT" sortable style={{ width: "140px" }} />
        <Column field="descripcion" header="Descripción" sortable filter filterPlaceholder="Buscar por descripción" />
        <Column field="requiereRemype" header="Requiere REMYPE" body={remypeBodyTemplate} sortable style={{ width: "160px" }} />
        <Column field="activo" header="Estado" body={activoBodyTemplate} sortable style={{ width: "120px" }} />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: "120px" }} header="Acciones" />
      </DataTable>

      <Dialog
        visible={regimenDialog}
        style={{ width: "600px" }}
        header={isEdit ? "Editar Régimen Laboral" : "Nuevo Régimen Laboral"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <RegimenLaboralForm
          isEdit={isEdit}
          defaultValues={formData}
          onSubmit={saveRegimen}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {regimenSeleccionado && (
            <span>
              ¿Está seguro de eliminar el régimen laboral <b>{regimenSeleccionado.descripcion}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
