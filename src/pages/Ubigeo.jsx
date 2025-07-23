// src/pages/Ubigeo.jsx
// Pantalla CRUD profesional para Ubigeo. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import UbigeoForm from "../components/ubigeo/UbigeoForm";
import { getUbigeos, crearUbigeo, actualizarUbigeo, eliminarUbigeo } from "../api/ubigeo";
import { getPaises } from "../api/pais";
import { getDepartamentos } from "../api/departamento";
import { getProvincias } from "../api/provincia";
import { getDistritos } from "../api/distrito";
import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Pantalla profesional para gestión de Ubigeos.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function Ubigeo() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
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
      const [ubigeosData, paisesData, departamentosData, provinciasData, distritosData] = await Promise.all([
        getUbigeos(),
        getPaises(),
        getDepartamentos(),
        getProvincias(),
        getDistritos()
      ]);
      setItems(ubigeosData);
      setPaises(paisesData);
      setDepartamentos(departamentosData);
      setProvincias(provinciasData);
      setDistritos(distritosData);
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
      await eliminarUbigeo(toDelete.id);
      toast.current.show({ severity: "success", summary: "Eliminado", detail: "Ubigeo eliminado correctamente." });
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
        await actualizarUbigeo(editing.id, data);
        toast.current.show({ severity: "success", summary: "Actualizado", detail: "Ubigeo actualizado." });
      } else {
        await crearUbigeo(data);
        toast.current.show({ severity: "success", summary: "Creado", detail: "Ubigeo creado." });
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

  const paisNombre = (rowData) => {
    const pais = paises.find(p => Number(p.id) === Number(rowData.paisId));
    return pais ? pais.nombre : '';
  };

  const departamentoNombre = (rowData) => {
    const departamento = departamentos.find(d => Number(d.id) === Number(rowData.departamentoId));
    return departamento ? departamento.nombre : '';
  };

  const provinciaNombre = (rowData) => {
    const provincia = provincias.find(p => Number(p.id) === Number(rowData.provinciaId));
    return provincia ? provincia.nombre : '';
  };

  const distritoNombre = (rowData) => {
    const distrito = distritos.find(d => Number(d.id) === Number(rowData.distritoId));
    return distrito ? distrito.nombre : '';
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
      <ConfirmDialog visible={showConfirm} onHide={() => setShowConfirm(false)} message="¿Está seguro que desea eliminar este ubigeo?" header="Confirmar eliminación" icon="pi pi-exclamation-triangle" acceptClassName="p-button-danger" accept={handleDeleteConfirm} reject={() => setShowConfirm(false)} />
      <div className="p-d-flex p-jc-between p-ai-center" style={{ marginBottom: 16 }}>
        <h2>Gestión de Ubigeos</h2>
        <Button label="Nuevo" icon="pi pi-plus" className="p-button-success" onClick={handleAdd} disabled={loading} />
      </div>
      <DataTable value={items} loading={loading} dataKey="id" paginator rows={10} onRowClick={e => handleEdit(e.data)} style={{ cursor: "pointer" }}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="codigo" header="Código" />
        <Column field="paisId" header="País" body={paisNombre} />
        <Column field="departamentoId" header="Departamento" body={departamentoNombre} />
        <Column field="provinciaId" header="Provincia" body={provinciaNombre} />
        <Column field="distritoId" header="Distrito" body={distritoNombre} />
        <Column field="activo" header="Activo" body={rowData => booleanTemplate(rowData, 'activo')} />
        <Column body={actionBody} header="Acciones" style={{ width: 130, textAlign: "center" }} />
      </DataTable>
      <Dialog header={editing ? "Editar Ubigeo" : "Nuevo Ubigeo"} visible={showDialog} style={{ width: 800 }} onHide={() => setShowDialog(false)} modal>
        <UbigeoForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          paises={paises}
          departamentos={departamentos}
          provincias={provincias}
          distritos={distritos}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
