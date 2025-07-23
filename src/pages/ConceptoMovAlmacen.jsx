// src/pages/ConceptoMovAlmacen.jsx
// Pantalla CRUD profesional para ConceptoMovAlmacen. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ConceptoMovAlmacenForm from "../components/conceptoMovAlmacen/ConceptoMovAlmacenForm";
import { getConceptosMovAlmacen, crearConceptoMovAlmacen, actualizarConceptoMovAlmacen, eliminarConceptoMovAlmacen } from "../api/conceptoMovAlmacen";
import { getTiposConcepto } from "../api/tipoConcepto";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Conceptos de Movimiento de Almacén.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function ConceptoMovAlmacen() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [tiposConcepto, setTiposConcepto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore(state => state.usuario);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [conceptosData, tiposData] = await Promise.all([
        getConceptosMovAlmacen(),
        getTiposConcepto()
      ]);
      setItems(conceptosData);
      setTiposConcepto(tiposData);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo cargar los datos." });
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
      await eliminarConceptoMovAlmacen(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Concepto de movimiento eliminado correctamente." });
      cargarDatos();
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
        await actualizarConceptoMovAlmacen(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Concepto de movimiento actualizado." });
      } else {
        await crearConceptoMovAlmacen(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Concepto de movimiento creado." });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo guardar." });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const tipoConceptoNombre = (rowData) => {
    const tipo = tiposConcepto.find(t => Number(t.id) === Number(rowData.tipoConceptoId));
    return tipo ? tipo.nombre : '';
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-green-600" : "text-red-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este concepto de movimiento?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Conceptos de Movimiento de Almacén</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="tipoConceptoId" header="Tipo Concepto" body={tipoConceptoNombre} />
        <Column field="nombre" header="Nombre" />
        <Column field="descripcion" header="Descripción" />
        <Column field="activo" header="Activo" body={rowData => booleanTemplate(rowData, 'activo')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Concepto de Movimiento" : "Nuevo Concepto de Movimiento"} visible={showDialog} style={{ width: 700 }} onHide={() => setShowDialog(false)} modal>
        <ConceptoMovAlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          tiposConcepto={tiposConcepto}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
