// src/pages/DetalleReqCompra.jsx
// Pantalla CRUD profesional para DetalleReqCompra. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getDetallesReqCompra, eliminarDetalleReqCompra } from '../api/detalleReqCompra';
import DetalleReqCompraForm from '../components/detalleReqCompra/DetalleReqCompraForm';

/**
 * Componente DetalleReqCompra
 * Gestión CRUD de detalles de requerimientos de compra con patrón profesional ERP Megui
 */
const DetalleReqCompra = () => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDetalles();
  }, []);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getDetallesReqCompra();
      setDetalles(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar detalles de requerimientos'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedDetalle(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (detalle) => {
    setSelectedDetalle(detalle);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedDetalle(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el detalle del producto "${detalle.productoId}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDetalle(detalle.id)
    });
  };

  const eliminarDetalle = async (id) => {
    try {
      await eliminarDetalleReqCompra(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle eliminado correctamente'
      });
      cargarDetalles();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el detalle'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearNumero = (valor, decimales = 2) => {
    if (!valor) return '0.00';
    return Number(valor).toFixed(decimales);
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return `S/ ${formatearNumero(valor, 2)}`;
  };

  const cantidadTemplate = (rowData) => {
    return formatearNumero(rowData.cantidad, 2);
  };

  const precioUnitarioTemplate = (rowData) => {
    return formatearMoneda(rowData.precioUnitario);
  };

  const subtotalTemplate = (rowData) => {
    const subtotal = (rowData.cantidad || 0) * (rowData.precioUnitario || 0);
    return formatearMoneda(subtotal);
  };

  const accionesTemplate = (rowData) => {
    // Solo mostrar botón eliminar para superusuario o admin
    const puedeEliminar = usuario?.esSuperUsuario || usuario?.esAdmin;
    
    return (
      <div className="flex gap-2">
        {puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="detalle-req-compra-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Detalles de Requerimientos de Compra</h2>
          <Button
            label="Nuevo Detalle"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={detalles}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron detalles"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="requerimientoCompraId" header="Req. ID" sortable style={{ width: '100px' }} />
          <Column field="productoId" header="Producto ID" sortable style={{ width: '120px' }} />
          <Column 
            field="descripcion" 
            header="Descripción" 
            sortable 
            style={{ minWidth: '200px' }}
            body={(rowData) => (
              <span title={rowData.descripcion}>
                {rowData.descripcion && rowData.descripcion.length > 50 ? 
                  `${rowData.descripcion.substring(0, 50)}...` : 
                  rowData.descripcion || ''}
              </span>
            )}
          />
          <Column 
            field="cantidad" 
            header="Cantidad" 
            body={cantidadTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column field="unidadMedidaId" header="U.M. ID" sortable style={{ width: '100px' }} />
          <Column 
            field="precioUnitario" 
            header="P. Unitario" 
            body={precioUnitarioTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column 
            header="Subtotal" 
            body={subtotalTemplate}
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            sortable 
            style={{ minWidth: '150px' }}
            body={(rowData) => (
              <span title={rowData.observaciones}>
                {rowData.observaciones && rowData.observaciones.length > 30 ? 
                  `${rowData.observaciones.substring(0, 30)}...` : 
                  rowData.observaciones || ''}
              </span>
            )}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: '100px' }}
            className="text-center"
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '700px' }}
        header={isEditing ? 'Editar Detalle' : 'Nuevo Detalle'}
        modal
        onHide={cerrarDialogo}
      >
        <DetalleReqCompraForm
          detalle={selectedDetalle}
          onSave={() => {
            cargarDetalles();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetalleReqCompra;
