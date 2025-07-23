// src/pages/DetAccionesPreviasFaenaConsumo.jsx
// Pantalla CRUD profesional para DetAccionesPreviasFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllDetAccionesPreviasFaenaConsumo, deleteDetAccionesPreviasFaenaConsumo } from '../api/detAccionesPreviasFaenaConsumo';
import DetAccionesPreviasFaenaConsumoForm from '../components/detAccionesPreviasFaenaConsumo/DetAccionesPreviasFaenaConsumoForm';

/**
 * Componente DetAccionesPreviasFaenaConsumo
 * Gestión CRUD de acciones previas de faenas de consumo con patrón profesional ERP Megui
 */
const DetAccionesPreviasFaenaConsumo = () => {
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedAccion, setSelectedAccion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarAcciones();
  }, []);

  const cargarAcciones = async () => {
    try {
      setLoading(true);
      const data = await getAllDetAccionesPreviasFaenaConsumo();
      setAcciones(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar acciones previas de faena'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedAccion(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (accion) => {
    setSelectedAccion(accion);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedAccion(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (accion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la acción previa de la faena ${accion.faenaPescaConsumoId}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarAccion(accion.id)
    });
  };

  const eliminarAccion = async (id) => {
    try {
      await deleteDetAccionesPreviasFaenaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Acción previa eliminada correctamente'
      });
      cargarAcciones();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la acción previa'
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

  const estadoCumplidaTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.cumplida ? 'Cumplida' : 'Pendiente'} 
        severity={rowData.cumplida ? 'success' : 'warning'} 
      />
    );
  };

  const estadoVerificadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.verificado ? 'Verificado' : 'Sin Verificar'} 
        severity={rowData.verificado ? 'info' : 'secondary'} 
      />
    );
  };

  const fechaCumplidaTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaCumplida);
  };

  const fechaVerificacionTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaVerificacion);
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

  const documentoTemplate = (rowData) => {
    if (!rowData.urlConfirmaAccionPdf) return '';
    return (
      <Button
        icon="pi pi-file-pdf"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          window.open(rowData.urlConfirmaAccionPdf, '_blank');
        }}
        tooltip="Ver documento PDF"
      />
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
    <div className="det-acciones-previas-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Acciones Previas de Faenas de Consumo</h2>
          <Button
            label="Nueva Acción Previa"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={acciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron acciones previas"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="faenaPescaConsumoId" header="Faena ID" sortable style={{ width: '100px' }} />
          <Column field="accionPreviaId" header="Acción ID" sortable style={{ width: '110px' }} />
          <Column field="responsableId" header="Responsable ID" sortable style={{ width: '130px' }} />
          <Column field="verificadorId" header="Verificador ID" sortable style={{ width: '130px' }} />
          <Column 
            field="cumplida" 
            header="Estado" 
            body={estadoCumplidaTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="verificado" 
            header="Verificación" 
            body={estadoVerificadoTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="fechaCumplida" 
            header="F. Cumplida" 
            body={fechaCumplidaTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="fechaVerificacion" 
            header="F. Verificación" 
            body={fechaVerificacionTemplate}
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
            header="Documento" 
            body={documentoTemplate}
            style={{ width: '100px' }}
            className="text-center"
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
        header={isEditing ? 'Editar Acción Previa' : 'Nueva Acción Previa'}
        modal
        onHide={cerrarDialogo}
      >
        <DetAccionesPreviasFaenaConsumoForm
          accion={selectedAccion}
          onSave={() => {
            cargarAcciones();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetAccionesPreviasFaenaConsumo;
