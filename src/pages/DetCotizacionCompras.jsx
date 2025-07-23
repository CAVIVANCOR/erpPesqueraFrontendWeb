// src/pages/DetCotizacionCompras.jsx
// Pantalla CRUD profesional para detalles de cotizaciones de compras
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
import { getAllDetalleCotizacionCompras, eliminarDetalleCotizacionCompras } from '../api/detCotizacionCompras';
import DetCotizacionComprasForm from '../components/detCotizacionCompras/DetCotizacionComprasForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente DetCotizacionCompras
 * Pantalla principal para gestión de detalles de cotizaciones de compras
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const DetCotizacionCompras = () => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDetalles();
  }, []);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getAllDetalleCotizacionCompras();
      setDetalles(data);
    } catch (error) {
      console.error('Error al cargar detalles de cotizaciones de compras:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los detalles de cotizaciones de compras'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (detalle = null) => {
    setDetalleSeleccionado(detalle);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setDetalleSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarDetalles();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: detalleSeleccionado ? 'Detalle actualizado correctamente' : 'Detalle creado correctamente'
    });
  };

  const confirmarEliminacion = (detalle) => {
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
      message: `¿Está seguro de eliminar el detalle del producto ${detalle.producto?.nombre}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDetalle(detalle.id)
    });
  };

  const eliminarDetalle = async (id) => {
    try {
      await eliminarDetalleCotizacionCompras(id);
      await cargarDetalles();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el detalle'
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
        <div className="font-semibold">{rowData.cotizacionCompras?.empresa?.razonSocial}</div>
        <div className="text-sm text-500">Cotización ID: {rowData.cotizacionComprasId?.toString()}</div>
      </div>
    );
  };

  const productoTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.producto?.nombre}</div>
        <div className="text-sm text-500">{rowData.producto?.codigo}</div>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return Number(rowData.cantidad).toLocaleString('es-PE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const precioTemplate = (rowData) => {
    return Number(rowData.precioUnitario).toLocaleString('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const totalTemplate = (rowData) => {
    const total = Number(rowData.cantidad) * Number(rowData.precioUnitario);
    return total.toLocaleString('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const unidadMedidaTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.unidadMedida?.nombre} 
        severity="info"
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
      <h2 className="m-0">Detalles de Cotizaciones de Compras</h2>
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
          label="Nuevo Detalle"
          icon="pi pi-plus"
          className="p-button-primary"
          onClick={() => abrirDialogo()}
        />
      </div>
    </div>
  );

  return (
    <div className="detalle-cotizacion-compras-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={detalles}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['cotizacionCompras.empresa.razonSocial', 'producto.nombre', 'producto.codigo']}
          header={header}
          emptyMessage="No se encontraron detalles de cotizaciones de compras."
          onRowClick={(e) => abrirDialogo(e.data)}
          selectionMode="single"
          scrollable
          scrollHeight="600px"
        >
          <Column
            field="cotizacionCompras"
            header="Cotización"
            body={cotizacionTemplate}
            sortable
            style={{ minWidth: '250px' }}
            frozen
          />
          <Column
            field="producto"
            header="Producto"
            body={productoTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="cantidad"
            header="Cantidad"
            body={cantidadTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="unidadMedida"
            header="Unidad"
            body={unidadMedidaTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="precioUnitario"
            header="Precio Unit."
            body={precioTemplate}
            sortable
            style={{ minWidth: '130px' }}
          />
          <Column
            header="Total"
            body={totalTemplate}
            sortable
            style={{ minWidth: '130px' }}
          />
          <Column
            field="observaciones"
            header="Observaciones"
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
        style={{ width: '95vw', maxWidth: '800px' }}
        header={detalleSeleccionado ? 'Editar Detalle de Cotización' : 'Nuevo Detalle de Cotización'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <DetCotizacionComprasForm
          detalle={detalleSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetCotizacionCompras;
