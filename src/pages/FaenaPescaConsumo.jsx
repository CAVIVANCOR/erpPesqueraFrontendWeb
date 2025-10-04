// src/pages/FaenaPescaConsumo.jsx
// Pantalla CRUD profesional para FaenaPescaConsumo. Cumple regla transversal ERP Megui:
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
import { getFaenasPescaConsumo, eliminarFaenaPescaConsumo } from '../api/faenaPescaConsumo';
import FaenaPescaConsumoForm from '../components/faenaPescaConsumo/FaenaPescaConsumoForm';

/**
 * Componente FaenaPescaConsumo
 * Gestión CRUD de faenas de pesca para consumo con patrón profesional ERP Megui
 */
const FaenaPescaConsumo = () => {
  const [faenas, setFaenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedFaena, setSelectedFaena] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarFaenas();
  }, []);

  const cargarFaenas = async () => {
    try {
      setLoading(true);
      const data = await getFaenasPescaConsumo();
      setFaenas(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar faenas de pesca consumo'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedFaena(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (faena) => {
    setSelectedFaena(faena);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedFaena(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (faena) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la faena del ${formatearFecha(faena.fechaSalida)}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarFaena(faena.id)
    });
  };

  const eliminarFaena = async (id) => {
    try {
      await eliminarFaenaPescaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Faena eliminada correctamente'
      });
      cargarFaenas();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la faena'
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

  const fechaSalidaTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaSalida);
  };

  const fechaHoraFondeoTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaHoraFondeo);
  };

  const estadoTemplate = (rowData) => {
    const ahora = new Date();
    const salida = new Date(rowData.fechaSalida);
    const fondeo = new Date(rowData.fechaHoraFondeo);
    
    let estado = 'Programada';
    let severity = 'info';
    
    if (ahora >= salida && ahora < fondeo) {
      estado = 'En Mar';
      severity = 'warning';
    } else if (ahora >= fondeo) {
      estado = 'Retornada';
      severity = 'success';
    }
    
    return <Tag value={estado} severity={severity} />;
  };

  const duracionTemplate = (rowData) => {
    if (!rowData.fechaSalida || !rowData.fechaHoraFondeo) return '';
    
    const salida = new Date(rowData.fechaSalida);
    const fondeo = new Date(rowData.fechaHoraFondeo);
    const diferencia = fondeo - salida;
    const horas = Math.round(diferencia / (1000 * 60 * 60));
    
    if (horas < 24) {
      return `${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h`;
    }
  };

  const descripcionTemplate = (rowData) => {
    if (!rowData.descripcion) return '';
    return (
      <span title={rowData.descripcion}>
        {rowData.descripcion.length > 30 ? 
          `${rowData.descripcion.substring(0, 30)}...` : 
          rowData.descripcion}
      </span>
    );
  };

  const informeTemplate = (rowData) => {
    if (!rowData.urlInformeFaena) return '';
    return (
      <Button
        icon="pi pi-file-pdf"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          window.open(rowData.urlInformeFaena, '_blank');
        }}
        tooltip="Ver informe PDF"
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
    <div className="faena-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Faenas de Pesca para Consumo</h2>
          <Button
            label="Nueva Faena"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={faenas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron faenas"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="novedadPescaConsumoId" header="Novedad ID" sortable style={{ width: '120px' }} />
          <Column field="bahiaId" header="Bahía ID" sortable style={{ width: '100px' }} />
          <Column field="embarcacionId" header="Embarcación ID" sortable style={{ width: '130px' }} />
          <Column field="motoristaId" header="Motorista ID" sortable style={{ width: '120px' }} />
          <Column field="patronId" header="Patrón ID" sortable style={{ width: '110px' }} />
          <Column 
            field="fechaSalida" 
            header="Fecha Salida" 
            body={fechaSalidaTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="fechaHoraFondeo" 
            header="Fecha/Hora Fondeo" 
            body={fechaHoraFondeoTemplate}
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
            header="Estado" 
            body={estadoTemplate}
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column field="puertoSalidaId" header="Pto. Salida" sortable style={{ width: '120px' }} />
          <Column field="puertoFondeoId" header="Pto. Fondeo" sortable style={{ width: '120px' }} />
          <Column field="puertoDescargaId" header="Pto. Descarga" sortable style={{ width: '130px' }} />
          <Column 
            field="descripcion" 
            header="Descripción" 
            body={descripcionTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          <Column 
            header="Informe" 
            body={informeTemplate}
            style={{ width: '80px' }}
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
        style={{ width: '1000px', height: '80vh' }}
        header={isEditing ? 'Editar Faena' : 'Nueva Faena'}
        modal
        onHide={cerrarDialogo}
        maximizable
      >
        <FaenaPescaConsumoForm
          faena={selectedFaena}
          onSave={() => {
            cargarFaenas();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default FaenaPescaConsumo;
