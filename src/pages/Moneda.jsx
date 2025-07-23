// src/pages/Moneda.jsx
// Pantalla CRUD profesional para Moneda. Cumple la regla transversal ERP Megui.
// - Edición por clic en fila.
// - Botón eliminar solo visible para superusuario o admin (useAuthStore).
// - ConfirmDialog visual rojo para borrar.
// - Feedback con Toast.
// - Documentación de la regla en el encabezado.

import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import MonedaForm from "../components/moneda/MonedaForm";
import { getMonedas, crearMoneda, actualizarMoneda, eliminarMoneda } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Monedas.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function Moneda() {
  const toast = useRef(null);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore(state => state.usuario);

  useEffect(() => {
    cargarMonedas();
  }, []);

  const cargarMonedas = async () => {
    setLoading(true);
    try {
      const data = await getMonedas();
      setMonedas(data);
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
      await eliminarMoneda(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Moneda eliminada correctamente." });
      cargarMonedas();
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
        await actualizarMoneda(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Moneda actualizada." });
      } else {
        await crearMoneda(data);
        toast.current.show({ severity: "success", summary: "Creada", detail: "Moneda creada." });
      }
      setShowDialog(false);
      setEditing(null);
      cargarMonedas();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo guardar." });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  // Renderiza acciones (editar, eliminar)
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta moneda?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Monedas</h2>
        <Button label="Nueva" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={monedas} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="codigoSunat" header="Código Sunat" />
        <Column field="nombreLargo" header="Nombre Largo" />
        <Column field="simbolo" header="Símbolo" />
        <Column field="activo" header="Activo" body={rowData => rowData.activo ? "Sí" : "No"} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Moneda" : "Nueva Moneda"} visible={showDialog} style={{ width: 500 }} onHide={() => setShowDialog(false)} modal>
        <MonedaForm
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
