// src/pages/DetalleMovimientoAlmacen.jsx
// Pantalla CRUD profesional para DetalleMovimientoAlmacen. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import DetalleMovimientoAlmacenForm from "../components/detalleMovimientoAlmacen/DetalleMovimientoAlmacenForm";
import { getDetallesMovimientoAlmacen, crearDetalleMovimientoAlmacen, actualizarDetalleMovimientoAlmacen, eliminarDetalleMovimientoAlmacen } from "../api/detalleMovimientoAlmacen";
import { getMovimientosAlmacen } from "../api/movimientoAlmacen";
import { getEmpresas } from "../api/empresa";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Detalles de Movimiento de Almacén.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function DetalleMovimientoAlmacen() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [movimientosAlmacen, setMovimientosAlmacen] = useState([]);
  const [empresas, setEmpresas] = useState([]);
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
      const [detallesData, movimientosData, empresasData] = await Promise.all([
        getDetallesMovimientoAlmacen(),
        getMovimientosAlmacen(),
        getEmpresas()
      ]);
      setItems(detallesData);
      setMovimientosAlmacen(movimientosData);
      setEmpresas(empresasData);
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
      await eliminarDetalleMovimientoAlmacen(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Detalle eliminado correctamente." });
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
        await actualizarDetalleMovimientoAlmacen(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Detalle actualizado." });
      } else {
        await crearDetalleMovimientoAlmacen(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Detalle creado." });
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

  const movimientoTemplate = (rowData) => {
    const movimiento = movimientosAlmacen.find(m => Number(m.id) === Number(rowData.movimientoAlmacenId));
    return movimiento ? movimiento.numeroDocumento || `ID: ${movimiento.id}` : '';
  };

  const empresaTemplate = (rowData) => {
    const empresa = empresas.find(e => Number(e.id) === Number(rowData.empresaId));
    return empresa ? empresa.razonSocial : '';
  };

  const cantidadTemplate = (rowData) => {
    return rowData.cantidad ? Number(rowData.cantidad).toFixed(2) : '0.00';
  };

  const pesoTemplate = (rowData) => {
    return rowData.pesoNeto ? `${Number(rowData.pesoNeto).toFixed(2)} kg` : '';
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleDateString() : '';
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-blue-600" : "text-gray-600"}>
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este detalle?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Detalles de Movimiento de Almacén</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="movimientoAlmacenId" header="Movimiento" body={movimientoTemplate} />
        <Column field="productoId" header="Producto ID" />
        <Column field="cantidad" header="Cantidad" body={cantidadTemplate} />
        <Column field="pesoNeto" header="Peso Neto" body={pesoTemplate} />
        <Column field="lote" header="Lote" />
        <Column field="fechaProduccion" header="F. Producción" body={rowData => fechaTemplate(rowData, 'fechaProduccion')} />
        <Column field="empresaId" header="Empresa" body={empresaTemplate} />
        <Column field="custodia" header="Custodia" body={rowData => booleanTemplate(rowData, 'custodia')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Detalle" : "Nuevo Detalle"} visible={showDialog} style={{ width: 1000 }} onHide={() => setShowDialog(false)} modal>
        <DetalleMovimientoAlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          movimientosAlmacen={movimientosAlmacen}
          empresas={empresas}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
