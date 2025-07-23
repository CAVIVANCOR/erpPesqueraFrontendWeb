// src/pages/EntidadComercial.jsx
// Pantalla CRUD profesional para EntidadComercial. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import EntidadComercialForm from "../components/entidadComercial/EntidadComercialForm";
import { getEntidadesComerciales, crearEntidadComercial, actualizarEntidadComercial, eliminarEntidadComercial } from "../api/entidadComercial";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getTiposEntidad } from "../api/tipoEntidad";
import { getFormasPago } from "../api/formaPago";
import { getAgrupacionesEntidad } from "../api/agrupacionEntidad";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Entidades Comerciales.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function EntidadComercial() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposEntidad, setTiposEntidad] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [agrupaciones, setAgrupaciones] = useState([]);
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
      const [entidadesData, empresasData, tiposDocData, tiposEntData, formasPagoData, agrupacionesData] = await Promise.all([
        getEntidadesComerciales(),
        getEmpresas(),
        getTiposDocumento(),
        getTiposEntidad(),
        getFormasPago(),
        getAgrupacionesEntidad()
      ]);
      setItems(entidadesData);
      setEmpresas(empresasData);
      setTiposDocumento(tiposDocData);
      setTiposEntidad(tiposEntData);
      setFormasPago(formasPagoData);
      setAgrupaciones(agrupacionesData);
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
      await eliminarEntidadComercial(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Entidad comercial eliminada correctamente." });
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
        await actualizarEntidadComercial(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Entidad comercial actualizada." });
      } else {
        await crearEntidadComercial(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Entidad comercial creada." });
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
    const empresa = empresas.find(e => Number(e.id) === Number(rowData.empresaId));
    return empresa ? empresa.nombre : '';
  };

  const tipoDocNombre = (rowData) => {
    const tipoDoc = tiposDocumento.find(t => Number(t.id) === Number(rowData.tipoDocumentoId));
    return tipoDoc ? tipoDoc.nombre : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar esta entidad comercial?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Entidades Comerciales</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />
        <Column field="tipoDocumentoId" header="Tipo Doc" body={tipoDocNombre} />
        <Column field="numeroDocumento" header="Nro. Documento" />
        <Column field="razonSocial" header="Razón Social" />
        <Column field="nombreComercial" header="Nombre Comercial" />
        <Column field="esCliente" header="Cliente" body={rowData => booleanTemplate(rowData, 'esCliente')} />
        <Column field="esProveedor" header="Proveedor" body={rowData => booleanTemplate(rowData, 'esProveedor')} />
        <Column field="estado" header="Estado" body={rowData => booleanTemplate(rowData, 'estado')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Entidad Comercial" : "Nueva Entidad Comercial"} visible={showDialog} style={{ width: 1000 }} onHide={() => setShowDialog(false)} modal>
        <EntidadComercialForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          tiposEntidad={tiposEntidad}
          formasPago={formasPago}
          agrupaciones={agrupaciones}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
