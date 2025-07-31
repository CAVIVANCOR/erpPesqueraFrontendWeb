// src/pages/SubfamiliaProducto.jsx
// Pantalla CRUD profesional para SubfamiliaProducto. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import SubfamiliaProductoForm from "../components/subfamiliaProducto/SubfamiliaProductoForm";
import { getSubfamiliasProducto, crearSubfamiliaProducto, actualizarSubfamiliaProducto, eliminarSubfamiliaProducto } from "../api/subfamiliaProducto";
import { getFamiliasProducto } from "../api/familiaProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Subfamilias de Producto.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function SubfamiliaProducto() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [familias, setFamilias] = useState([]);
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
      const [subfamiliasData, familiasData] = await Promise.all([
        getSubfamiliasProducto(),
        getFamiliasProducto()
      ]);
      setItems(subfamiliasData);
      setFamilias(familiasData);
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
      await eliminarSubfamiliaProducto(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Subfamilia de producto eliminada correctamente." });
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
        await actualizarSubfamiliaProducto(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Subfamilia de producto actualizada." });
      } else {
        await crearSubfamiliaProducto(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Subfamilia de producto creada." });
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

  const familiaNombre = (rowData) => {
    const familia = familias.find(f => Number(f.id) === Number(rowData.familiaId));
    return familia ? familia.descripcionBase : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta subfamilia de producto?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Subfamilias de Producto</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" size="small" outlined onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="familiaId" header="Familia" body={familiaNombre} />
        <Column field="descripcionBase" header="Descripción Base" />
        <Column field="descripcionExtendida" header="Descripción Extendida" />
        <Column field="estado" header="Estado" />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Subfamilia de Producto" : "Nueva Subfamilia de Producto"} visible={showDialog} style={{ width: 700 }} onHide={() => setShowDialog(false)} modal>
        <SubfamiliaProductoForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          familias={familias}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
