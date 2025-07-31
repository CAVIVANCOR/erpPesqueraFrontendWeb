// src/pages/Activo.jsx
// Pantalla CRUD profesional para Activo. Cumple la regla transversal ERP Megui.
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
import ActivoForm from "../components/activo/ActivoForm";
import { getActivos, crearActivo, actualizarActivo, eliminarActivo } from "../api/activo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getEmpresas } from "../api/empresa";
import { getTiposActivo } from "../api/tipoActivo";

/**
 * Pantalla profesional para gestión de Activos.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function Activo() {
  const toast = useRef(null);
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore(state => state.usuario);
  const [empresaOptions, setEmpresaOptions] = useState([]);
  const [tiposOptions, setTiposOptions] = useState([]);

  // Cargar combos y lista
  useEffect(() => {
    cargarActivos();
    getEmpresas().then(setEmpresaOptions);
    getTiposActivo().then(setTiposOptions);
  }, []);

  const cargarActivos = async () => {
    setLoading(true);
    try {
      const data = await getActivos();
      setActivos(data);
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
      await eliminarActivo(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Activo eliminado correctamente." });
      cargarActivos();
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
        await actualizarActivo(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Activo actualizado." });
      } else {
        await crearActivo(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Activo creado." });
      }
      setShowDialog(false);
      setEditing(null);
      cargarActivos();
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este activo?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Activos</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={activos} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column field="empresaId" header="Empresa" body={rowData => empresaOptions.find(opt => opt.id === rowData.empresaId)?.nombre || rowData.empresaId} />
        <Column field="tipoId" header="Tipo de Activo" body={rowData => tiposOptions.find(opt => opt.id === rowData.tipoId)?.nombre || rowData.tipoId} />
        <Column field="cesado" header="Cesado" body={rowData => rowData.cesado ? "Sí" : "No"} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Activo" : "Nuevo Activo"} visible={showDialog} style={{ width: 500 }} onHide={() => setShowDialog(false)} modal>
        <ActivoForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          empresaOptions={empresaOptions}
          tiposOptions={tiposOptions}
        />
      </Dialog>
    </div>
  );
}
