// src/pages/MovLiquidacionTemporadaPesca.jsx
// Pantalla CRUD profesional para MovLiquidacionTemporadaPesca. Cumple regla transversal ERP Megui:
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
import { getMovLiquidacionesTemporadaPesca, eliminarMovLiquidacionTemporadaPesca } from '../api/movLiquidacionTemporadaPesca';
import MovLiquidacionTemporadaPescaForm from '../components/movLiquidacionTemporadaPesca/MovLiquidacionTemporadaPescaForm';

/**
 * Componente MovLiquidacionTemporadaPesca
 * Gestión CRUD de movimientos de liquidación de temporada de pesca con patrón profesional ERP Megui
 */
const MovLiquidacionTemporadaPesca = () => {
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
      const data = await getMovLiquidacionesTemporadaPesca();
      setMovimientos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar movimientos de liquidación'
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
      message: `¿Está seguro de eliminar el movimiento ${movimiento.id}?`,
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
      await eliminarMovLiquidacionTemporadaPesca(id);
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

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  const formatearDecimal = (valor) => {
    if (valor === null || valor === undefined) return '';
    return Number(valor).toFixed(2);
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
    <div className="mov-liquidacion-temporada-pesca-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Movimientos de Liquidación de Temporada</h2>
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
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} />
          <Column field="liquidacionTemporadaId" header="Liquidación ID" sortable />
          <Column field="tipoMovimientoId" header="Tipo Movimiento ID" sortable />
          <Column 
            field="monto" 
            header="Monto" 
            body={(rowData) => formatearDecimal(rowData.monto)}
            sortable 
            className="text-right"
          />
          <Column field="centroCostoId" header="Centro Costo ID" sortable />
          <Column 
            field="fechaMovimiento" 
            header="Fecha Movimiento" 
            body={(rowData) => formatearFecha(rowData.fechaMovimiento)}
            sortable 
          />
          <Column 
            field="fechaRegistro" 
            header="Fecha Registro" 
            body={(rowData) => formatearFecha(rowData.fechaRegistro)}
            sortable 
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: '100px' }}
            className="text-center"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '700px' }}
        header={isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        modal
        onHide={cerrarDialogo}
      >
        <MovLiquidacionTemporadaPescaForm
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

export default MovLiquidacionTemporadaPesca;
