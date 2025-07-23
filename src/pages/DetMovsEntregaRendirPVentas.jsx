// src/pages/DetMovsEntregaRendirPVentas.jsx
// Pantalla CRUD profesional para movimientos de entregas a rendir de ventas
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
import { getAllDetMovsEntregaRendirPVentas, deleteDetMovsEntregaRendirPVentas } from '../api/detMovsEntregaRendirPVentas';
import DetMovsEntregaRendirPVentasForm from '../components/detMovsEntregaRendirPVentas/DetMovsEntregaRendirPVentasForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente DetMovsEntregaRendirPVentas
 * Pantalla principal para gestión de movimientos de entregas a rendir de ventas
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const DetMovsEntregaRendirPVentas = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await getAllDetMovsEntregaRendirPVentas();
      setMovimientos(data);
    } catch (error) {
      console.error('Error al cargar movimientos entrega rendir P-Ventas:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los movimientos de entregas a rendir'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (movimiento = null) => {
    setMovimientoSeleccionado(movimiento);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setMovimientoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarMovimientos();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: movimientoSeleccionado ? 'Movimiento actualizado correctamente' : 'Movimiento creado correctamente'
    });
  };

  const confirmarEliminacion = (movimiento) => {
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
      message: `¿Está seguro de eliminar el movimiento de ${movimiento.tipoMovimiento?.nombre} por S/ ${movimiento.monto}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarMovimiento(movimiento.id)
    });
  };

  const eliminarMovimiento = async (id) => {
    try {
      await deleteDetMovsEntregaRendirPVentas(id);
      await cargarMovimientos();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Movimiento eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el movimiento'
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
  const entregaTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.entregaARendirPVentas?.cotizacionVentas?.numeroDocumento}</div>
        <div className="text-sm text-500">{rowData.entregaARendirPVentas?.cotizacionVentas?.cliente?.razonSocial}</div>
      </div>
    );
  };

  const tipoMovimientoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.tipoMovimiento?.nombre} 
        severity="info"
      />
    );
  };

  const montoTemplate = (rowData) => {
    return (
      <div className="text-right font-semibold">
        S/ {Number(rowData.monto).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  const fechaTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString('es-PE');
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
      <h2 className="m-0">Movimientos de Entregas a Rendir - Ventas</h2>
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
          label="Nuevo Movimiento"
          icon="pi pi-plus"
          className="p-button-primary"
          onClick={() => abrirDialogo()}
        />
      </div>
    </div>
  );

  return (
    <div className="det-movs-entrega-rendir-p-ventas-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={movimientos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['entregaARendirPVentas.cotizacionVentas.numeroDocumento', 'tipoMovimiento.nombre', 'descripcion']}
          header={header}
          emptyMessage="No se encontraron movimientos de entregas a rendir."
          onRowClick={(e) => abrirDialogo(e.data)}
          selectionMode="single"
          scrollable
          scrollHeight="600px"
        >
          <Column
            field="entregaARendirPVentas"
            header="Entrega/Cotización"
            body={entregaTemplate}
            sortable
            style={{ minWidth: '200px' }}
            frozen
          />
          <Column
            field="tipoMovimiento"
            header="Tipo Movimiento"
            body={tipoMovimientoTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="monto"
            header="Monto"
            body={montoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="fechaMovimiento"
            header="Fecha"
            body={fechaTemplate}
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ minWidth: '200px' }}
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
        header={movimientoSeleccionado ? 'Editar Movimiento de Entrega' : 'Nuevo Movimiento de Entrega'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <DetMovsEntregaRendirPVentasForm
          movimiento={movimientoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetMovsEntregaRendirPVentas;
