// src/pages/ContactoEntidad.jsx
// Pantalla CRUD profesional para ContactoEntidad. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ContactoEntidadForm from "../components/contactoEntidad/ContactoEntidadForm";
import { getContactosEntidad, crearContactoEntidad, actualizarContactoEntidad, eliminarContactoEntidad } from "../api/contactoEntidad";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";

/**
 * Pantalla profesional para gestión de Contactos de Entidad.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function ContactoEntidad({ ruta }) {
  const { user } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }
  const toast = useRef(null);
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [items, setItems] = useState([]);
  const [entidades, setEntidades] = useState([]);
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
      const [contactosData, entidadesData] = await Promise.all([
        getContactosEntidad(),
        getEntidadesComerciales()
      ]);
      setItems(contactosData);
      setEntidades(entidadesData);
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
      await eliminarContactoEntidad(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Contacto eliminado correctamente." });
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
        await actualizarContactoEntidad(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Contacto actualizado." });
      } else {
        await crearContactoEntidad(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Contacto creado." });
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este contacto?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Contactos de Entidad</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading || !permisos.puedeCrear} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="entidadComercialId" header="Entidad" body={entidadNombre} />
        <Column field="nombres" header="Nombres" />
        <Column field="telefono" header="Teléfono" />
        <Column field="correoCorportivo" header="Email Corporativo" />
        <Column field="compras" header="Compras" body={rowData => booleanTemplate(rowData, 'compras')} />
        <Column field="ventas" header="Ventas" body={rowData => booleanTemplate(rowData, 'ventas')} />
        <Column field="representanteLegal" header="Rep. Legal" body={rowData => booleanTemplate(rowData, 'representanteLegal')} />
        <Column field="activo" header="Activo" body={rowData => booleanTemplate(rowData, 'activo')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Contacto" : "Nuevo Contacto"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <ContactoEntidadForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          entidades={entidades}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
}
