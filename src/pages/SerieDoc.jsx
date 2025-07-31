// src/pages/SerieDoc.jsx
// Pantalla CRUD profesional para SerieDoc. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import SerieDocForm from "../components/serieDoc/SerieDocForm";
import { getSeriesDoc, crearSerieDoc, actualizarSerieDoc, eliminarSerieDoc } from "../api/serieDoc";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getTiposAlmacen } from "../api/tipoAlmacen";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Series de Documento.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function SerieDoc() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposAlmacen, setTiposAlmacen] = useState([]);
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
      const [seriesData, tiposDocData, tiposAlmData] = await Promise.all([
        getSeriesDoc(),
        getTiposDocumento(),
        getTiposAlmacen()
      ]);
      setItems(seriesData);
      setTiposDocumento(tiposDocData);
      setTiposAlmacen(tiposAlmData);
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
      await eliminarSerieDoc(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Serie de documento eliminada correctamente." });
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
        await actualizarSerieDoc(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Serie de documento actualizada." });
      } else {
        await crearSerieDoc(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Serie de documento creada." });
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

  const tipoDocumentoNombre = (rowData) => {
    const tipo = tiposDocumento.find(t => Number(t.id) === Number(rowData.tipoDocumentoId));
    return tipo ? tipo.nombre : '';
  };

  const tipoAlmacenNombre = (rowData) => {
    const tipo = tiposAlmacen.find(t => Number(t.id) === Number(rowData.tipoAlmacenId));
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta serie de documento?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Series de Documento</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="tipoDocumentoId" header="Tipo Documento" body={tipoDocumentoNombre} />
        <Column field="tipoAlmacenId" header="Tipo Almacén" body={tipoAlmacenNombre} />
        <Column field="serie" header="Serie" />
        <Column field="correlativo" header="Correlativo" />
        <Column field="numCerosIzqCorre" header="Ceros Correlativo" />
        <Column field="numCerosIzqSerie" header="Ceros Serie" />
        <Column field="activo" header="Activo" body={rowData => booleanTemplate(rowData, 'activo')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Serie de Documento" : "Nueva Serie de Documento"} visible={showDialog} style={{ width: 700 }} onHide={() => setShowDialog(false)} modal>
        <SerieDocForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          tiposDocumento={tiposDocumento}
          tiposAlmacen={tiposAlmacen}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
