// src/pages/TipoPersona.jsx
// Pantalla CRUD profesional para tipos de persona para accesos
// Cumple regla transversal ERP Megui: edición por clic, borrado seguro con roles, ConfirmDialog, Toast
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { getAllTipoPersona, deleteTipoPersona } from '../api/tipoPersona';
import TipoPersonaForm from '../components/tipoPersona/TipoPersonaForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente TipoPersona
 * Pantalla principal para gestión de tipos de persona para accesos
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const TipoPersona = () => {
  const [tiposPersona, setTiposPersona] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoPersonaSeleccionado, setTipoPersonaSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTiposPersona();
  }, []);

  const cargarTiposPersona = async () => {
    try {
      setLoading(true);
      const data = await getAllTipoPersona();
      setTiposPersona(data);
    } catch (error) {
      console.error('Error al cargar tipos de persona:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los tipos de persona'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (tipoPersona = null) => {
    setTipoPersonaSeleccionado(tipoPersona);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoPersonaSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarTiposPersona();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: tipoPersonaSeleccionado ? 'Tipo de persona actualizado correctamente' : 'Tipo de persona creado correctamente'
    });
  };

  const confirmarEliminacion = (tipoPersona) => {
    // Verificar permisos según regla transversal ERP Megui
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'Solo los administradores pueden eliminar registros'
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar el tipo de persona "${tipoPersona.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarTipoPersona(tipoPersona.id)
    });
  };

  const eliminarTipoPersona = async (id) => {
    try {
      await deleteTipoPersona(id);
      await cargarTiposPersona();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de persona eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar tipo de persona:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el tipo de persona'
      });
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Templates para columnas
  const estadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.activo ? 'ACTIVO' : 'INACTIVO'} 
        severity={rowData.activo ? 'success' : 'danger'}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => abrirDialogo(rowData)}
          tooltip="Editar"
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h2 className="m-0">Tipos de Persona</h2>
      <div className="flex gap-2 mt-3 md:mt-0">
        <span className="block mt-2 md:mt-0 p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
            className="w-full sm:w-auto"
          />
        </span>
        <Button
          label="Nuevo Tipo"
          icon="pi pi-plus"
          className="p-button-primary"
          onClick={() => abrirDialogo()}
        />
      </div>
    </div>
  );

  return (
    <div className="tipo-persona-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={tiposPersona}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de persona"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['nombre', 'descripcion']}
          header={header}
          emptyMessage="No se encontraron tipos de persona."
          onRowClick={(e) => abrirDialogo(e.data)}
          selectionMode="single"
        >
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ minWidth: '300px' }}
          />
          <Column
            field="activo"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            body={accionesTemplate}
            header="Acciones"
            style={{ minWidth: '120px', maxWidth: '120px' }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '90vw', maxWidth: '600px' }}
        header={tipoPersonaSeleccionado ? 'Editar Tipo de Persona' : 'Nuevo Tipo de Persona'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <TipoPersonaForm
          tipoPersona={tipoPersonaSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default TipoPersona;
