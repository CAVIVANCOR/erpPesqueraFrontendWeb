// src/pages/AccesoInstalacion.jsx
// Pantalla CRUD profesional para AccesoInstalacion. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import AccesoInstalacionForm from "../components/accesoInstalacion/AccesoInstalacionForm";
import { getAllAccesoInstalacion, crearAccesoInstalacion, actualizarAccesoInstalacion, eliminarAccesoInstalacion } from "../api/accesoInstalacion";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Accesos a Instalaciones.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function AccesoInstalacion() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore(state => state.usuario);

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllAccesoInstalacion();
      setItems(data);
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

  const confirmDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarAccesoInstalacion(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Registro eliminado correctamente." });
      cargarItems();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo eliminar el registro." });
    }
    setLoading(false);
    setShowConfirm(false);
    setToDelete(null);
  };

  const handleSave = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarAccesoInstalacion(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Registro actualizado." });
      } else {
        await crearAccesoInstalacion(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Registro creado." });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo guardar el registro." });
    }
    setLoading(false);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaAcceso) return '';
    return new Date(rowData.fechaAcceso).toLocaleDateString('es-ES');
  };

  const horaBodyTemplate = (rowData) => {
    if (!rowData.horaAcceso) return '';
    return rowData.horaAcceso;
  };

  const estadoBodyTemplate = (rowData) => {
    return (
      <span className={`p-tag ${rowData.activo ? 'p-tag-success' : 'p-tag-danger'}`}>
        {rowData.activo ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Accesos a Instalaciones</h2>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => {
            setEditing(null);
            setShowDialog(true);
          }}
        />
      </div>

      <DataTable
        value={items}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="p-datatable-gridlines"
        showGridlines
        size="small"
        emptyMessage="No se encontraron registros"
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: 'pointer' }}
        scrollable
        scrollHeight="600px"
      >
        <Column field="id" header="ID" sortable style={{ width: '80px' }} />
        <Column field="persona.nombres" header="Persona" sortable />
        <Column field="tipoAcceso.descripcion" header="Tipo Acceso" sortable />
        <Column field="fechaAcceso" header="Fecha" sortable body={fechaBodyTemplate} />
        <Column field="horaAcceso" header="Hora" sortable body={horaBodyTemplate} />
        <Column field="motivoAcceso.descripcion" header="Motivo" sortable />
        <Column field="observaciones" header="Observaciones" sortable />
        <Column field="activo" header="Estado" sortable body={estadoBodyTemplate} />
        <Column body={actionBodyTemplate} header="Acciones" style={{ width: '120px' }} />
      </DataTable>

      <Dialog
        visible={showDialog}
        style={{ width: '800px' }}
        header={editing ? "Editar Acceso a Instalación" : "Nuevo Acceso a Instalación"}
        modal
        className="p-fluid"
        onHide={() => {
          setShowDialog(false);
          setEditing(null);
        }}
      >
        <AccesoInstalacionForm
          item={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowDialog(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro de que desea eliminar este registro?"
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmDelete}
        reject={() => {
          setShowConfirm(false);
          setToDelete(null);
        }}
        acceptClassName="p-button-danger"
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
      />
    </div>
  );
}
