// src/pages/TipoAccesoInstalacion.jsx
// Pantalla CRUD profesional para tipos de acceso a instalaciones
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
import { getAllTipoAccesoInstalacion, deleteTipoAccesoInstalacion } from '../api/tipoAccesoInstalacion';
import TipoAccesoInstalacionForm from '../components/tipoAccesoInstalacion/TipoAccesoInstalacionForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente TipoAccesoInstalacion
 * Pantalla principal para gestión de tipos de acceso a instalaciones
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const TipoAccesoInstalacion = () => {
  const [tiposAcceso, setTiposAcceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoAccesoSeleccionado, setTipoAccesoSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTiposAcceso();
  }, []);

  const cargarTiposAcceso = async () => {
    try {
      setLoading(true);
      const data = await getAllTipoAccesoInstalacion();
      setTiposAcceso(data);
    } catch (error) {
      console.error('Error al cargar tipos de acceso instalación:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los tipos de acceso a instalaciones'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (tipoAcceso = null) => {
    setTipoAccesoSeleccionado(tipoAcceso);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoAccesoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarTiposAcceso();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: tipoAccesoSeleccionado ? 'Tipo de acceso actualizado correctamente' : 'Tipo de acceso creado correctamente'
    });
  };

  const confirmarEliminacion = (tipoAcceso) => {
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
      message: `¿Está seguro de eliminar el tipo de acceso "${tipoAcceso.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarTipoAcceso(tipoAcceso.id)
    });
  };

  const eliminarTipoAcceso = async (id) => {
    try {
      await deleteTipoAccesoInstalacion(id);
      await cargarTiposAcceso();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de acceso eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar tipo de acceso:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el tipo de acceso'
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
      <h2 className="m-0">Tipos de Acceso a Instalaciones</h2>
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
    <div className="tipo-acceso-instalacion-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={tiposAcceso}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de acceso"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['nombre', 'descripcion']}
          header={header}
          emptyMessage="No se encontraron tipos de acceso a instalaciones."
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
        header={tipoAccesoSeleccionado ? 'Editar Tipo de Acceso' : 'Nuevo Tipo de Acceso'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <TipoAccesoInstalacionForm
          tipoAcceso={tipoAccesoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default TipoAccesoInstalacion;
