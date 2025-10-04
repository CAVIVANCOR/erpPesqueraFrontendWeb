// src/pages/DetCalaPescaConsumo.jsx
// Pantalla CRUD profesional para DetCalaPescaConsumo. Cumple regla transversal ERP Megui:
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
import { getDetCalaPescaConsumo, eliminarDetCalaPescaConsumo } from '../api/detCalaPescaConsumo';
import DetCalaPescaConsumoForm from '../components/detCalaPescaConsumo/DetCalaPescaConsumoForm';

/**
 * Componente DetCalaPescaConsumo
 * Gestión CRUD de detalles de especies por cala con patrón profesional ERP Megui
 */
const DetCalaPescaConsumo = () => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDetalles();
  }, []);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getDetCalaPescaConsumo();
      setDetalles(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar detalles de calas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedDetalle(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (detalle) => {
    setSelectedDetalle(detalle);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedDetalle(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el detalle de especie ID ${detalle.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDetalle(detalle.id)
    });
  };

  const eliminarDetalle = async (id) => {
    try {
      await eliminarDetCalaPescaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle eliminado correctamente'
      });
      cargarDetalles();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el detalle'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const formatearPorcentaje = (porcentaje) => {
    if (!porcentaje) return '0.00%';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(porcentaje) + '%';
  };

  const especieTemplate = (rowData) => {
    // Simulación de nombres de especies basado en ID
    const especies = {
      1: 'Anchoveta',
      2: 'Jurel',
      3: 'Caballa',
      4: 'Perico',
      5: 'Bonito',
      6: 'Sardina',
      7: 'Merluza',
      8: 'Atún'
    };
    
    const nombreEspecie = especies[rowData.especieId] || `Especie ${rowData.especieId}`;
    
    return (
      <div>
        <span className="font-bold text-blue-600">{nombreEspecie}</span>
        <div className="text-sm text-gray-600">ID: {rowData.especieId}</div>
      </div>
    );
  };

  const pesoEspecieTemplate = (rowData) => {
    return (
      <span className="font-bold text-green-600">
        {formatearPeso(rowData.pesoEspecie)}
      </span>
    );
  };

  const porcentajeTemplate = (rowData) => {
    if (!rowData.porcentajeEspecie) return '';
    
    let className = 'font-semibold';
    if (rowData.porcentajeEspecie >= 50) {
      className += ' text-green-600'; // Especie dominante
    } else if (rowData.porcentajeEspecie >= 20) {
      className += ' text-blue-600'; // Especie significativa
    } else {
      className += ' text-orange-600'; // Especie menor
    }
    
    return (
      <span className={className}>
        {formatearPorcentaje(rowData.porcentajeEspecie)}
      </span>
    );
  };

  const tallaPromedioTemplate = (rowData) => {
    if (!rowData.tallaPromedio) return '';
    return `${rowData.tallaPromedio} cm`;
  };

  const estadoFrescuraTemplate = (rowData) => {
    if (!rowData.estadoFrescura) return '';
    
    const estados = {
      'EXCELENTE': { label: 'Excelente', severity: 'success' },
      'BUENO': { label: 'Bueno', severity: 'info' },
      'REGULAR': { label: 'Regular', severity: 'warning' },
      'MALO': { label: 'Malo', severity: 'danger' }
    };
    
    const estado = estados[rowData.estadoFrescura] || { label: rowData.estadoFrescura, severity: 'secondary' };
    return <Tag value={estado.label} severity={estado.severity} />;
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
    <div className="det-cala-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Detalles de Especies por Cala - Pesca Consumo</h2>
          <Button
            label="Nuevo Detalle"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={detalles}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron detalles de especies"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="calaFaenaConsumoId" header="Cala ID" sortable style={{ width: '100px' }} />
          <Column 
            field="especieId" 
            header="Especie" 
            body={especieTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="pesoEspecie" 
            header="Peso" 
            body={pesoEspecieTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="porcentajeEspecie" 
            header="%" 
            body={porcentajeTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="tallaPromedio" 
            header="Talla Prom." 
            body={tallaPromedioTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="estadoFrescura" 
            header="Frescura" 
            body={estadoFrescuraTemplate}
            sortable 
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
        style={{ width: '900px' }}
        header={isEditing ? 'Editar Detalle de Especie' : 'Nuevo Detalle de Especie'}
        modal
        onHide={cerrarDialogo}
      >
        <DetCalaPescaConsumoForm
          detalle={selectedDetalle}
          onSave={() => {
            cargarDetalles();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetCalaPescaConsumo;
