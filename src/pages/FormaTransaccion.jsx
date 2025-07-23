// src/pages/FormaTransaccion.jsx
// Pantalla principal para gestión de formas de transacción
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
import { getAllFormaTransaccion, deleteFormaTransaccion } from '../api/formaTransaccion';
import { useAuthStore } from '../shared/stores/useAuthStore';
import FormaTransaccionForm from '../components/formaTransaccion/FormaTransaccionForm';

/**
 * Componente FormaTransaccion
 * Pantalla principal para gestión de formas de transacción en cotizaciones
 * Incluye listado, creación, edición y eliminación con control de roles
 */
const FormaTransaccion = () => {
  const [formas, setFormas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [formaSeleccionada, setFormaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarFormas();
  }, []);

  const cargarFormas = async () => {
    try {
      setLoading(true);
      const data = await getAllFormaTransaccion();
      // Normalizar IDs según regla ERP Megui
      const formasNormalizadas = data.map(forma => ({
        ...forma,
        id: Number(forma.id)
      }));
      setFormas(formasNormalizadas);
    } catch (error) {
      console.error('Error al cargar formas de transacción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar las formas de transacción'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setFormaSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (forma) => {
    setFormaSeleccionada(forma);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setFormaSeleccionada(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarFormas();
  };

  const confirmarEliminacion = (forma) => {
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin permisos',
        detail: 'Solo los administradores pueden eliminar registros'
      });
      return;
    }

    const confirmar = () => {
      eliminarForma(forma.id);
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
        message: `¿Está seguro de eliminar la forma de transacción "${forma.nombre}"?`,
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

  const eliminarForma = async (id) => {
    try {
      await deleteFormaTransaccion(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Forma de transacción eliminada correctamente'
      });
      cargarFormas();
    } catch (error) {
      console.error('Error al eliminar forma de transacción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar la forma de transacción'
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
      label="Nueva Forma de Transacción"
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
    <div className="forma-transaccion-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-900">
          <i className="pi pi-credit-card mr-2 text-primary"></i>
          Gestión de Formas de Transacción
        </h2>

        <Toolbar 
          className="mb-4" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        <DataTable
          value={formas}
          loading={loading}
          dataKey="id"
          filters={filters}
          globalFilterFields={['nombre', 'descripcion']}
          emptyMessage="No se encontraron formas de transacción"
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
        header={formaSeleccionada ? 'Editar Forma de Transacción' : 'Nueva Forma de Transacción'}
        modal
        onHide={cerrarDialogo}
        className="p-fluid"
      >
        <FormaTransaccionForm
          forma={formaSeleccionada}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default FormaTransaccion;
