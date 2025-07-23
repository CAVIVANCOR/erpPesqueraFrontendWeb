// src/pages/EstadoMultiFuncion.jsx
// Gestión profesional de EstadoMultiFuncion. CRUD completo con patrón ERP Megui.
import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useAuthStore } from '../shared/stores/useAuthStore';
import EstadoMultiFuncionForm from '../components/estadoMultiFuncion/EstadoMultiFuncionForm';
import { getEstadosMultiFuncion, crearEstadoMultiFuncion, actualizarEstadoMultiFuncion, eliminarEstadoMultiFuncion } from '../api/estadoMultiFuncion';

/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function EstadoMultiFuncionPage() {
  const usuario = useAuthStore(state => state.usuario);
  const [estados, setEstados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const [confirmState, setConfirmState] = useState({ visible: false, row: null });

  useEffect(() => { cargarEstados(); }, []);
  const cargarEstados = async () => {
    setLoading(true);
    try {
      const data = await getEstadosMultiFuncion();
      setEstados(data);
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los estados' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };
  const onRowClick = (e) => { handleEdit(e.data); };

  const handleDelete = (row) => { setConfirmState({ visible: true, row }); };
  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarEstadoMultiFuncion(row.id);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Estado eliminado correctamente' });
      cargarEstados();
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
    } finally {
      setLoading(false);
    }
  };

  const actionBodyTemplate = (row) => (
    <span>
      <Button icon="pi pi-pencil" className="p-button-text p-mr-2" onClick={e => { e.stopPropagation(); handleEdit(row); }} tooltip="Editar" />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={e => { e.stopPropagation(); handleDelete(row); }} tooltip="Eliminar" />
      )}
    </span>
  );

  const onNew = () => { setSelected(null); setIsEdit(false); setShowForm(true); };
  const onCancel = () => setShowForm(false);
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion
      };
      if (isEdit && selected) {
        await actualizarEstadoMultiFuncion(selected.id, payload);
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Estado actualizado' });
      } else {
        await crearEstadoMultiFuncion(payload);
        toast.current?.show({ severity: 'success', summary: 'Registrado', detail: 'Estado creado' });
      }
      setShowForm(false);
      cargarEstados();
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <div className="p-d-flex p-jc-between p-ai-center p-mb-3">
        <h2>Estados Multifunción</h2>
        <Button label="Nuevo Estado" icon="pi pi-plus" onClick={onNew} />
      </div>
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={<span style={{ color: '#b71c1c', fontWeight: 600 }}>
          ¿Está seguro que desea <span style={{ color: '#b71c1c' }}>eliminar</span> el estado <b>{confirmState.row ? confirmState.row.nombre : ''}</b>?<br/>
          <span style={{ fontWeight: 400, color: '#b71c1c' }}>Esta acción no se puede deshacer.</span>
        </span>}
        header={<span style={{ color: '#b71c1c' }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable value={estados} loading={loading} paginator rows={10} selectionMode="single" selection={selected} onSelectionChange={e => setSelected(e.value)} onRowClick={onRowClick}>
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="nombre" header="Nombre" />
        <Column field="descripcion" header="Descripción" />
        <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: 120 }} />
      </DataTable>
      <Dialog header={isEdit ? 'Editar Estado' : 'Nuevo Estado'} visible={showForm} style={{ width: 400 }} modal onHide={onCancel}>
        <EstadoMultiFuncionForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
