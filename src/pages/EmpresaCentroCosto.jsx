// src/pages/EmpresaCentroCosto.jsx
// Pantalla CRUD profesional para EmpresaCentroCosto. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import EmpresaCentroCostoForm from "../components/empresaCentroCosto/EmpresaCentroCostoForm";
import { getAllEmpresaCentroCosto, createEmpresaCentroCosto, updateEmpresaCentroCosto, deleteEmpresaCentroCosto } from "../api/empresaCentroCosto";
import { getEmpresas } from "../api/empresa";
import { getCentrosCosto } from "../api/centroCosto";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de relación Empresa-Centro de Costo.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function EmpresaCentroCosto() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
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
      const [itemsData, empresasData, centrosData] = await Promise.all([
        getAllEmpresaCentroCosto(),
        getEmpresas(),
        getCentrosCosto()
      ]);
      setItems(itemsData);
      setEmpresas(empresasData);
      setCentrosCosto(centrosData);
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
      await deleteEmpresaCentroCosto(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Relación eliminada correctamente." });
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
        await updateEmpresaCentroCosto(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Relación actualizada." });
      } else {
        await createEmpresaCentroCosto(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Relación creada." });
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

  const empresaNombre = (rowData) => {
    const empresa = empresas.find(e => Number(e.id) === Number(rowData.EmpresaID));
    return empresa ? empresa.nombre : '';
  };

  const centroCostoNombre = (rowData) => {
    const centro = centrosCosto.find(c => Number(c.id) === Number(rowData.CentroCostoID));
    return centro ? centro.Nombre : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta relación?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Empresa-Centro de Costo</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="EmpresaID" header="Empresa" body={empresaNombre} />
        <Column field="CentroCostoID" header="Centro de Costo" body={centroCostoNombre} />
        <Column field="ResponsableID" header="Responsable ID" />
        <Column field="ProveedorExternoID" header="Proveedor Externo ID" />
        <Column field="Activo" header="Activo" body={rowData => rowData.Activo ? "Sí" : "No"} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Relación" : "Nueva Relación"} visible={showDialog} style={{ width: 700 }} onHide={() => setShowDialog(false)} modal>
        <EmpresaCentroCostoForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          centrosCosto={centrosCosto}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
