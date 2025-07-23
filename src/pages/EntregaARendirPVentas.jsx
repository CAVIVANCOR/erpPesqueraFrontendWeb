// src/pages/EntregaARendirPVentas.jsx
// Pantalla CRUD profesional para entregas a rendir de ventas
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
import { getAllEntregaARendirPVentas, deleteEntregaARendirPVentas } from '../api/entregaARendirPVentas';
import EntregaARendirPVentasForm from '../components/entregaARendirPVentas/EntregaARendirPVentasForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente EntregaARendirPVentas
 * Pantalla principal para gestión de entregas a rendir de ventas
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const EntregaARendirPVentas = () => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarEntregas();
  }, []);

  const cargarEntregas = async () => {
    try {
      setLoading(true);
      const data = await getAllEntregaARendirPVentas();
      setEntregas(data);
    } catch (error) {
      console.error('Error al cargar entregas a rendir P-Ventas:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar las entregas a rendir'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (entrega = null) => {
    setEntregaSeleccionada(entrega);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEntregaSeleccionada(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarEntregas();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: entregaSeleccionada ? 'Entrega actualizada correctamente' : 'Entrega creada correctamente'
    });
  };

  const confirmarEliminacion = (entrega) => {
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
      message: `¿Está seguro de eliminar la entrega a rendir de la cotización ${entrega.cotizacionVentas?.numeroDocumento}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarEntrega(entrega.id)
    });
  };

  const eliminarEntrega = async (id) => {
    try {
      await deleteEntregaARendirPVentas(id);
      await cargarEntregas();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Entrega eliminada correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar entrega:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar la entrega'
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
  const cotizacionTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.cotizacionVentas?.numeroDocumento}</div>
        <div className="text-sm text-500">{rowData.cotizacionVentas?.cliente?.razonSocial}</div>
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.entregaLiquidada ? 'LIQUIDADA' : 'PENDIENTE'} 
        severity={rowData.entregaLiquidada ? 'success' : 'warning'}
      />
    );
  };

  const fechaTemplate = (rowData) => {
    return new Date(rowData.fechaCreacion).toLocaleDateString('es-PE');
  };

  const fechaLiquidacionTemplate = (rowData) => {
    return rowData.fechaLiquidacion 
      ? new Date(rowData.fechaLiquidacion).toLocaleDateString('es-PE')
      : '-';
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
      <h2 className="m-0">Entregas a Rendir - Ventas</h2>
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
          label="Nueva Entrega"
          icon="pi pi-plus"
          className="p-button-primary"
          onClick={() => abrirDialogo()}
        />
      </div>
    </div>
  );

  return (
    <div className="entrega-a-rendir-p-ventas-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={entregas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entregas"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['cotizacionVentas.numeroDocumento', 'cotizacionVentas.cliente.razonSocial']}
          header={header}
          emptyMessage="No se encontraron entregas a rendir."
          onRowClick={(e) => abrirDialogo(e.data)}
          selectionMode="single"
        >
          <Column
            field="cotizacionVentas"
            header="Cotización"
            body={cotizacionTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="entregaLiquidada"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="fechaCreacion"
            header="Fecha Creación"
            body={fechaTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="fechaLiquidacion"
            header="Fecha Liquidación"
            body={fechaLiquidacionTemplate}
            sortable
            style={{ minWidth: '140px' }}
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
        style={{ width: '90vw', maxWidth: '800px' }}
        header={entregaSeleccionada ? 'Editar Entrega a Rendir' : 'Nueva Entrega a Rendir'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <EntregaARendirPVentasForm
          entrega={entregaSeleccionada}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default EntregaARendirPVentas;
