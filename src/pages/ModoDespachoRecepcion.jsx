// src/pages/ModoDespachoRecepcion.jsx
// Pantalla principal para gestión de modos de despacho/recepción
// Cumple regla transversal ERP Megui: edición por clic, borrado seguro con roles, ConfirmDialog, Toast
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { getAllModoDespachoRecepcion, deleteModoDespachoRecepcion } from '../api/modoDespachoRecepcion';
import { useAuthStore } from '../shared/stores/useAuthStore';
import ModoDespachoRecepcionForm from '../components/modoDespachoRecepcion/ModoDespachoRecepcionForm';

/**
 * Componente ModoDespachoRecepcion
 * Pantalla principal para gestión de modos de despacho/recepción en cotizaciones
 * Incluye listado, creación, edición y eliminación con control de roles
 */
const ModoDespachoRecepcion = () => {
  const [modos, setModos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [modoSeleccionado, setModoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarModos();
  }, []);

  const cargarModos = async () => {
    try {
      setLoading(true);
      const data = await getAllModoDespachoRecepcion();
      // Normalizar IDs según regla ERP Megui
      const modosNormalizados = data.map(modo => ({
        ...modo,
        id: Number(modo.id)
      }));
      setModos(modosNormalizados);
    } catch (error) {
      console.error('Error al cargar modos de despacho/recepción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los modos de despacho/recepción'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setModoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (modo) => {
    setModoSeleccionado(modo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setModoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarModos();
  };

  const confirmarEliminacion = (modo) => {
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'Solo los administradores pueden eliminar registros'
      });
      return;
    }

    const confirmar = () => {
      eliminarModo(modo.id);
    };

    const rechazar = () => {
      toast.current?.show({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'Eliminación cancelada'
      });
    };

    // ConfirmDialog con estilo profesional
    import('primereact/api').then(({ confirmDialog: showConfirmDialog }) => {
      showConfirmDialog({
        message: `¿Está seguro de eliminar el modo "${modo.nombre}"?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        acceptLabel: 'Sí, Eliminar',
        rejectLabel: 'Cancelar',
        accept: confirmar,
        reject: rechazar
      });
    });
  };

  const eliminarModo = async (id) => {
    try {
      await deleteModoDespachoRecepcion(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Modo de despacho/recepción eliminado correctamente'
      });
      cargarModos();
    } catch (error) {
      console.error('Error al eliminar modo de despacho/recepción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el modo de despacho/recepción'
      });
    }
  };

  // Templates para las columnas
  const activoTemplate = (rowData) => (
    <Tag 
      value={rowData.activo ? 'Activo' : 'Inactivo'} 
      severity={rowData.activo ? 'success' : 'danger'} 
    />
  );

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        onClick={() => abrirDialogoEdicion(rowData)}
        tooltip="Editar"
        tooltipOptions={{ position: 'top' }}
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminacion(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      )}
    </div>
  );

  // Toolbar con botón de nuevo y filtro global
  const leftToolbarTemplate = () => (
    <Button
      label="Nuevo Modo de Despacho/Recepción"
      icon="pi pi-plus"
      className="p-button-primary"
      onClick={abrirDialogoNuevo}
    />
  );

  const rightToolbarTemplate = () => (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-search" />
      <InputText
        type="search"
        placeholder="Buscar..."
        value={globalFilter}
        onChange={(e) => {
          setGlobalFilter(e.target.value);
          setFilters({
            global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
          });
        }}
        className="w-20rem"
      />
    </div>
  );

  return (
    <div className="modo-despacho-recepcion-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-900">
          <i className="pi pi-truck mr-2 text-primary"></i>
          Gestión de Modos de Despacho/Recepción
        </h2>

        <Toolbar 
          className="mb-4" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        <DataTable
          value={modos}
          loading={loading}
          dataKey="id"
          filters={filters}
          globalFilterFields={['nombre', 'descripcion']}
          emptyMessage="No se encontraron modos de despacho/recepción"
          className="p-datatable-sm"
          stripedRows
          showGridlines
          size="small"
          onRowClick={(e) => abrirDialogoEdicion(e.data)}
          rowClassName="cursor-pointer hover:bg-primary-50"
        >
          <Column 
            field="nombre" 
            header="Nombre" 
            sortable 
            className="font-medium"
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="descripcion" 
            header="Descripción" 
            sortable
            style={{ minWidth: '400px' }}
          />
          <Column 
            field="activo" 
            header="Estado" 
            body={activoTemplate}
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ minWidth: '120px', textAlign: 'center' }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '600px' }}
        header={modoSeleccionado ? 'Editar Modo de Despacho/Recepción' : 'Nuevo Modo de Despacho/Recepción'}
        modal
        onHide={cerrarDialogo}
        className="p-fluid"
      >
        <ModoDespachoRecepcionForm
          modo={modoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default ModoDespachoRecepcion;
