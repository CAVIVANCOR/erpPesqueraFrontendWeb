// src/pages/LiquidacionFaenaPesca.jsx
// Pantalla CRUD profesional para LiquidacionFaenaPesca. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import LiquidacionFaenaPescaForm from "../components/liquidacionFaenaPesca/LiquidacionFaenaPescaForm";
import { getAllLiquidacionesFaenaPesca, crearLiquidacionFaenaPesca, actualizarLiquidacionFaenaPesca, eliminarLiquidacionFaenaPesca } from "../api/liquidacionFaenaPesca";
import { getFaenasPesca } from "../api/faenaPesca";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Liquidación de Faena Pesca.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function LiquidacionFaenaPesca() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [faenas, setFaenas] = useState([]);
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
      const [liquidacionesData, faenasData] = await Promise.all([
        getAllLiquidacionesFaenaPesca(),
        getFaenasPesca()
      ]);
      setItems(liquidacionesData);
      setFaenas(faenasData);
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
      await eliminarLiquidacionFaenaPesca(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Liquidación eliminada correctamente." });
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
        await actualizarLiquidacionFaenaPesca(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Liquidación actualizada." });
      } else {
        await crearLiquidacionFaenaPesca(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Liquidación creada." });
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

  const faenaNombre = (rowData) => {
    const faena = faenas.find(f => Number(f.id) === Number(rowData.faena_pesca_id));
    return faena ? `Faena ${faena.id}` : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta liquidación?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Liquidación de Faena Pesca</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="faena_pesca_id" header="Faena" body={faenaNombre} />
        <Column field="temporada_pesca_id" header="Temporada" />
        <Column field="fecha_liquidacion" header="Fecha Liquidación" body={rowData => new Date(rowData.fecha_liquidacion).toLocaleDateString()} />
        <Column field="responsable_id" header="Responsable" />
        <Column field="saldo_inicial" header="Saldo Inicial" />
        <Column field="saldo_final" header="Saldo Final" />
        <Column field="fechaVerificacion" header="Verificación" body={rowData => rowData.fechaVerificacion ? new Date(rowData.fechaVerificacion).toLocaleDateString() : ''} />
        <Column field="observaciones" header="Observaciones" />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Liquidación" : "Nueva Liquidación"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <LiquidacionFaenaPescaForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          faenas={faenas}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
