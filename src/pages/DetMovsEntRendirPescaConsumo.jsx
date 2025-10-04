// src/pages/DetMovsEntRendirPescaConsumo.jsx
// Pantalla CRUD profesional para DetMovsEntRendirPescaConsumo. Cumple regla transversal ERP Megui:
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
import { getDetMovsEntRendirPescaConsumo, eliminarDetMovEntRendirPescaConsumo } from '../api/detMovsEntRendirPescaConsumo';
import DetMovsEntRendirPescaConsumoForm from '../components/detMovsEntRendirPescaConsumo/DetMovsEntRendirPescaConsumoForm';

/**
 * Componente DetMovsEntRendirPescaConsumo
 * Gestión CRUD de movimientos de entregas a rendir con patrón profesional ERP Megui
 */
const DetMovsEntRendirPescaConsumo = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await getDetMovsEntRendirPescaConsumo();
      setMovimientos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar movimientos de entregas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedMovimiento(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedMovimiento(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento ID ${movimiento.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarMovimiento(movimiento.id)
    });
  };

  const eliminarMovimiento = async (id) => {
    try {
      await eliminarDetMovEntRendirPescaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Movimiento eliminado correctamente'
      });
      cargarMovimientos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el movimiento'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(valor);
  };

  const tipoMovimientoTemplate = (rowData) => {
    const tipos = {
      'INGRESO': { label: 'Ingreso', severity: 'success' },
      'EGRESO': { label: 'Egreso', severity: 'danger' },
      'TRANSFERENCIA': { label: 'Transferencia', severity: 'info' },
      'AJUSTE': { label: 'Ajuste', severity: 'warning' }
    };
    
    const tipo = tipos[rowData.tipoMovimiento] || { label: rowData.tipoMovimiento, severity: 'secondary' };
    return <Tag value={tipo.label} severity={tipo.severity} />;
  };

  const montoTemplate = (rowData) => {
    const esEgreso = rowData.tipoMovimiento === 'EGRESO';
    return (
      <span className={esEgreso ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
        {formatearMoneda(rowData.monto)}
      </span>
    );
  };

  const fechaMovimientoTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaMovimiento);
  };

  const conceptoTemplate = (rowData) => {
    if (!rowData.concepto) return '';
    return (
      <span title={rowData.concepto}>
        {rowData.concepto.length > 40 ? 
          `${rowData.concepto.substring(0, 40)}...` : 
          rowData.concepto}
      </span>
    );
  };

  const observacionesTemplate = (rowData) => {
    if (!rowData.observaciones) return '';
    return (
      <span title={rowData.observaciones}>
        {rowData.observaciones.length > 30 ? 
          `${rowData.observaciones.substring(0, 30)}...` : 
          rowData.observaciones}
      </span>
    );
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
    <div className="det-movs-ent-rendir-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Movimientos de Entregas a Rendir - Pesca Consumo</h2>
          <Button
            label="Nuevo Movimiento"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={movimientos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron movimientos"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="entregaARendirPescaConsumoId" header="Entrega ID" sortable style={{ width: '120px' }} />
          <Column field="tipoMovEntregaRendirId" header="Tipo Mov ID" sortable style={{ width: '130px' }} />
          <Column 
            field="tipoMovimiento" 
            header="Tipo" 
            body={tipoMovimientoTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="concepto" 
            header="Concepto" 
            body={conceptoTemplate}
            sortable 
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="monto" 
            header="Monto" 
            body={montoTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column 
            field="fechaMovimiento" 
            header="F. Movimiento" 
            body={fechaMovimientoTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            body={observacionesTemplate}
            sortable 
            style={{ minWidth: '150px' }}
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
        style={{ width: '900px' }}
        header={isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        modal
        onHide={cerrarDialogo}
      >
        <DetMovsEntRendirPescaConsumoForm
          movimiento={selectedMovimiento}
          onSave={() => {
            cargarMovimientos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetMovsEntRendirPescaConsumo;
