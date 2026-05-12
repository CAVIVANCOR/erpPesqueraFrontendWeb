// src/pages/TipoMovimientoActivoFijo.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import TipoMovimientoActivoFijoForm from "../components/tipoMovimientoActivoFijo/TipoMovimientoActivoFijoForm";
import {
  getTiposMovimientoActivoFijo,
  eliminarTipoMovimientoActivoFijo,
} from "../api/tipoMovimientoActivoFijo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

export default function TipoMovimientoActivoFijo({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getTiposMovimientoActivoFijo();
      setItems(data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de movimiento de activo fijo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
  };

  const onDelete = (rowData) => {
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
      message: `¿Está seguro de eliminar el tipo "${rowData.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: () => confirmarEliminacion(rowData.id),
    });
  };

  const confirmarEliminacion = async (id) => {
    try {
      await eliminarTipoMovimientoActivoFijo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo eliminado correctamente",
        life: 3000,
      });
      await cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar el tipo",
        life: 3000,
      });
    }
  };

  const onSave = async () => {
    setShowDialog(false);
    await cargarDatos();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: isEdit
        ? "Tipo actualizado correctamente"
        : "Tipo creado correctamente",
      life: 3000,
    });
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  const descripcionTemplate = (rowData) => {
    if (!rowData.descripcion) {
      return <span className="text-500">-</span>;
    }
    const texto =
      rowData.descripcion.length > 80
        ? `${rowData.descripcion.substring(0, 80)}...`
        : rowData.descripcion;
    return (
      <span title={rowData.descripcion} className="text-sm">
        {texto}
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => onEdit(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => onDelete(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Tipos de Movimiento de Activo Fijo</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            className="w-full"
          />
        </span>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={onNew}
          disabled={!permisos.puedeCrear}
          tooltip={
            !permisos.puedeCrear
              ? "No tiene permisos para crear"
              : "Nuevo Tipo de Movimiento"
          }
        />
      </div>
    </div>
  );

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={items}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
          globalFilter={globalFilter}
          emptyMessage="No se encontraron tipos de movimiento"
          header={header}
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar
              ? (e) => onEdit(e.data)
              : undefined
          }
          scrollable
          scrollHeight="600px"
          style={{
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            body={descripcionTemplate}
            sortable
            style={{ minWidth: "300px" }}
          />
          <Column
            field="activo"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            body={actionBodyTemplate}
            header="Acciones"
            frozen
            alignFrozen="right"
            style={{ minWidth: "120px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: "90vw", maxWidth: "600px" }}
        header={
          isEdit
            ? "Editar Tipo de Movimiento de Activo Fijo"
            : "Nuevo Tipo de Movimiento de Activo Fijo"
        }
        modal
        className="p-fluid"
        onHide={onCancel}
        maximizable
      >
        <TipoMovimientoActivoFijoForm
          tipo={selected}
          onSave={onSave}
          onCancel={onCancel}
          permisos={permisos}
          readOnly={!!selected && !!selected.id && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}