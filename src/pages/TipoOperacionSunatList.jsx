import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import TipoOperacionSunatForm from "../components/tipoOperacionSunat/TipoOperacionSunatForm";
import {
  getTiposOperacionSunat,
  getTipoOperacionSunatById,
  createTipoOperacionSunat,
  updateTipoOperacionSunat,
  deleteTipoOperacionSunat,
} from "../api/facturacionElectronica/tipoOperacionSunat";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

export default function TipoOperacionSunatList({ ruta }) {
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
      const tiposData = await getTiposOperacionSunat();
      setTipos(tiposData || []);
    } catch (error) {
      console.error("Error al cargar tipos de operacion SUNAT:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de operacion SUNAT",
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
      const tipoCompleto = await getTipoOperacionSunatById(tipo.id);
      setFormData(tipoCompleto);
      setSelectedTipo(tipo);
      setIsEdit(true);
      setTipoDialog(true);
    } catch (error) {
      console.error("Error al cargar tipo de operacion SUNAT:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipo de operacion SUNAT",
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

      if (esEdicion) {
        await updateTipoOperacionSunat(selectedTipo.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Exito",
          detail: "Tipo de operacion SUNAT actualizado correctamente",
          life: 3000,
        });
      } else {
        await createTipoOperacionSunat(data);
        toast.current?.show({
          severity: "success",
          summary: "Exito",
          detail: "Tipo de operacion SUNAT creado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar tipo de operacion SUNAT:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar tipo de operacion SUNAT",
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
      await deleteTipoOperacionSunat(selectedTipo.id);

      toast.current?.show({
        severity: "success",
        summary: "Exito",
        detail: "Tipo de operacion SUNAT eliminado correctamente",
        life: 3000,
      });

      setDeleteTipoDialog(false);
      setSelectedTipo(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar tipo de operacion SUNAT:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar tipo de operacion SUNAT",
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

  const codigoBodyTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.codigo}</span>;
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
          <h2>Tipos de Operacion SUNAT</h2>
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
        label="Si"
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
        value={tipos}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron tipos de operacion SUNAT"
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 150]}
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
          field="codigo"
          header="Codigo"
          body={codigoBodyTemplate}
          sortable
          filter
          filterPlaceholder="Buscar por codigo"
          style={{ width: "120px" }}
        />
        <Column
          field="descripcion"
          header="Descripcion"
          sortable
          filter
          filterPlaceholder="Buscar por descripcion"
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
            ? "Editar Tipo de Operacion SUNAT"
            : "Nuevo Tipo de Operacion SUNAT"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <TipoOperacionSunatForm
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
              Esta seguro de eliminar el tipo de operacion SUNAT{" "}
              <b>{selectedTipo.descripcion}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}