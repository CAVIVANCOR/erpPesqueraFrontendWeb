// src/pages/SubmodulosSistema.jsx
// Página principal de gestión de submódulos del sistema.
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { getSubmodulos, crearSubmodulo, actualizarSubmodulo, eliminarSubmodulo } from '../api/submoduloSistema';
import { getModulos } from '../api/moduloSistema';
import SubmoduloSistemaForm from '../components/submodulos/SubmoduloSistemaForm';

export default function SubmodulosSistemaPage() {
  const [submodulos, setSubmodulos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarSubmodulos();
    cargarModulos();
  }, []);

  const cargarSubmodulos = async () => {
    setLoading(true);
    try {
      const data = await getSubmodulos();
      setSubmodulos(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los submódulos' });
    } finally {
      setLoading(false);
    }
  };

  const cargarModulos = async () => {
    try {
      const data = await getModulos();
      setModulos(data);
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los módulos' });
    }
  };

  const handleEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm(`¿Seguro que deseas eliminar el submódulo "${row.nombre}"?`)) {
      try {
        await eliminarSubmodulo(row.id);
        toast?.show({ severity: 'success', summary: 'Eliminado', detail: 'Submódulo eliminado correctamente' });
        cargarSubmodulos();
      } catch (err) {
        toast?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.error || 'No se pudo eliminar el submódulo' });
      }
    }
  };

  const handleSubmit = async (data) => {
    // Solo los campos válidos
    const payload = {
      moduloId: data.moduloId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: data.activo
    };
    try {
      if (isEdit && selected) {
        await actualizarSubmodulo(selected.id, payload);
        toast?.show({ severity: 'success', summary: 'Actualizado', detail: 'Submódulo actualizado correctamente' });
      } else {
        await crearSubmodulo(payload);
        toast?.show({ severity: 'success', summary: 'Creado', detail: 'Submódulo creado correctamente' });
      }
      setShowForm(false);
      setSelected(null);
      cargarSubmodulos();
    } catch (err) {
      toast?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.error || 'No se pudo guardar el submódulo' });
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
        <h2>Gestión de Submódulos del Sistema</h2>
        <Button label="Nuevo Submódulo" icon="pi pi-plus" onClick={() => { setIsEdit(false); setSelected(null); setShowForm(true); }} />
      </div>
      <DataTable value={submodulos} loading={loading} paginator rows={10} selectionMode="single" selection={selected} onSelectionChange={e => setSelected(e.value)}>
        <Column field="modulo.nombre" header="Módulo" />
        <Column field="nombre" header="Nombre" />
        <Column field="descripcion" header="Descripción" />
        <Column field="activo" header="Activo" body={row => row.activo ? 'Sí' : 'No'} />
        <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '120px' }} />
      </DataTable>
      <Dialog header={isEdit ? 'Editar Submódulo' : 'Nuevo Submódulo'} visible={showForm} style={{ width: '400px' }} modal onHide={() => setShowForm(false)}>
        <SubmoduloSistemaForm
          initialValues={isEdit && selected ? selected : {}}
          modulosOptions={modulos}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
