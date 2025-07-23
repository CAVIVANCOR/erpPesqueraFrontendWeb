// src/pages/CalaFaenaConsumoProduce.jsx
// Pantalla CRUD profesional para CalaFaenaConsumoProduce. Cumple regla transversal ERP Megui:
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
import { getAllCalaFaenaConsumoProduce, deleteCalaFaenaConsumoProduce } from '../api/calaFaenaConsumoProduce';
import CalaFaenaConsumoProduceForm from '../components/calaFaenaConsumoProduce/CalaFaenaConsumoProduceForm';

/**
 * Componente CalaFaenaConsumoProduce
 * Gestión CRUD de producción de calas de faenas con patrón profesional ERP Megui
 */
const CalaFaenaConsumoProduce = () => {
  const [producciones, setProducciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedProduccion, setSelectedProduccion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarProducciones();
  }, []);

  const cargarProducciones = async () => {
    try {
      setLoading(true);
      const data = await getAllCalaFaenaConsumoProduce();
      setProducciones(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar producciones de calas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedProduccion(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (produccion) => {
    setSelectedProduccion(produccion);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedProduccion(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (produccion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la producción ID ${produccion.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarProduccion(produccion.id)
    });
  };

  const eliminarProduccion = async (id) => {
    try {
      await deleteCalaFaenaConsumoProduce(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Producción eliminada correctamente'
      });
      cargarProducciones();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la producción'
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

  const tipoProduccionTemplate = (rowData) => {
    const tipos = {
      'FRESCO': { label: 'Fresco', severity: 'success' },
      'CONGELADO': { label: 'Congelado', severity: 'info' },
      'CONSERVA': { label: 'Conserva', severity: 'warning' },
      'HARINA': { label: 'Harina', severity: 'secondary' },
      'ACEITE': { label: 'Aceite', severity: 'help' }
    };
    
    const tipo = tipos[rowData.tipoProduccion] || { label: rowData.tipoProduccion, severity: 'secondary' };
    return <Tag value={tipo.label} severity={tipo.severity} />;
  };

  const fechaProduccionTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaProduccion);
  };

  const pesoProducidoTemplate = (rowData) => {
    return (
      <span className="font-bold text-green-600">
        {formatearPeso(rowData.pesoProducido)}
      </span>
    );
  };

  const temperaturaTemplate = (rowData) => {
    if (rowData.temperaturaAlmacenamiento === null || rowData.temperaturaAlmacenamiento === undefined) return '';
    
    let className = 'font-semibold';
    if (rowData.temperaturaAlmacenamiento < -10) {
      className += ' text-blue-600'; // Congelado
    } else if (rowData.temperaturaAlmacenamiento < 5) {
      className += ' text-cyan-600'; // Refrigerado
    } else {
      className += ' text-orange-600'; // Ambiente
    }
    
    return (
      <span className={className}>
        {formatearTemperatura(rowData.temperaturaAlmacenamiento)}
      </span>
    );
  };

  const calidadTemplate = (rowData) => {
    if (!rowData.calidad) return '';
    
    const calidades = {
      'PREMIUM': { label: 'Premium', severity: 'success' },
      'PRIMERA': { label: 'Primera', severity: 'info' },
      'SEGUNDA': { label: 'Segunda', severity: 'warning' },
      'TERCERA': { label: 'Tercera', severity: 'danger' }
    };
    
    const calidad = calidades[rowData.calidad] || { label: rowData.calidad, severity: 'secondary' };
    return <Tag value={calidad.label} severity={calidad.severity} />;
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
    <div className="cala-faena-consumo-produce-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Producción de Calas - Pesca Consumo</h2>
          <Button
            label="Nueva Producción"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={producciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron producciones"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="calaFaenaConsumoId" header="Cala ID" sortable style={{ width: '100px' }} />
          <Column 
            field="tipoProduccion" 
            header="Tipo" 
            body={tipoProduccionTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="fechaProduccion" 
            header="F. Producción" 
            body={fechaProduccionTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="pesoProducido" 
            header="Peso Producido" 
            body={pesoProducidoTemplate}
            sortable 
            style={{ width: '140px' }}
            className="text-right"
          />
          <Column 
            field="temperaturaAlmacenamiento" 
            header="Temp. Almac." 
            body={temperaturaTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="calidad" 
            header="Calidad" 
            body={calidadTemplate}
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
        style={{ width: '1000px' }}
        header={isEditing ? 'Editar Producción' : 'Nueva Producción'}
        modal
        onHide={cerrarDialogo}
      >
        <CalaFaenaConsumoProduceForm
          produccion={selectedProduccion}
          onSave={() => {
            cargarProducciones();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default CalaFaenaConsumoProduce;
