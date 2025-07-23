// src/pages/CalaFaenaConsumo.jsx
// Pantalla CRUD profesional para CalaFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllCalaFaenaConsumo, deleteCalaFaenaConsumo } from '../api/calaFaenaConsumo';
import CalaFaenaConsumoForm from '../components/calaFaenaConsumo/CalaFaenaConsumoForm';

/**
 * Componente CalaFaenaConsumo
 * Gestión CRUD de calas de faenas de consumo con patrón profesional ERP Megui
 */
const CalaFaenaConsumo = () => {
  const [calas, setCalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCala, setSelectedCala] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarCalas();
  }, []);

  const cargarCalas = async () => {
    try {
      setLoading(true);
      const data = await getAllCalaFaenaConsumo();
      setCalas(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar calas de faenas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedCala(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (cala) => {
    setSelectedCala(cala);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedCala(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (cala) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cala ${cala.numeroCala || 'ID: ' + cala.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarCala(cala.id)
    });
  };

  const eliminarCala = async (id) => {
    try {
      await deleteCalaFaenaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cala eliminada correctamente'
      });
      cargarCalas();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la cala'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
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

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const formatearTemperatura = (temp) => {
    if (temp === null || temp === undefined) return '';
    return `${temp}°C`;
  };

  const numeroCalaTemplate = (rowData) => {
    return (
      <span className="font-bold text-blue-600">
        {rowData.numeroCala || `Cala ${rowData.id}`}
      </span>
    );
  };

  const fechaHoraInicioTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaHoraInicio);
  };

  const fechaHoraFinTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaHoraFin);
  };

  const duracionTemplate = (rowData) => {
    if (!rowData.fechaHoraInicio || !rowData.fechaHoraFin) return '';
    
    const inicio = new Date(rowData.fechaHoraInicio);
    const fin = new Date(rowData.fechaHoraFin);
    const duracionMs = fin - inicio;
    
    if (duracionMs <= 0) return '';
    
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  const pesoTotalTemplate = (rowData) => {
    return (
      <span className="font-bold text-green-600">
        {formatearPeso(rowData.pesoTotal)}
      </span>
    );
  };

  const temperaturaTemplate = (rowData) => {
    if (rowData.temperatura === null || rowData.temperatura === undefined) return '';
    
    let className = 'font-semibold';
    if (rowData.temperatura < 0) {
      className += ' text-blue-600'; // Frío
    } else if (rowData.temperatura > 25) {
      className += ' text-red-600'; // Caliente
    } else {
      className += ' text-green-600'; // Normal
    }
    
    return (
      <span className={className}>
        {formatearTemperatura(rowData.temperatura)}
      </span>
    );
  };

  const profundidadTemplate = (rowData) => {
    if (!rowData.profundidad) return '';
    return `${rowData.profundidad} m`;
  };

  const coordenadasTemplate = (rowData) => {
    if (!rowData.latitud || !rowData.longitud) return '';
    return (
      <div className="text-sm">
        <div>Lat: {rowData.latitud}</div>
        <div>Lng: {rowData.longitud}</div>
      </div>
    );
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
    <div className="cala-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Calas de Faenas - Pesca Consumo</h2>
          <Button
            label="Nueva Cala"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={calas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron calas"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="faenaPescaConsumoId" header="Faena ID" sortable style={{ width: '100px' }} />
          <Column 
            field="numeroCala" 
            header="N° Cala" 
            body={numeroCalaTemplate}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="fechaHoraInicio" 
            header="F.H. Inicio" 
            body={fechaHoraInicioTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="fechaHoraFin" 
            header="F.H. Fin" 
            body={fechaHoraFinTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            header="Duración" 
            body={duracionTemplate}
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="pesoTotal" 
            header="Peso Total" 
            body={pesoTotalTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-right"
          />
          <Column 
            field="temperatura" 
            header="Temp." 
            body={temperaturaTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="profundidad" 
            header="Prof." 
            body={profundidadTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            header="Coordenadas" 
            body={coordenadasTemplate}
            style={{ width: '120px' }}
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
        style={{ width: '1000px' }}
        header={isEditing ? 'Editar Cala' : 'Nueva Cala'}
        modal
        onHide={cerrarDialogo}
      >
        <CalaFaenaConsumoForm
          cala={selectedCala}
          onSave={() => {
            cargarCalas();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default CalaFaenaConsumo;
