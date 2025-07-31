// src/pages/LineaCreditoEntidad.jsx
// Pantalla CRUD profesional para LineaCreditoEntidad. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import LineaCreditoEntidadForm from "../components/lineaCreditoEntidad/LineaCreditoEntidadForm";
import { getLineasCreditoEntidad, crearLineaCreditoEntidad, actualizarLineaCreditoEntidad, eliminarLineaCreditoEntidad } from "../api/lineaCreditoEntidad";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Líneas de Crédito de Entidad.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function LineaCreditoEntidad() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
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
      const [lineasData, entidadesData, monedasData] = await Promise.all([
        getLineasCreditoEntidad(),
        getEntidadesComerciales(),
        getMonedas()
      ]);
      setItems(lineasData);
      setEntidadesComerciales(entidadesData);
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
      await eliminarLineaCreditoEntidad(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Línea de crédito eliminada correctamente." });
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
        await actualizarLineaCreditoEntidad(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Línea de crédito actualizada." });
      } else {
        await crearLineaCreditoEntidad(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Línea de crédito creada." });
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
    const entidad = entidadesComerciales.find(e => Number(e.id) === Number(rowData.entidadComercialId));
    return entidad ? entidad.razonSocial : '';
  };

  const monedaNombre = (rowData) => {
    const moneda = monedas.find(m => Number(m.id) === Number(rowData.monedaId));
    return moneda ? moneda.nombre : '';
  };

  const montoTemplate = (rowData) => {
    return rowData.montoMaximo ? Number(rowData.montoMaximo).toFixed(2) : '0.00';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta línea de crédito?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Líneas de Crédito</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="entidadComercialId" header="Entidad" body={entidadNombre} />
        <Column field="montoMaximo" header="Monto Máximo" body={montoTemplate} />
        <Column field="monedaId" header="Moneda" body={monedaNombre} />
        <Column field="diasCredito" header="Días Crédito" />
        <Column field="vigenteDesde" header="Vigente Desde" body={rowData => fechaTemplate(rowData, 'vigenteDesde')} />
        <Column field="vigenteHasta" header="Vigente Hasta" body={rowData => fechaTemplate(rowData, 'vigenteHasta')} />
        <Column field="activo" header="Activo" body={rowData => booleanTemplate(rowData, 'activo')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Línea de Crédito" : "Nueva Línea de Crédito"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <LineaCreditoEntidadForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
