// src/pages/VehiculoEntidad.jsx
// Pantalla CRUD profesional para VehiculoEntidad. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import VehiculoEntidadForm from "../components/vehiculoEntidad/VehiculoEntidadForm";
import { getVehiculosEntidad, crearVehiculoEntidad, actualizarVehiculoEntidad, eliminarVehiculoEntidad } from "../api/vehiculoEntidad";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getTiposVehiculo } from "../api/tipoVehiculo";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Vehículos de Entidad.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function VehiculoEntidad() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
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
      const [vehiculosData, entidadesData, tiposData] = await Promise.all([
        getVehiculosEntidad(),
        getEntidadesComerciales(),
        getTiposVehiculo()
      ]);
      setItems(vehiculosData);
      setEntidadesComerciales(entidadesData);
      setTiposVehiculo(tiposData);
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
      await eliminarVehiculoEntidad(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Vehículo eliminado correctamente." });
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
        await actualizarVehiculoEntidad(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Vehículo actualizado." });
      } else {
        await crearVehiculoEntidad(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Vehículo creado." });
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

  const tipoVehiculoNombre = (rowData) => {
    const tipo = tiposVehiculo.find(t => Number(t.id) === Number(rowData.tipoVehiculoId));
    return tipo ? tipo.nombre : '';
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-red-600" : "text-green-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

  const capacidadTemplate = (rowData) => {
    return rowData.capacidadTon ? `${Number(rowData.capacidadTon).toFixed(2)} Ton` : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este vehículo?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Vehículos de Entidad</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="placa" header="Placa" />
        <Column field="entidadComercialId" header="Entidad" body={entidadNombre} />
        <Column field="tipoVehiculoId" header="Tipo" body={tipoVehiculoNombre} />
        <Column field="marca" header="Marca" />
        <Column field="modelo" header="Modelo" />
        <Column field="anio" header="Año" />
        <Column field="capacidadTon" header="Capacidad" body={capacidadTemplate} />
        <Column field="cesado" header="Cesado" body={rowData => booleanTemplate(rowData, 'cesado')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Vehículo" : "Nuevo Vehículo"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <VehiculoEntidadForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          entidadesComerciales={entidadesComerciales}
          tiposVehiculo={tiposVehiculo}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
