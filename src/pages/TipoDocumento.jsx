// src/pages/TipoDocumento.jsx
// Página principal de gestión de tipos de documento en el ERP Megui.
// Reutiliza patrones de Usuarios.jsx y documenta en español técnico.

import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import TipoDocumentoForm from '../components/tipoDocumento/TipoDocumentoForm';
import { getTiposDocumento, crearTipoDocumento, actualizarTipoDocumento, eliminarTipoDocumento } from '../api/tipoDocumento';

/**
 * Página de gestión de tipos de documento.
 * Incluye DataTable, alta, edición y eliminación, con feedback visual profesional.
 */
export default function TipoDocumentoPage() {
  const [tipos, setTipos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  // Carga inicial de tipos de documento
  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const data = await getTiposDocumento();
      setTipos(data);
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los tipos de documento' });
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de botones de acción
  const actionBodyTemplate = (rowData) => (
    <>
      <Button icon="pi pi-pencil" className="p-button-text p-mr-2" onClick={() => onEdit(rowData)} />
      <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => onDelete(rowData)} />
    </>
  );

  // Lógica para alta y edición
  const onNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };
  const onEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };
  const onDelete = async (row) => {
    if (!window.confirm('¿Está seguro de eliminar este tipo de documento?')) return;
    setLoading(true);
    try {
      await eliminarTipoDocumento(row.id);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Tipo de documento eliminado' });
      cargarTipos();
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
    } finally {
      setLoading(false);
    }
  };
  const onCancel = () => setShowForm(false);
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit && selected) {
        await actualizarTipoDocumento(selected.id, data);
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Tipo de documento actualizado' });
      } else {
        await crearTipoDocumento(data);
        toast.current?.show({ severity: 'success', summary: 'Registrado', detail: 'Tipo de documento creado' });
      }
      setShowForm(false);
      cargarTipos();
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
        <h2>Tipos de Documento</h2>
        <Button label="Nuevo Tipo" icon="pi pi-plus" onClick={onNew} />
      </div>
      <DataTable value={tipos} loading={loading} paginator rows={10} selectionMode="single" selection={selected} onSelectionChange={e => setSelected(e.value)}>
        <Column field="codigo" header="Código" />
        <Column field="codigoSunat" header="Código Sunat" />
        <Column field="descripcion" header="Descripción" />
        <Column field="activo" header="Activo" body={row => row.activo ? 'Sí' : 'No'} />
        <Column field="createdAt" header="Creado" />
        <Column field="updatedAt" header="Actualizado" />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog header={isEdit ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'} visible={showForm} style={{ width: '35vw', minWidth: 340 }} modal className="p-fluid" onHide={onCancel} closeOnEscape dismissableMask>
        <TipoDocumentoForm
          isEdit={isEdit}
          defaultValues={selected || { activo: true }}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
