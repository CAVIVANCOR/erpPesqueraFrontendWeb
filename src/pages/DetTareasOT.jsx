// src/pages/DetTareasOT.jsx
// Pantalla CRUD profesional para DetTareasOT. Cumple regla transversal ERP Megui:
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
import { getDetallesTareasOT, eliminarDetalleTareaOT } from '../api/detTareasOT';
import DetTareasOTForm from '../components/detTareasOT/DetTareasOTForm';

/**
 * Componente DetTareasOT
 * Gestión CRUD de tareas de órdenes de trabajo con patrón profesional ERP Megui
 */
const DetTareasOT = () => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const data = await getDetallesTareasOT();
      setTareas(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar tareas de OT'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedTarea(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tarea) => {
    setSelectedTarea(tarea);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedTarea(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (tarea) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la tarea "${tarea.descripcion}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarTarea(tarea.id)
    });
  };

  const eliminarTarea = async (id) => {
    try {
      await eliminarDetalleTareaOT(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tarea eliminada correctamente'
      });
      cargarTareas();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la tarea'
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

  const realizadoTemplate = (rowData) => {
    const severity = rowData.realizado ? 'success' : 'warning';
    const value = rowData.realizado ? 'REALIZADO' : 'PENDIENTE';
    return <Tag value={value} severity={severity} />;
  };

  const cotizacionesTemplate = (rowData) => {
    const cotizaciones = [];
    if (rowData.adjuntoCotizacionUno) cotizaciones.push('COT-1');
    if (rowData.adjuntoCotizacionDos) cotizaciones.push('COT-2');
    
    if (cotizaciones.length === 0) return '';
    
    return (
      <div className="flex gap-1">
        {cotizaciones.map((cot, index) => (
          <Tag key={index} value={cot} severity="info" />
        ))}
      </div>
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
    <div className="det-tareas-ot-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Tareas de Órdenes de Trabajo</h2>
          <Button
            label="Nueva Tarea"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={tareas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron tareas"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="otMantenimientoId" header="OT ID" sortable style={{ width: '100px' }} />
          <Column 
            field="descripcion" 
            header="Descripción" 
            sortable 
            style={{ minWidth: '200px' }}
            body={(rowData) => (
              <span title={rowData.descripcion}>
                {rowData.descripcion.length > 50 ? 
                  `${rowData.descripcion.substring(0, 50)}...` : 
                  rowData.descripcion}
              </span>
            )}
          />
          <Column field="responsableId" header="Responsable ID" sortable style={{ width: '120px' }} />
          <Column 
            field="fechaProgramada" 
            header="F. Programada" 
            body={(rowData) => formatearFecha(rowData.fechaProgramada)}
            sortable 
            style={{ width: '130px' }}
          />
          <Column 
            field="fechaInicio" 
            header="F. Inicio" 
            body={(rowData) => formatearFecha(rowData.fechaInicio)}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="fechaFin" 
            header="F. Fin" 
            body={(rowData) => formatearFecha(rowData.fechaFin)}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="realizado" 
            header="Estado" 
            body={realizadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            header="Cotizaciones" 
            body={cotizacionesTemplate}
            style={{ width: '140px' }}
            className="text-center"
          />
          <Column field="validaTerminoTareaId" header="Validador ID" sortable style={{ width: '120px' }} />
          <Column 
            field="fechaValidaTerminoTarea" 
            header="F. Validación" 
            body={(rowData) => formatearFecha(rowData.fechaValidaTerminoTarea)}
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
        header={isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
        modal
        onHide={cerrarDialogo}
      >
        <DetTareasOTForm
          tarea={selectedTarea}
          onSave={() => {
            cargarTareas();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetTareasOT;
