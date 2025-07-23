// src/pages/TipoEstadoProducto.jsx
// Pantalla principal para gestión de tipos de estado de producto
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
import { getAllTipoEstadoProducto, deleteTipoEstadoProducto } from '../api/tipoEstadoProducto';
import { useAuthStore } from '../shared/stores/useAuthStore';
import TipoEstadoProductoForm from '../components/tipoEstadoProducto/TipoEstadoProductoForm';

/**
 * Componente TipoEstadoProducto
 * Pantalla principal para gestión de tipos de estado de producto en cotizaciones
 * Incluye listado, creación, edición y eliminación con control de roles
 */
const TipoEstadoProducto = () => {
  const [tiposEstado, setTiposEstado] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTiposEstado();
  }, []);

  const cargarTiposEstado = async () => {
    try {
      setLoading(true);
      const data = await getAllTipoEstadoProducto();
      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map(tipo => ({
        ...tipo,
        id: Number(tipo.id)
      }));
      setTiposEstado(tiposNormalizados);
    } catch (error) {
      console.error('Error al cargar tipos de estado de producto:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los tipos de estado de producto'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipo) => {
    setTipoSeleccionado(tipo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarTiposEstado();
  };

  const confirmarEliminacion = (tipo) => {
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'Solo los administradores pueden eliminar registros'
      });
      return;
    }

    const confirmar = () => {
      eliminarTipo(tipo.id);
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
        message: `¿Está seguro de eliminar el tipo de estado "${tipo.nombre}"?`,
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

  const eliminarTipo = async (id) => {
    try {
      await deleteTipoEstadoProducto(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de estado de producto eliminado correctamente'
      });
      cargarTiposEstado();
    } catch (error) {
      console.error('Error al eliminar tipo de estado de producto:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el tipo de estado de producto'
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

  const paraComprasTemplate = (rowData) => (
    <Tag 
      value={rowData.paraCompras ? 'Sí' : 'No'} 
      severity={rowData.paraCompras ? 'info' : 'secondary'} 
    />
  );

  const paraVentasTemplate = (rowData) => (
    <Tag 
      value={rowData.paraVentas ? 'Sí' : 'No'} 
      severity={rowData.paraVentas ? 'success' : 'secondary'} 
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
      label="Nuevo Estado de Producto"
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
    <div className="tipo-estado-producto-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-900">
          <i className="pi pi-flag mr-2 text-primary"></i>
          Gestión de Estados de Producto
        </h2>

        <Toolbar 
          className="mb-4" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        <DataTable
          value={tiposEstado}
          loading={loading}
          dataKey="id"
          filters={filters}
          globalFilterFields={['nombre', 'descripcion']}
          emptyMessage="No se encontraron tipos de estado de producto"
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
            style={{ minWidth: '300px' }}
          />
          <Column 
            field="activo" 
            header="Estado" 
            body={activoTemplate}
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column 
            field="paraCompras" 
            header="Para Compras" 
            body={paraComprasTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="paraVentas" 
            header="Para Ventas" 
            body={paraVentasTemplate}
            sortable
            style={{ minWidth: '120px' }}
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
        header={tipoSeleccionado ? 'Editar Estado de Producto' : 'Nuevo Estado de Producto'}
        modal
        onHide={cerrarDialogo}
        className="p-fluid"
      >
        <TipoEstadoProductoForm
          tipo={tipoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default TipoEstadoProducto;
