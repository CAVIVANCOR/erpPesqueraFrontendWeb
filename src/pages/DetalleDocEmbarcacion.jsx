// src/pages/DetalleDocEmbarcacion.jsx
// Pantalla CRUD profesional para DetalleDocEmbarcacion. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import DetalleDocEmbarcacionForm from "../components/detalleDocEmbarcacion/DetalleDocEmbarcacionForm";
import { getAllDetalleDocEmbarcacion, createDetalleDocEmbarcacion, updateDetalleDocEmbarcacion, deleteDetalleDocEmbarcacion } from "../api/detalleDocEmbarcacion";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Detalle de Documentos de Embarcación.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function DetalleDocEmbarcacion() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore(state => state.usuario);

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllDetalleDocEmbarcacion();
      setItems(data);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo cargar la lista." });
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
      await deleteDetalleDocEmbarcacion(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Registro eliminado correctamente." });
      cargarItems();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo eliminar." });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await updateDetalleDocEmbarcacion(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Registro actualizado." });
      } else {
        await createDetalleDocEmbarcacion(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Registro creado." });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo guardar." });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const actionBody = (rowData) => (
    <>
      <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => handleEdit(rowData)} aria-label="Editar" />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(rowData)} aria-label="Eliminar" />
      )}
    </>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este registro?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Detalle de Documentos de Embarcación</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="faenaPescaId" header="Faena Pesca" />
        <Column field="documentoPescaId" header="Documento Pesca" />
        <Column field="numeroDocumento" header="Número Documento" />
        <Column field="fechaEmision" header="Fecha Emisión" body={rowData => rowData.fechaEmision ? new Date(rowData.fechaEmision).toLocaleDateString() : ''} />
        <Column field="fechaVencimiento" header="Fecha Vencimiento" body={rowData => rowData.fechaVencimiento ? new Date(rowData.fechaVencimiento).toLocaleDateString() : ''} />
        <Column field="urlDocEmbarcacio" header="URL Documento" />
        <Column field="observaciones" header="Observaciones" />
        <Column field="verificado" header="Verificado" body={rowData => rowData.verificado ? "Sí" : "No"} />
        <Column field="createdAt" header="Creado" body={rowData => new Date(rowData.createdAt).toLocaleDateString()} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Detalle Documento" : "Nuevo Detalle Documento"} visible={showDialog} style={{ width: 700 }} onHide={() => setShowDialog(false)} modal>
        <DetalleDocEmbarcacionForm
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
