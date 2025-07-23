// src/pages/EntregaARendirPescaConsumo.jsx
// Pantalla CRUD profesional para EntregaARendirPescaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllEntregaARendirPescaConsumo, deleteEntregaARendirPescaConsumo } from '../api/entregaARendirPescaConsumo';
import EntregaARendirPescaConsumoForm from '../components/entregaARendirPescaConsumo/EntregaARendirPescaConsumoForm';

/**
 * Componente EntregaARendirPescaConsumo
 * Gestión CRUD de entregas a rendir de pesca consumo con patrón profesional ERP Megui
 */
const EntregaARendirPescaConsumo = () => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarEntregas();
  }, []);

  const cargarEntregas = async () => {
    try {
      setLoading(true);
      const data = await getAllEntregaARendirPescaConsumo();
      setEntregas(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar entregas a rendir'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedEntrega(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (entrega) => {
    setSelectedEntrega(entrega);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedEntrega(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (entrega) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la entrega a rendir ID ${entrega.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarEntrega(entrega.id)
    });
  };

  const eliminarEntrega = async (id) => {
    try {
      await deleteEntregaARendirPescaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Entrega eliminada correctamente'
      });
      cargarEntregas();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la entrega'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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

  const estadoLiquidacionTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.entregaLiquidada ? 'Liquidada' : 'Pendiente'} 
        severity={rowData.entregaLiquidada ? 'success' : 'warning'} 
      />
    );
  };

  const fechaLiquidacionTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaLiquidacion);
  };

  const fechaCreacionTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaCreacion);
  };

  const fechaActualizacionTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaActualizacion);
  };

  const diasPendientesTemplate = (rowData) => {
    if (rowData.entregaLiquidada) return '';
    
    const fechaCreacion = new Date(rowData.fechaCreacion);
    const ahora = new Date();
    const diasPendientes = Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60 * 24));
    
    let severity = 'info';
    if (diasPendientes > 30) {
      severity = 'danger';
    } else if (diasPendientes > 15) {
      severity = 'warning';
    }
    
    return <Tag value={`${diasPendientes} días`} severity={severity} />;
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
    <div className="entrega-a-rendir-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Entregas a Rendir - Pesca Consumo</h2>
          <Button
            label="Nueva Entrega"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={entregas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron entregas a rendir"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="novedadPescaConsumoId" header="Novedad ID" sortable style={{ width: '120px' }} />
          <Column field="respEntregaRendirId" header="Responsable ID" sortable style={{ width: '140px' }} />
          <Column field="centroCostoId" header="C.C. ID" sortable style={{ width: '100px' }} />
          <Column 
            field="entregaLiquidada" 
            header="Estado" 
            body={estadoLiquidacionTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="fechaLiquidacion" 
            header="F. Liquidación" 
            body={fechaLiquidacionTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            header="Días Pendientes" 
            body={diasPendientesTemplate}
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="fechaCreacion" 
            header="F. Creación" 
            body={fechaCreacionTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="fechaActualizacion" 
            header="F. Actualización" 
            body={fechaActualizacionTemplate}
            sortable 
            style={{ width: '150px' }}
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
        style={{ width: '800px' }}
        header={isEditing ? 'Editar Entrega' : 'Nueva Entrega'}
        modal
        onHide={cerrarDialogo}
      >
        <EntregaARendirPescaConsumoForm
          entrega={selectedEntrega}
          onSave={() => {
            cargarEntregas();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default EntregaARendirPescaConsumo;
