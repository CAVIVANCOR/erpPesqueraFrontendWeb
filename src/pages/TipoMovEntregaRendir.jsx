// src/pages/TipoMovEntregaRendir.jsx
// Pantalla CRUD profesional para TipoMovEntregaRendir. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import TipoMovEntregaRendirForm from "../components/tipoMovEntregaRendir/TipoMovEntregaRendirForm";
import {
  getAllTipoMovEntregaRendir,
  crearTipoMovEntregaRendir,
  actualizarTipoMovEntregaRendir,
  deleteTipoMovEntregaRendir,
} from "../api/tipoMovEntregaRendir";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

export default function TipoMovEntregaRendir() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllTipoMovEntregaRendir();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await deleteTipoMovEntregaRendir(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarTipoMovEntregaRendir(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearTipoMovEntregaRendir(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  const esIngresoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esIngreso ? "INGRESO" : "EGRESO"}
        severity={rowData.esIngreso ? "success" : "danger"}
        icon={rowData.esIngreso ? "pi pi-arrow-down" : "pi pi-arrow-up"}
      />
    );
  };

  const esTransferenciaBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esTransferencia ? "SÍ" : "NO"}
        severity={rowData.esTransferencia ? "info" : "secondary"}
        icon={rowData.esTransferencia ? "pi pi-arrows-h" : "pi pi-times"}
      />
    );
  };

  const activoBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
        icon={rowData.activo ? "pi pi-check-circle" : "pi pi-times-circle"}
      />
    );
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este registro?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={items}
        loading={loading}
        showGridlines
        stripedRows
        dataKey="id"
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Tipos Movimiento"
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        size="small"
        header={
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>Tipos de Movimiento Caja</h2>
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                severity="success"
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }}  sortable/>
        <Column field="nombre" header="Nombre" sortable/>
        <Column field="descripcion" header="Descripción" sortable/>
        <Column
          field="esIngreso"
          header="Tipo"
          body={esIngresoBodyTemplate}
          style={{ width: 130, textAlign: "center" }}
          sortable
        />
        <Column
          field="esTransferencia"
          header="Transferencia"
          body={esTransferenciaBodyTemplate}
          style={{ width: 150, textAlign: "center" }}
          sortable
        />
        <Column
          field="activo"
          header="Estado"
          body={activoBodyTemplate}
          style={{ width: 120, textAlign: "center" }}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Tipo Movimiento" : "Nuevo Tipo Movimiento"}
        visible={showDialog}
        style={{ width: 800 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <TipoMovEntregaRendirForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
