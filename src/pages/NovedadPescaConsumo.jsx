// src/pages/NovedadPescaConsumo.jsx
// Pantalla CRUD profesional para NovedadPescaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllNovedadPescaConsumo, deleteNovedadPescaConsumo } from '../api/novedadPescaConsumo';
import NovedadPescaConsumoForm from '../components/novedadPescaConsumo/NovedadPescaConsumoForm';

/**
 * Componente NovedadPescaConsumo
 * Gestión CRUD de novedades de pesca para consumo con patrón profesional ERP Megui
 */
const NovedadPescaConsumo = () => {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarNovedades();
  }, []);

  const cargarNovedades = async () => {
    try {
      setLoading(true);
      const data = await getAllNovedadPescaConsumo();
      setNovedades(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar novedades de pesca consumo'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedNovedad(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (novedad) => {
    setSelectedNovedad(novedad);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedNovedad(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (novedad) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la novedad "${novedad.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarNovedad(novedad.id)
    });
  };

  const eliminarNovedad = async (id) => {
    try {
      await deleteNovedadPescaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Novedad eliminada correctamente'
      });
      cargarNovedades();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la novedad'
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

  const fechaInicioTemplate = (rowData) => {
    return formatearFecha(rowData.fechaInicio);
  };

  const fechaFinTemplate = (rowData) => {
    return formatearFecha(rowData.fechaFin);
  };

  const fechaCreacionTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaCreacion);
  };

  const estadoTemplate = (rowData) => {
    const ahora = new Date();
    const inicio = new Date(rowData.fechaInicio);
    const fin = new Date(rowData.fechaFin);
    
    let estado = 'Programada';
    let severity = 'info';
    
    if (ahora >= inicio && ahora <= fin) {
      estado = 'En Curso';
      severity = 'success';
    } else if (ahora > fin) {
      estado = 'Finalizada';
      severity = 'secondary';
    }
    
    return <Tag value={estado} severity={severity} />;
  };

  const duracionTemplate = (rowData) => {
    if (!rowData.fechaInicio || !rowData.fechaFin) return '';
    
    const inicio = new Date(rowData.fechaInicio);
    const fin = new Date(rowData.fechaFin);
    const diferencia = fin - inicio;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return `${dias} día${dias !== 1 ? 's' : ''}`;
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
    <div className="novedad-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Novedades de Pesca para Consumo</h2>
          <Button
            label="Nueva Novedad"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={novedades}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron novedades"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="nombre" 
            header="Nombre" 
            sortable 
            style={{ minWidth: '200px' }}
            body={(rowData) => (
              <span className="font-semibold">{rowData.nombre}</span>
            )}
          />
          <Column field="empresaId" header="Empresa ID" sortable style={{ width: '120px' }} />
          <Column field="BahiaId" header="Bahía ID" sortable style={{ width: '100px' }} />
          <Column 
            field="fechaInicio" 
            header="Fecha Inicio" 
            body={fechaInicioTemplate}
            sortable 
            style={{ width: '130px' }}
          />
          <Column 
            field="fechaFin" 
            header="Fecha Fin" 
            body={fechaFinTemplate}
            sortable 
            style={{ width: '130px' }}
          />
          <Column 
            header="Duración" 
            body={duracionTemplate}
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            header="Estado" 
            body={estadoTemplate}
            style={{ width: '120px' }}
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
        header={isEditing ? 'Editar Novedad' : 'Nueva Novedad'}
        modal
        onHide={cerrarDialogo}
      >
        <NovedadPescaConsumoForm
          novedad={selectedNovedad}
          onSave={() => {
            cargarNovedades();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default NovedadPescaConsumo;
