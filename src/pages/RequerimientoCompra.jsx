// src/pages/RequerimientoCompra.jsx
// Pantalla CRUD profesional para RequerimientoCompra. Cumple regla transversal ERP Megui:
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
import { getRequerimientosCompra, eliminarRequerimientoCompra } from '../api/requerimientoCompra';
import RequerimientoCompraForm from '../components/requerimientoCompra/RequerimientoCompraForm';

/**
 * Componente RequerimientoCompra
 * Gestión CRUD de requerimientos de compra con patrón profesional ERP Megui
 */
const RequerimientoCompra = () => {
  const [requerimientos, setRequerimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedRequerimiento, setSelectedRequerimiento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarRequerimientos();
  }, []);

  const cargarRequerimientos = async () => {
    try {
      setLoading(true);
      const data = await getRequerimientosCompra();
      setRequerimientos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar requerimientos de compra'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedRequerimiento(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (requerimiento) => {
    setSelectedRequerimiento(requerimiento);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedRequerimiento(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (requerimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el requerimiento "${requerimiento.numero}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarRequerimiento(requerimiento.id)
    });
  };

  const eliminarRequerimiento = async (id) => {
    try {
      await eliminarRequerimientoCompra(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Requerimiento eliminado correctamente'
      });
      cargarRequerimientos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el requerimiento'
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
      'PENDIENTE': { severity: 'warning', value: 'PENDIENTE' },
      'APROBADO': { severity: 'success', value: 'APROBADO' },
      'RECHAZADO': { severity: 'danger', value: 'RECHAZADO' },
      'PROCESADO': { severity: 'info', value: 'PROCESADO' }
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
    <div className="requerimiento-compra-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Requerimientos de Compra</h2>
          <Button
            label="Nuevo Requerimiento"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={requerimientos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron requerimientos"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="numero" header="Número" sortable style={{ width: '120px' }} />
          <Column 
            field="fechaSolicitud" 
            header="F. Solicitud" 
            body={(rowData) => formatearFecha(rowData.fechaSolicitud)}
            sortable 
            style={{ width: '130px' }}
          />
          <Column 
            field="fechaRequerida" 
            header="F. Requerida" 
            body={(rowData) => formatearFecha(rowData.fechaRequerida)}
            sortable 
            style={{ width: '130px' }}
          />
          <Column field="solicitanteId" header="Solicitante ID" sortable style={{ width: '120px' }} />
          <Column field="centroCostoId" header="C. Costo ID" sortable style={{ width: '120px' }} />
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
          <Column field="aprobadorId" header="Aprobador ID" sortable style={{ width: '120px' }} />
          <Column 
            field="fechaAprobacion" 
            header="F. Aprobación" 
            body={(rowData) => formatearFecha(rowData.fechaAprobacion)}
            sortable 
            style={{ width: '130px' }}
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
        header={isEditing ? 'Editar Requerimiento' : 'Nuevo Requerimiento'}
        modal
        onHide={cerrarDialogo}
      >
        <RequerimientoCompraForm
          requerimiento={selectedRequerimiento}
          onSave={() => {
            cargarRequerimientos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default RequerimientoCompra;
