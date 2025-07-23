// src/pages/DetPermisoGestionadoOT.jsx
// Pantalla CRUD profesional para DetPermisoGestionadoOT. Cumple regla transversal ERP Megui:
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
import { getDetallesPermisosGestionados, eliminarDetallePermisoGestionado } from '../api/detPermisoGestionadoOT';
import DetPermisoGestionadoOTForm from '../components/detPermisoGestionadoOT/DetPermisoGestionadoOTForm';

/**
 * Componente DetPermisoGestionadoOT
 * Gestión CRUD de permisos gestionados en órdenes de trabajo con patrón profesional ERP Megui
 */
const DetPermisoGestionadoOT = () => {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPermiso, setSelectedPermiso] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarPermisos();
  }, []);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      const data = await getDetallesPermisosGestionados();
      setPermisos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar permisos gestionados de OT'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedPermiso(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (permiso) => {
    setSelectedPermiso(permiso);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedPermiso(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (permiso) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el permiso gestionado ${permiso.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarPermiso(permiso.id)
    });
  };

  const eliminarPermiso = async (id) => {
    try {
      await eliminarDetallePermisoGestionado(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Permiso gestionado eliminado correctamente'
      });
      cargarPermisos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el permiso gestionado'
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

  const gestionadoTemplate = (rowData) => {
    const severity = rowData.gestionado ? 'success' : 'warning';
    const value = rowData.gestionado ? 'GESTIONADO' : 'PENDIENTE';
    return <Tag value={value} severity={severity} />;
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
    <div className="det-permiso-gestionado-ot-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Permisos Gestionados de Órdenes de Trabajo</h2>
          <Button
            label="Nuevo Permiso Gestionado"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={permisos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron permisos gestionados"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} />
          <Column field="otMantenimientoId" header="OT Mantenimiento ID" sortable />
          <Column field="permisoId" header="Permiso ID" sortable />
          <Column 
            field="gestionado" 
            header="Estado" 
            body={gestionadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="fechaGestion" 
            header="Fecha Gestión" 
            body={(rowData) => formatearFecha(rowData.fechaGestion)}
            sortable 
          />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            sortable 
            style={{ maxWidth: '200px' }}
            body={(rowData) => (
              <span title={rowData.observaciones}>
                {rowData.observaciones ? 
                  (rowData.observaciones.length > 50 ? 
                    `${rowData.observaciones.substring(0, 50)}...` : 
                    rowData.observaciones) : 
                  ''}
              </span>
            )}
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
        style={{ width: '600px' }}
        header={isEditing ? 'Editar Permiso Gestionado' : 'Nuevo Permiso Gestionado'}
        modal
        onHide={cerrarDialogo}
      >
        <DetPermisoGestionadoOTForm
          permiso={selectedPermiso}
          onSave={() => {
            cargarPermisos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetPermisoGestionadoOT;
