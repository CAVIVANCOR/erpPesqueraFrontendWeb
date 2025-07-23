// src/pages/DetGastosComprasProd.jsx
// Pantalla CRUD profesional para gastos de compras de producción
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
import { getDetGastosComprasProd, eliminarDetGastosComprasProd } from '../api/detGastosComprasProd';
import DetGastosComprasProdForm from '../components/detGastosComprasProd/DetGastosComprasProdForm';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Componente DetGastosComprasProd
 * Pantalla principal para gestión de gastos de compras de producción
 * Implementa patrón profesional ERP Megui con todas las validaciones y controles de seguridad
 */
const DetGastosComprasProd = () => {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarGastos();
  }, []);

  const cargarGastos = async () => {
    try {
      setLoading(true);
      const data = await getDetGastosComprasProd();
      setGastos(data);
    } catch (error) {
      console.error('Error al cargar gastos de compras de producción:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los gastos de compras de producción'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (gasto = null) => {
    setGastoSeleccionado(gasto);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setGastoSeleccionado(null);
  };

  const onGuardar = () => {
    cerrarDialogo();
    cargarGastos();
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: gastoSeleccionado ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente'
    });
  };

  const confirmarEliminacion = (gasto) => {
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
      message: `¿Está seguro de eliminar el gasto de ${Number(gasto.monto).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarGasto(gasto.id)
    });
  };

  const eliminarGasto = async (id) => {
    try {
      await eliminarDetGastosComprasProd(id);
      await cargarGastos();
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Gasto eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Error al eliminar el gasto'
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

  const entregaTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">Entrega #{rowData.entregaARendirPComprasId?.toString()}</div>
        <div className="text-sm text-500">Mov: #{rowData.detMovEntregaRendirPComprasId?.toString()}</div>
      </div>
    );
  };

  const montoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <span className="font-semibold text-lg">
          {Number(rowData.monto).toLocaleString('es-PE', { 
            style: 'currency', 
            currency: 'PEN',
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </span>
      </div>
    );
  };

  const fechaRegistroTemplate = (rowData) => {
    return new Date(rowData.fechaRegistro).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const costoProduccionTemplate = (rowData) => {
    return (
      <Tag 
        value={`Costo #${rowData.costoProduccionId?.toString()}`} 
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
      <h2 className="m-0">Gastos de Compras de Producción</h2>
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
          label="Nuevo Gasto"
          icon="pi pi-plus"
          className="p-button-primary"
          onClick={() => abrirDialogo()}
        />
      </div>
    </div>
  );

  return (
    <div className="det-gastos-compras-prod-page">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={gastos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} gastos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['cotizacionCompras.empresa.razonSocial', 'monto']}
          header={header}
          emptyMessage="No se encontraron gastos de compras de producción."
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
            header="Entrega/Movimiento"
            body={entregaTemplate}
            sortable
            style={{ minWidth: '180px' }}
          />
          <Column
            field="costoProduccionId"
            header="Costo Producción"
            body={costoProduccionTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="monto"
            header="Monto"
            body={montoTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="fechaRegistro"
            header="F. Registro"
            body={fechaRegistroTemplate}
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
        style={{ width: '95vw', maxWidth: '700px' }}
        header={gastoSeleccionado ? 'Editar Gasto de Compras Producción' : 'Nuevo Gasto de Compras Producción'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <DetGastosComprasProdForm
          gasto={gastoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetGastosComprasProd;
