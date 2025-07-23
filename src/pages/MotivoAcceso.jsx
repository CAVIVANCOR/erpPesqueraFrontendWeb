// src/pages/MotivoAcceso.jsx
// Pantalla CRUD profesional para motivos de acceso a instalaciones
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
import { getAllMotivoAcceso, deleteMotivoAcceso } from '../api/motivoAcceso';
import MotivoAccesoForm from '../components/motivoAcceso/MotivoAccesoForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente MotivoAcceso
 * Pantalla principal para gestión de motivos de acceso a instalaciones
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const MotivoAcceso = () => {
  const [motivosAcceso, setMotivosAcceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [motivoAccesoSeleccionado, setMotivoAccesoSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarMotivosAcceso();
  }, []);

  const cargarMotivosAcceso = async () => {
    try {
      setLoading(true);
      const data = await getAllMotivoAcceso();
      setMotivosAcceso(data);
    } catch (error) {
      console.error('Error al cargar motivos de acceso:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los motivos de acceso'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (motivoAcceso = null) => {
    setMotivoAccesoSeleccionado(motivoAcceso);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setMotivoAccesoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarMotivosAcceso();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: motivoAccesoSeleccionado ? 'Motivo de acceso actualizado correctamente' : 'Motivo de acceso creado correctamente'
    });
  };

  const confirmarEliminacion = (motivoAcceso) => {
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
      message: `¿Está seguro de eliminar el motivo de acceso "${motivoAcceso.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarMotivoAcceso(motivoAcceso.id)
    });
  };

  const eliminarMotivoAcceso = async (id) => {
    try {
      await deleteMotivoAcceso(id);
      await cargarMotivosAcceso();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Motivo de acceso eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar motivo de acceso:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el motivo de acceso'
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
      <h2 className="m-0">Motivos de Acceso</h2>
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
          label="Nuevo Motivo"
          icon="pi pi-plus"
          className="p-button-primary"
          onClick={() => abrirDialogo()}
        />
      </div>
    </div>
  );

  return (
    <div className="motivo-acceso-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={motivosAcceso}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} motivos de acceso"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['nombre', 'descripcion']}
          header={header}
          emptyMessage="No se encontraron motivos de acceso."
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
        header={motivoAccesoSeleccionado ? 'Editar Motivo de Acceso' : 'Nuevo Motivo de Acceso'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <MotivoAccesoForm
          motivoAcceso={motivoAccesoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default MotivoAcceso;
