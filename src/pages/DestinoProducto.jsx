// src/pages/DestinoProducto.jsx
// Pantalla principal para gestión de destinos de producto
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
import { getDestinosProducto, eliminarDestinoProducto } from '../api/destinoProducto';
import { useAuthStore } from '../shared/stores/useAuthStore';
import DestinoProductoForm from '../components/destinoProducto/DestinoProductoForm';

/**
 * Componente DestinoProducto
 * Pantalla principal para gestión de destinos de producto en cotizaciones
 * Incluye listado, creación, edición y eliminación con control de roles
 */
const DestinoProducto = () => {
  const [destinos, setDestinos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDestinos();
  }, []);

  const cargarDestinos = async () => {
    try {
      setLoading(true);
      const data = await getDestinosProducto();
      // Normalizar IDs según regla ERP Megui
      const destinosNormalizados = data.map(destino => ({
        ...destino,
        id: Number(destino.id)
      }));
      setDestinos(destinosNormalizados);
    } catch (error) {
      console.error('Error al cargar destinos de producto:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los destinos de producto'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setDestinoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (destino) => {
    setDestinoSeleccionado(destino);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setDestinoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarDestinos();
  };

  const confirmarEliminacion = (destino) => {
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'Solo los administradores pueden eliminar registros'
      });
      return;
    }

    const confirmar = () => {
      eliminarDestinoProducto(destino.id);
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
        message: `¿Está seguro de eliminar el destino "${destino.nombre}"?`,
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

  const eliminarDestinoProducto = async (id) => {
    try {
      await eliminarDestinoProducto(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Destino de producto eliminado correctamente'
      });
      cargarDestinos();
    } catch (error) {
      console.error('Error al eliminar destino de producto:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el destino de producto'
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
      label="Nuevo Destino de Producto"
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
    <div className="destino-producto-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-900">
          <i className="pi pi-map-marker mr-2 text-primary"></i>
          Gestión de Destinos de Producto
        </h2>

        <Toolbar 
          className="mb-4" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        <DataTable
          value={destinos}
          loading={loading}
          dataKey="id"
          filters={filters}
          globalFilterFields={['nombre', 'descripcion']}
          emptyMessage="No se encontraron destinos de producto"
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
        header={destinoSeleccionado ? 'Editar Destino de Producto' : 'Nuevo Destino de Producto'}
        modal
        onHide={cerrarDialogo}
        className="p-fluid"
      >
        <DestinoProductoForm
          destino={destinoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DestinoProducto;
