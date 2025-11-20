// src/pages/PrecioEntidad.jsx
// Pantalla CRUD profesional para PrecioEntidad. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import PrecioEntidadForm from "../components/precioEntidad/PrecioEntidadForm";
import { getPreciosEntidad, crearPrecioEntidad, actualizarPrecioEntidad, eliminarPrecioEntidad } from "../api/precioEntidad";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Precios de Entidad.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function PrecioEntidad() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [monedas, setMonedas] = useState([]);
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
      const [preciosData, entidadesData, monedasData] = await Promise.all([
        getPreciosEntidad(),
        getEntidadesComerciales(),
        getMonedas()
      ]);
      setItems(preciosData);
      setEntidades(entidadesData);
      setMonedas(monedasData);
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
      await eliminarPrecioEntidad(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Precio eliminado correctamente." });
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
        await actualizarPrecioEntidad(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Precio actualizado." });
      } else {
        await crearPrecioEntidad(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Precio creado." });
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

  const entidadNombre = (rowData) => {
    const entidad = entidades.find(e => Number(e.id) === Number(rowData.entidadComercialId));
    return entidad ? entidad.razonSocial : '';
  };

  const monedaNombre = (rowData) => {
    const moneda = monedas.find(m => Number(m.id) === Number(rowData.monedaId));
    return moneda ? moneda.simbolo : '';
  };

  const productoTemplate = (rowData) => {
    if (rowData.producto) {
      return rowData.producto.descripcionArmada || rowData.producto.descripcionBase || '';
    }
    return rowData.productoId || '';
  };

  const precioTemplate = (rowData) => {
    return Number(rowData.precioUnitario).toFixed(2);
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleDateString() : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este precio?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Precios de Entidad</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="entidadComercialId" header="Entidad" body={entidadNombre} />
        <Column field="productoId" header="Producto ID" />
        <Column field="monedaId" header="Moneda" body={monedaNombre} />
        <Column field="precioUnitario" header="Precio Unitario" body={precioTemplate} />
        <Column field="vigenteDesde" header="Vigente Desde" body={rowData => fechaTemplate(rowData, 'vigenteDesde')} />
        <Column field="vigenteHasta" header="Vigente Hasta" body={rowData => fechaTemplate(rowData, 'vigenteHasta')} />
        <Column field="activo" header="Activo" body={rowData => booleanTemplate(rowData, 'activo')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Precio" : "Nuevo Precio"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <PrecioEntidadForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          entidades={entidades}
          monedas={monedas}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
