// src/pages/MovLiquidacionFaenaPesca.jsx
// Pantalla CRUD profesional para MovLiquidacionFaenaPesca. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import MovLiquidacionFaenaPescaForm from "../components/movLiquidacionFaenaPesca/MovLiquidacionFaenaPescaForm";
import { getAllMovLiquidacionFaenaPesca, crearMovLiquidacionFaenaPesca, actualizarMovLiquidacionFaenaPesca, deleteMovLiquidacionFaenaPesca } from "../api/movLiquidacionFaenaPesca";
import { getAllLiquidacionesFaenaPesca } from "../api/liquidacionFaenaPesca";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Movimientos de Liquidación de Faena Pesca.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function MovLiquidacionFaenaPesca() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
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
      const [movimientosData, liquidacionesData] = await Promise.all([
        getAllMovLiquidacionFaenaPesca(),
        getAllLiquidacionesFaenaPesca()
      ]);
      setItems(movimientosData);
      setLiquidaciones(liquidacionesData);
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
      await deleteMovLiquidacionFaenaPesca(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Movimiento eliminado correctamente." });
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
        await actualizarMovLiquidacionFaenaPesca(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Movimiento actualizado." });
      } else {
        await crearMovLiquidacionFaenaPesca(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Movimiento creado." });
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

  const liquidacionNombre = (rowData) => {
    const liquidacion = liquidaciones.find(l => Number(l.id) === Number(rowData.liquidacionFaenaId));
    return liquidacion ? `Liquidación ${liquidacion.id}` : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este movimiento?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Movimientos de Liquidación de Faena</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="liquidacionFaenaId" header="Liquidación" body={liquidacionNombre} />
        <Column field="refDetMovsEntregaRendirId" header="Ref Det Movs" />
        <Column field="tipoMovimientoId" header="Tipo Movimiento" />
        <Column field="monto" header="Monto" />
        <Column field="centroCostoId" header="Centro Costo" />
        <Column field="fechaMovimiento" header="Fecha Movimiento" body={rowData => new Date(rowData.fechaMovimiento).toLocaleDateString()} />
        <Column field="fechaRegistro" header="Fecha Registro" body={rowData => new Date(rowData.fechaRegistro).toLocaleDateString()} />
        <Column field="observaciones" header="Observaciones" />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Movimiento" : "Nuevo Movimiento"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <MovLiquidacionFaenaPescaForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          liquidaciones={liquidaciones}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
