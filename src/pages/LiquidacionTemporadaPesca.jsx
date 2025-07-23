// src/pages/LiquidacionTemporadaPesca.jsx
// Pantalla CRUD profesional para LiquidacionTemporadaPesca. Cumple regla transversal ERP Megui:
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
import { getLiquidacionesTemporadaPesca, eliminarLiquidacionTemporadaPesca } from '../api/liquidacionTemporadaPesca';
import LiquidacionTemporadaPescaForm from '../components/liquidacionTemporadaPesca/LiquidacionTemporadaPescaForm';

/**
 * Componente LiquidacionTemporadaPesca
 * Gestión CRUD de liquidaciones de temporada de pesca con patrón profesional ERP Megui
 */
const LiquidacionTemporadaPesca = () => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarLiquidaciones();
  }, []);

  const cargarLiquidaciones = async () => {
    try {
      setLoading(true);
      const data = await getLiquidacionesTemporadaPesca();
      setLiquidaciones(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar liquidaciones de temporada'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedLiquidacion(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (liquidacion) => {
    setSelectedLiquidacion(liquidacion);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedLiquidacion(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (liquidacion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la liquidación de temporada ${liquidacion.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarLiquidacion(liquidacion.id)
    });
  };

  const eliminarLiquidacion = async (id) => {
    try {
      await eliminarLiquidacionTemporadaPesca(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Liquidación eliminada correctamente'
      });
      cargarLiquidaciones();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la liquidación'
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
    <div className="liquidacion-temporada-pesca-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Liquidaciones de Temporada de Pesca</h2>
          <Button
            label="Nueva Liquidación"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={liquidaciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron liquidaciones"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} />
          <Column field="temporadaPescaId" header="Temporada ID" sortable />
          <Column field="empresaId" header="Empresa ID" sortable />
          <Column 
            field="fechaLiquidacion" 
            header="Fecha Liquidación" 
            body={(rowData) => formatearFecha(rowData.fechaLiquidacion)}
            sortable 
          />
          <Column field="responsableId" header="Responsable ID" sortable />
          <Column 
            field="saldoFinal" 
            header="Saldo Final" 
            body={(rowData) => formatearDecimal(rowData.saldoFinal)}
            sortable 
            className="text-right"
          />
          <Column 
            field="fechaVerificacion" 
            header="Fecha Verificación" 
            body={(rowData) => formatearFecha(rowData.fechaVerificacion)}
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
        style={{ width: '800px' }}
        header={isEditing ? 'Editar Liquidación' : 'Nueva Liquidación'}
        modal
        onHide={cerrarDialogo}
      >
        <LiquidacionTemporadaPescaForm
          liquidacion={selectedLiquidacion}
          onSave={() => {
            cargarLiquidaciones();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default LiquidacionTemporadaPesca;
