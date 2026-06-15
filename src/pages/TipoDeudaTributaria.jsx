import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import {
  getTiposDeudaTributaria,
  getTipoDeudaTributariaById,
  deleteTipoDeudaTributaria,
} from "../api/tesoreria/tipoDeudaTributaria";
import TipoDeudaTributariaForm from "../components/tipoDeudaTributaria/TipoDeudaTributariaForm";

export default function TipoDeudaTributaria() {
  const [tipos, setTipos] = useState([]);
  const [tipoDialog, setTipoDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const dt = useRef(null);
  const user = useAuthStore((state) => state.user);

  const { canCreate, canEdit, canDelete } = usePermissions(
    "TIPO_DEUDA_TRIBUTARIA"
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getTiposDeudaTributaria();
      setTipos(data);
    } catch (error) {
      console.error("Error al cargar tipos de deuda tributaria:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los tipos de deuda tributaria",
        life: 3000,
      });
    }
    setLoading(false);
  };

  const openNew = () => {
    if (!canCreate) {
      toast.current.show({
        severity: "warn",
        summary: "Sin permisos",
        detail: "No tiene permisos para crear tipos de deuda tributaria",
        life: 3000,
      });
      return;
    }
    setEditing(null);
    setTipoDialog(true);
  };

  const hideDialog = () => {
    setTipoDialog(false);
    setEditing(null);
  };

  const editTipo = async (tipo) => {
    if (!canEdit) {
      toast.current.show({
        severity: "warn",
        summary: "Sin permisos",
        detail: "No tiene permisos para editar tipos de deuda tributaria",
        life: 3000,
      });
      return;
    }
    try {
      const tipoCompleto = await getTipoDeudaTributariaById(tipo.id);
      setEditing(tipoCompleto);
      setTipoDialog(true);
    } catch (error) {
      console.error("Error al cargar tipo de deuda tributaria:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el tipo de deuda tributaria",
        life: 3000,
      });
    }
  };

  const confirmDeleteTipo = (tipo) => {
    if (!canDelete) {
      toast.current.show({
        severity: "warn",
        summary: "Sin permisos",
        detail: "No tiene permisos para eliminar tipos de deuda tributaria",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar el tipo "${tipo.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => deleteTipo(tipo.id),
    });
  };

  const deleteTipo = async (id) => {
    setLoading(true);
    try {
      await deleteTipoDeudaTributaria(id);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de deuda tributaria eliminado",
        life: 3000,
      });
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar tipo de deuda tributaria:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "No se pudo eliminar el tipo de deuda tributaria";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleSave = () => {
    hideDialog();
    cargarDatos();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: editing
        ? "Tipo de deuda tributaria actualizado"
        : "Tipo de deuda tributaria creado",
      life: 3000,
    });
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
          disabled={!canCreate}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button
        label="Exportar"
        icon="pi pi-upload"
        className="p-button-help"
        onClick={() => dt.current.exportCSV()}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => editTipo(rowData)}
          disabled={!canEdit}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeleteTipo(rowData)}
          disabled={!canDelete}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const activoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const entidadBodyTemplate = (rowData) => {
    return rowData.entidadRecaudadora?.nombre || "-";
  };

  const cuentaContableBodyTemplate = (rowData) => {
    return rowData.cuentaContable
      ? `${rowData.cuentaContable.codigo} - ${rowData.cuentaContable.nombre}`
      : "-";
  };

  const periodicidadBodyTemplate = (rowData) => {
    const periodicidades = {
      MENSUAL: "Mensual",
      TRIMESTRAL: "Trimestral",
      SEMESTRAL: "Semestral",
      ANUAL: "Anual",
      UNICO: "Único",
    };
    return periodicidades[rowData.periodicidad] || rowData.periodicidad;
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Tipos de Deuda Tributaria</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    </div>
  );

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDialog}
      />
    </div>
  );

  return (
    <div className="datatable-crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        <DataTable
          ref={dt}
          value={tipos}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
          globalFilter={globalFilter}
          header={header}
          loading={loading}
          emptyMessage="No se encontraron tipos de deuda tributaria"
          responsiveLayout="scroll"
          stripedRows
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "4rem" }}
          />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ minWidth: "15rem" }}
          />
          <Column
            header="Entidad Recaudadora"
            body={entidadBodyTemplate}
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column
            header="Cuenta Contable"
            body={cuentaContableBodyTemplate}
            sortable
            style={{ minWidth: "15rem" }}
          />
          <Column
            header="Periodicidad"
            body={periodicidadBodyTemplate}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="diasVencimiento"
            header="Días Venc."
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            header="Estado"
            body={activoBodyTemplate}
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "8rem" }}
            header="Acciones"
          />
        </DataTable>
      </div>

      <Dialog
        visible={tipoDialog}
        style={{ width: "600px" }}
        header={
          editing
            ? "Editar Tipo de Deuda Tributaria"
            : "Nuevo Tipo de Deuda Tributaria"
        }
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <TipoDeudaTributariaForm
          defaultValues={editing}
          onSave={handleSave}
          onCancel={hideDialog}
          toast={toast}
        />
      </Dialog>
    </div>
  );
}