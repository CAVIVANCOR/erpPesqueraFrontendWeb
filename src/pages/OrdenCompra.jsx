// src/pages/OrdenCompra.jsx
// Pantalla CRUD profesional para OrdenCompra. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getAllOrdenCompra, deleteOrdenCompra } from '../api/ordenCompra';
import OrdenCompraForm from '../components/ordenCompra/OrdenCompraForm';

/**
 * Componente OrdenCompra
 * Gestión CRUD de órdenes de compra con patrón profesional ERP Megui
 */
const OrdenCompra = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const data = await getAllOrdenCompra();
      setOrdenes(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar órdenes de compra'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedOrden(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (orden) => {
    setSelectedOrden(orden);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedOrden(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (orden) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la orden de compra "${orden.numero}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarOrden(orden.id)
    });
  };

  const eliminarOrden = async (id) => {
    try {
      await deleteOrdenCompra(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Orden de compra eliminada correctamente'
      });
      cargarOrdenes();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la orden de compra'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return `S/ ${Number(valor).toFixed(2)}`;
  };

  const estadoTemplate = (rowData) => {
    const estadoMap = {
      'BORRADOR': { severity: 'secondary', value: 'BORRADOR' },
      'ENVIADA': { severity: 'warning', value: 'ENVIADA' },
      'CONFIRMADA': { severity: 'info', value: 'CONFIRMADA' },
      'RECIBIDA': { severity: 'success', value: 'RECIBIDA' },
      'FACTURADA': { severity: 'success', value: 'FACTURADA' },
      'CANCELADA': { severity: 'danger', value: 'CANCELADA' }
    };
    
    const estado = estadoMap[rowData.estado] || { severity: 'secondary', value: rowData.estado };
    return <Tag value={estado.value} severity={estado.severity} />;
  };

  const prioridadTemplate = (rowData) => {
    const prioridadMap = {
      'ALTA': { severity: 'danger', value: 'ALTA' },
      'MEDIA': { severity: 'warning', value: 'MEDIA' },
      'BAJA': { severity: 'info', value: 'BAJA' }
    };
    
    const prioridad = prioridadMap[rowData.prioridad] || { severity: 'secondary', value: rowData.prioridad };
    return <Tag value={prioridad.value} severity={prioridad.severity} />;
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
    <div className="orden-compra-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Órdenes de Compra</h2>
          <Button
            label="Nueva Orden"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={ordenes}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron órdenes de compra"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="numero" header="Número" sortable style={{ width: '120px' }} />
          <Column 
            field="fechaOrden" 
            header="F. Orden" 
            body={(rowData) => formatearFecha(rowData.fechaOrden)}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="fechaEntrega" 
            header="F. Entrega" 
            body={(rowData) => formatearFecha(rowData.fechaEntrega)}
            sortable 
            style={{ width: '120px' }}
          />
          <Column field="proveedorId" header="Proveedor ID" sortable style={{ width: '120px' }} />
          <Column 
            field="estado" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="prioridad" 
            header="Prioridad" 
            body={prioridadTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="montoTotal" 
            header="Monto Total" 
            body={(rowData) => formatearMoneda(rowData.montoTotal)}
            sortable 
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column 
            field="montoImpuestos" 
            header="Impuestos" 
            body={(rowData) => formatearMoneda(rowData.montoImpuestos)}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="montoFinal" 
            header="Total Final" 
            body={(rowData) => formatearMoneda(rowData.montoFinal)}
            sortable 
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column field="compradorId" header="Comprador ID" sortable style={{ width: '120px' }} />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            sortable 
            style={{ minWidth: '200px' }}
            body={(rowData) => (
              <span title={rowData.observaciones}>
                {rowData.observaciones && rowData.observaciones.length > 50 ? 
                  `${rowData.observaciones.substring(0, 50)}...` : 
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
        style={{ width: '1000px' }}
        header={isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
        modal
        onHide={cerrarDialogo}
      >
        <OrdenCompraForm
          orden={selectedOrden}
          onSave={() => {
            cargarOrdenes();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default OrdenCompra;
