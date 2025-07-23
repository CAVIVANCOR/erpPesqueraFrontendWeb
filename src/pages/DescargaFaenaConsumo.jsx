// src/pages/DescargaFaenaConsumo.jsx
// Pantalla CRUD profesional para DescargaFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllDescargaFaenaConsumo, deleteDescargaFaenaConsumo } from '../api/descargaFaenaConsumo';
import DescargaFaenaConsumoForm from '../components/descargaFaenaConsumo/DescargaFaenaConsumoForm';

/**
 * Componente DescargaFaenaConsumo
 * Gestión CRUD de descargas de faenas de consumo con patrón profesional ERP Megui
 */
const DescargaFaenaConsumo = () => {
  const [descargas, setDescargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDescarga, setSelectedDescarga] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDescargas();
  }, []);

  const cargarDescargas = async () => {
    try {
      setLoading(true);
      const data = await getAllDescargaFaenaConsumo();
      setDescargas(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar descargas de faena'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedDescarga(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (descarga) => {
    setSelectedDescarga(descarga);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedDescarga(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (descarga) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la descarga ${descarga.numeroDescarga}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDescarga(descarga.id)
    });
  };

  const eliminarDescarga = async (id) => {
    try {
      await deleteDescargaFaenaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Descarga eliminada correctamente'
      });
      cargarDescargas();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la descarga'
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

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const numeroDescargaTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <span className="font-bold text-primary">{rowData.numeroDescarga}</span>
      </div>
    );
  };

  const fechaDescargaTemplate = (rowData) => {
    return formatearFecha(rowData.fechaDescarga);
  };

  const faenaTemplate = (rowData) => {
    // Simulación de faena basado en ID
    const faenas = {
      1: 'FAE-2024-001',
      2: 'FAE-2024-002',
      3: 'FAE-2024-003',
      4: 'FAE-2024-004'
    };
    
    return (
      <div>
        <div className="font-medium">{faenas[rowData.faenaPescaConsumoId] || `Faena ${rowData.faenaPescaConsumoId}`}</div>
      </div>
    );
  };

  const embarcacionTemplate = (rowData) => {
    // Simulación de embarcación basado en ID
    const embarcaciones = {
      1: { nombre: 'Don Lucho I', matricula: 'CO-12345-PM' },
      2: { nombre: 'María del Carmen', matricula: 'CO-67890-PM' },
      3: { nombre: 'San Pedro II', matricula: 'CO-11111-PM' },
      4: { nombre: 'Estrella del Mar', matricula: 'CO-22222-PM' }
    };
    
    const embarcacion = embarcaciones[rowData.embarcacionId] || { nombre: `Embarcación ${rowData.embarcacionId}`, matricula: 'N/A' };
    
    return (
      <div>
        <div className="font-medium">{embarcacion.nombre}</div>
        <div className="text-sm text-gray-600">{embarcacion.matricula}</div>
      </div>
    );
  };

  const puertoTemplate = (rowData) => {
    // Simulación de puerto basado en ID
    const puertos = {
      1: { nombre: 'Puerto de Paita', codigo: 'PAITA' },
      2: { nombre: 'Puerto de Chimbote', codigo: 'CHIMB' },
      3: { nombre: 'Puerto del Callao', codigo: 'CALLA' },
      4: { nombre: 'Puerto de Pisco', codigo: 'PISCO' }
    };
    
    const puerto = puertos[rowData.puertoDescargaId] || { nombre: `Puerto ${rowData.puertoDescargaId}`, codigo: 'N/A' };
    
    return (
      <div>
        <div className="font-medium">{puerto.nombre}</div>
        <div className="text-sm text-gray-600">{puerto.codigo}</div>
      </div>
    );
  };

  const pesoDescargadoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-green-600">{formatearPeso(rowData.pesoTotalDescargado)}</div>
      </div>
    );
  };

  const pesoDeclaradoTemplate = (rowData) => {
    if (!rowData.pesoTotalDeclarado) return <span className="text-gray-400">No declarado</span>;
    
    return (
      <div className="text-right">
        <div className="font-medium text-blue-600">{formatearPeso(rowData.pesoTotalDeclarado)}</div>
      </div>
    );
  };

  const diferenciaPesoTemplate = (rowData) => {
    if (!rowData.pesoTotalDeclarado) return <span className="text-gray-400">N/A</span>;
    
    const diferencia = rowData.pesoTotalDescargado - rowData.pesoTotalDeclarado;
    const color = diferencia > 0 ? 'text-green-600' : diferencia < 0 ? 'text-red-600' : 'text-gray-600';
    
    return (
      <div className="text-right">
        <span className={`font-bold ${color}`}>
          {diferencia > 0 ? '+' : ''}{formatearPeso(diferencia)}
        </span>
      </div>
    );
  };

  const estadoProductoTemplate = (rowData) => {
    const getSeverity = (estado) => {
      switch (estado) {
        case 'FRESCO': return 'success';
        case 'REFRIGERADO': return 'info';
        case 'CONGELADO': return 'primary';
        default: return 'secondary';
      }
    };

    return (
      <Tag 
        value={rowData.estadoProducto || 'FRESCO'} 
        severity={getSeverity(rowData.estadoProducto)} 
      />
    );
  };

  const calidadProductoTemplate = (rowData) => {
    const getSeverity = (calidad) => {
      switch (calidad) {
        case 'PREMIUM': return 'success';
        case 'PRIMERA': return 'info';
        case 'SEGUNDA': return 'warning';
        case 'TERCERA': return 'danger';
        default: return 'secondary';
      }
    };

    return (
      <Tag 
        value={rowData.calidadProducto || 'PRIMERA'} 
        severity={getSeverity(rowData.calidadProducto)} 
      />
    );
  };

  const estadoDescargaTemplate = (rowData) => {
    const getSeverity = (estado) => {
      switch (estado) {
        case 'COMPLETADA': return 'success';
        case 'EN_PROCESO': return 'info';
        case 'PENDIENTE': return 'warning';
        case 'CANCELADA': return 'danger';
        default: return 'secondary';
      }
    };

    return (
      <Tag 
        value={rowData.estadoDescarga || 'PENDIENTE'} 
        severity={getSeverity(rowData.estadoDescarga)} 
      />
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
    <div className="descarga-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Descargas de Faenas - Pesca Consumo</h2>
          <Button
            label="Nueva Descarga"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={descargas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron descargas de faena"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="numeroDescarga" 
            header="N° Descarga" 
            body={numeroDescargaTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="fechaDescarga" 
            header="Fecha" 
            body={fechaDescargaTemplate}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="faenaPescaConsumoId" 
            header="Faena" 
            body={faenaTemplate}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="embarcacionId" 
            header="Embarcación" 
            body={embarcacionTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="puertoDescargaId" 
            header="Puerto" 
            body={puertoTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="pesoTotalDescargado" 
            header="Peso Descargado" 
            body={pesoDescargadoTemplate}
            sortable 
            style={{ width: '140px' }}
            className="text-right"
          />
          <Column 
            field="pesoTotalDeclarado" 
            header="Peso Declarado" 
            body={pesoDeclaradoTemplate}
            sortable 
            style={{ width: '140px' }}
            className="text-right"
          />
          <Column 
            header="Diferencia" 
            body={diferenciaPesoTemplate}
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="estadoProducto" 
            header="Estado" 
            body={estadoProductoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="calidadProducto" 
            header="Calidad" 
            body={calidadProductoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="estadoDescarga" 
            header="Estado Descarga" 
            body={estadoDescargaTemplate}
            sortable 
            style={{ width: '140px' }}
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
        style={{ width: '900px' }}
        header={isEditing ? 'Editar Descarga de Faena' : 'Nueva Descarga de Faena'}
        modal
        onHide={cerrarDialogo}
      >
        <DescargaFaenaConsumoForm
          descarga={selectedDescarga}
          onSave={() => {
            cargarDescargas();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DescargaFaenaConsumo;
