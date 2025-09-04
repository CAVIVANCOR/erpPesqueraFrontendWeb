// src/pages/DescargaFaenaPesca.jsx
// Pantalla CRUD profesional para DescargaFaenaPesca. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import DescargaFaenaPescaForm from "../components/descargaFaenaPesca/DescargaFaenaPescaForm";
import { getAllDescargaFaenaPesca, crearDescargaFaenaPesca, actualizarDescargaFaenaPesca, eliminarDescargaFaenaPesca } from "../api/descargaFaenaPesca";
import { getFaenasPesca } from "../api/faenaPesca";
import { getPuertosPesca } from "../api/puertoPesca";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Descarga de Faena Pesca.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function DescargaFaenaPesca() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [puertos, setPuertos] = useState([]);
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
      const [descargasData, faenasData, puertosData] = await Promise.all([
        getAllDescargaFaenaPesca(),
        getFaenasPesca(),
        getPuertosPesca()
      ]);
      setItems(descargasData);
      setFaenas(faenasData);
      setPuertos(puertosData);
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
      await eliminarDescargaFaenaPesca(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Descarga eliminada correctamente." });
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
        await actualizarDescargaFaenaPesca(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Descarga actualizada." });
      } else {
        await crearDescargaFaenaPesca(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Descarga creada." });
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
    const faena = faenas.find(f => Number(f.id) === Number(rowData.faenaPescaId));
    return faena ? `Faena ${faena.id}` : '';
  };

  const puertoNombre = (rowData) => {
    const puerto = puertos.find(p => Number(p.id) === Number(rowData.puertoDescargaId));
    return puerto ? puerto.nombre : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta descarga?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Descarga de Faena Pesca</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="faenaPescaId" header="Faena" body={faenaNombre} />
        <Column field="puertoDescargaId" header="Puerto" body={puertoNombre} />
        <Column field="fechaHoraArriboPuerto" header="Arribo" body={rowData => new Date(rowData.fechaHoraArriboPuerto).toLocaleString()} />
        <Column field="fechaDescarga" header="Fecha Descarga" body={rowData => new Date(rowData.fechaDescarga).toLocaleDateString()} />
        <Column field="numPlataformaDescarga" header="Plataforma" />
        <Column field="combustibleAbastecidoGalones" header="Combustible (Gal)" />
        <Column field="observaciones" header="Observaciones" />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Descarga" : "Nueva Descarga"} visible={showDialog} style={{ width: 900 }} onHide={() => setShowDialog(false)} modal>
        <DescargaFaenaPescaForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          faenas={faenas}
          puertos={puertos}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
