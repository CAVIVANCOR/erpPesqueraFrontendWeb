// src/pages/TripulanteFaenaConsumo.jsx
// Pantalla CRUD profesional para TripulanteFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllTripulanteFaenaConsumo, deleteTripulanteFaenaConsumo } from '../api/tripulanteFaenaConsumo';
import TripulanteFaenaConsumoForm from '../components/tripulanteFaenaConsumo/TripulanteFaenaConsumoForm';

/**
 * Componente TripulanteFaenaConsumo
 * Gestión CRUD de tripulantes de faenas de consumo con patrón profesional ERP Megui
 */
const TripulanteFaenaConsumo = () => {
  const [tripulantes, setTripulantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedTripulante, setSelectedTripulante] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTripulantes();
  }, []);

  const cargarTripulantes = async () => {
    try {
      setLoading(true);
      const data = await getAllTripulanteFaenaConsumo();
      setTripulantes(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar tripulantes de faena'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedTripulante(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tripulante) => {
    setSelectedTripulante(tripulante);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedTripulante(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (tripulante) => {
    const nombreCompleto = `${tripulante.nombres || ''} ${tripulante.apellidos || ''}`.trim();
    confirmDialog({
      message: `¿Está seguro de eliminar al tripulante "${nombreCompleto || 'ID: ' + tripulante.id}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarTripulante(tripulante.id)
    });
  };

  const eliminarTripulante = async (id) => {
    try {
      await deleteTripulanteFaenaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tripulante eliminado correctamente'
      });
      cargarTripulantes();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el tripulante'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const nombreCompletoTemplate = (rowData) => {
    const nombreCompleto = `${rowData.nombres || ''} ${rowData.apellidos || ''}`.trim();
    return (
      <span className="font-semibold">
        {nombreCompleto || 'Sin nombre'}
      </span>
    );
  };

  const tipoTripulanteTemplate = (rowData) => {
    if (rowData.personalId) {
      return <Tag value="Personal Registrado" severity="success" />;
    } else {
      return <Tag value="Tripulante Externo" severity="info" />;
    }
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
    <div className="tripulante-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Tripulantes de Faenas de Consumo</h2>
          <Button
            label="Nuevo Tripulante"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={tripulantes}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron tripulantes"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="faenaPescaConsumoId" header="Faena ID" sortable style={{ width: '100px' }} />
          <Column field="personalId" header="Personal ID" sortable style={{ width: '120px' }} />
          <Column field="cargoId" header="Cargo ID" sortable style={{ width: '100px' }} />
          <Column 
            header="Nombre Completo" 
            body={nombreCompletoTemplate}
            sortable 
            style={{ minWidth: '200px' }}
          />
          <Column 
            header="Tipo" 
            body={tipoTripulanteTemplate}
            style={{ width: '150px' }}
            className="text-center"
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
        style={{ width: '800px' }}
        header={isEditing ? 'Editar Tripulante' : 'Nuevo Tripulante'}
        modal
        onHide={cerrarDialogo}
      >
        <TripulanteFaenaConsumoForm
          tripulante={selectedTripulante}
          onSave={() => {
            cargarTripulantes();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default TripulanteFaenaConsumo;
