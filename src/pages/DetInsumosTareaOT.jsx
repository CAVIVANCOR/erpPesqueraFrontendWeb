// src/pages/DetInsumosTareaOT.jsx
// Pantalla CRUD profesional para DetInsumosTareaOT. Cumple regla transversal ERP Megui:
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
import { getAllDetInsumosTareaOT, deleteDetInsumosTareaOT } from '../api/detInsumosTareaOT';
import DetInsumosTareaOTForm from '../components/detInsumosTareaOT/DetInsumosTareaOTForm';

/**
 * Componente DetInsumosTareaOT
 * Gestión CRUD de insumos de tareas de órdenes de trabajo con patrón profesional ERP Megui
 */
const DetInsumosTareaOT = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = async () => {
    try {
      setLoading(true);
      const data = await getAllDetInsumosTareaOT();
      setInsumos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar insumos de tareas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedInsumo(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (insumo) => {
    setSelectedInsumo(insumo);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedInsumo(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (insumo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el insumo "${insumo.productoId}" de la tarea?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarInsumo(insumo.id)
    });
  };

  const eliminarInsumo = async (id) => {
    try {
      await deleteDetInsumosTareaOT(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Insumo eliminado correctamente'
      });
      cargarInsumos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el insumo'
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

  const cantidadTemplate = (rowData) => {
    return formatearNumero(rowData.cantidad, 2);
  };

  const costoUnitarioTemplate = (rowData) => {
    return `S/ ${formatearNumero(rowData.costoUnitario, 2)}`;
  };

  const costoTotalTemplate = (rowData) => {
    const total = (rowData.cantidad || 0) * (rowData.costoUnitario || 0);
    return `S/ ${formatearNumero(total, 2)}`;
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
    <div className="det-insumos-tarea-ot-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Insumos de Tareas de Órdenes de Trabajo</h2>
          <Button
            label="Nuevo Insumo"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={insumos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron insumos"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="detTareaOtId" header="Tarea ID" sortable style={{ width: '100px' }} />
          <Column field="productoId" header="Producto ID" sortable style={{ width: '120px' }} />
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
            field="costoUnitario" 
            header="Costo Unit." 
            body={costoUnitarioTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column 
            header="Costo Total" 
            body={costoTotalTemplate}
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
        header={isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
        modal
        onHide={cerrarDialogo}
      >
        <DetInsumosTareaOTForm
          insumo={selectedInsumo}
          onSave={() => {
            cargarInsumos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetInsumosTareaOT;
