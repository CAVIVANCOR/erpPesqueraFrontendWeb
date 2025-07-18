// src/pages/ModulosSistema.jsx
// Página principal de gestión de módulos del sistema.
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { getModulos, crearModulo, actualizarModulo, eliminarModulo } from '../api/moduloSistema';
import ModuloSistemaForm from '../components/modulos/ModuloSistemaForm';
import { Link } from 'react-router-dom'; // Agregado para navegación a SubmodulosSistema.jsx

export default function ModulosSistemaPage() {
  const [modulos, setModulos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Carga inicial de módulos
  useEffect(() => {
    cargarModulos();
  }, []);

  const cargarModulos = async () => {
    setLoading(true);
    try {
      const data = await getModulos();
      setModulos(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los módulos' });
    } finally {
      setLoading(false);
    }
  };

  // Acciones CRUD
  const handleEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm(`¿Seguro que deseas eliminar el módulo "${row.nombre}"?`)) {
      try {
        await eliminarModulo(row.id);
        toast?.show({ severity: 'success', summary: 'Eliminado', detail: 'Módulo eliminado correctamente' });
        cargarModulos();
      } catch (err) {
        toast?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.error || 'No se pudo eliminar el módulo' });
      }
    }
  };

  const handleSubmit = async (data) => {
    try {
        const payload = {
            nombre:data.nombre,
            descripcion:data.descripcion,
            activo: data.activo
        }
      if (isEdit && selected) {
        await actualizarModulo(selected.id, payload);
        toast?.show({ severity: 'success', summary: 'Actualizado', detail: 'Módulo actualizado correctamente' });
      } else {
        await crearModulo(payload);
        toast?.show({ severity: 'success', summary: 'Creado', detail: 'Módulo creado correctamente' });
      }
      setShowForm(false);
      setSelected(null);
      cargarModulos();
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.error || 'No se pudo guardar el módulo' });
    }
  };

  const actionBodyTemplate = (row) => (
    <span>
      <Button icon="pi pi-pencil" className="p-button-text p-mr-2" onClick={() => handleEdit(row)} tooltip="Editar" />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDelete(row)} tooltip="Eliminar" />
    </span>
  );

  return (
    <div className="p-m-4">
      <Toast ref={setToast} />
      <div className="p-d-flex p-jc-between p-ai-center p-mb-3">
        <h2>Gestión de Módulos del Sistema</h2>
        <Button label="Nuevo Módulo" icon="pi pi-plus" onClick={() => { setIsEdit(false); setSelected(null); setShowForm(true); }} />
      </div>
      <DataTable value={modulos} loading={loading} paginator rows={10} selectionMode="single" selection={selected} onSelectionChange={e => setSelected(e.value)}>
        <Column field="nombre" header="Nombre" />
        <Column field="descripcion" header="Descripción" />
        <Column field="activo" header="Activo" body={row => row.activo ? 'Sí' : 'No'} />
        <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '120px' }} />
      </DataTable>
      <Dialog header={isEdit ? 'Editar Módulo' : 'Nuevo Módulo'} visible={showForm} style={{ width: '400px' }} modal onHide={() => setShowForm(false)}>
        <ModuloSistemaForm
          initialValues={isEdit && selected ? selected : {}}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
