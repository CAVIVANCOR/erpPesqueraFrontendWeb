// src/pages/DetCalaFaenaConsumoProduce.jsx
// Pantalla CRUD profesional para DetCalaFaenaConsumoProduce. Cumple regla transversal ERP Megui:
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
import { getAllDetCalaFaenaConsumoProduce, deleteDetCalaFaenaConsumoProduce } from '../api/detCalaFaenaConsumoProduce';
import DetCalaFaenaConsumoProduceForm from '../components/detCalaFaenaConsumoProduce/DetCalaFaenaConsumoProduceForm';

/**
 * Componente DetCalaFaenaConsumoProduce
 * Gestión CRUD de detalles de producción de calas con patrón profesional ERP Megui
 */
const DetCalaFaenaConsumoProduce = () => {
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
      const data = await getAllDetCalaFaenaConsumoProduce();
      setDetalles(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar detalles de producción'
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
      message: `¿Está seguro de eliminar el detalle de producción ID ${detalle.id}?`,
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
      await deleteDetCalaFaenaConsumoProduce(id);
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

  const productoTemplate = (rowData) => {
    // Simulación de productos basado en ID
    const productos = {
      1: 'Filete de Anchoveta Fresco',
      2: 'Jurel Entero Congelado',
      3: 'Conserva de Caballa',
      4: 'Harina de Pescado Premium',
      5: 'Aceite de Pescado Refinado',
      6: 'Perico Fresco Exportación',
      7: 'Bonito en Conserva',
      8: 'Sardina Congelada'
    };
    
    const nombreProducto = productos[rowData.productoId] || `Producto ${rowData.productoId}`;
    
    return (
      <div>
        <span className="font-bold text-blue-600">{nombreProducto}</span>
        <div className="text-sm text-gray-600">ID: {rowData.productoId}</div>
      </div>
    );
  };

  const pesoProductoTemplate = (rowData) => {
    return (
      <span className="font-bold text-green-600">
        {formatearPeso(rowData.pesoProducto)}
      </span>
    );
  };

  const porcentajeTemplate = (rowData) => {
    if (!rowData.porcentajeProducto) return '';
    
    let className = 'font-semibold';
    if (rowData.porcentajeProducto >= 50) {
      className += ' text-green-600'; // Producto principal
    } else if (rowData.porcentajeProducto >= 20) {
      className += ' text-blue-600'; // Producto significativo
    } else {
      className += ' text-orange-600'; // Producto menor
    }
    
    return (
      <span className={className}>
        {formatearPorcentaje(rowData.porcentajeProducto)}
      </span>
    );
  };

  const rendimientoTemplate = (rowData) => {
    if (!rowData.rendimiento) return '';
    
    let className = 'font-semibold';
    if (rowData.rendimiento >= 80) {
      className += ' text-green-600'; // Excelente rendimiento
    } else if (rowData.rendimiento >= 60) {
      className += ' text-blue-600'; // Buen rendimiento
    } else if (rowData.rendimiento >= 40) {
      className += ' text-orange-600'; // Rendimiento regular
    } else {
      className += ' text-red-600'; // Bajo rendimiento
    }
    
    return (
      <span className={className}>
        {formatearPorcentaje(rowData.rendimiento)}
      </span>
    );
  };

  const mermaTemplate = (rowData) => {
    if (!rowData.merma) return '';
    
    let className = 'font-semibold';
    if (rowData.merma <= 5) {
      className += ' text-green-600'; // Merma baja
    } else if (rowData.merma <= 15) {
      className += ' text-orange-600'; // Merma normal
    } else {
      className += ' text-red-600'; // Merma alta
    }
    
    return (
      <span className={className}>
        {formatearPorcentaje(rowData.merma)}
      </span>
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
    <div className="det-cala-faena-consumo-produce-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Detalles de Producción de Calas - Pesca Consumo</h2>
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
          emptyMessage="No se encontraron detalles de producción"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="calaFaenaConsumoProduceId" header="Prod. ID" sortable style={{ width: '100px' }} />
          <Column 
            field="productoId" 
            header="Producto" 
            body={productoTemplate}
            sortable 
            style={{ width: '200px' }}
          />
          <Column 
            field="pesoProducto" 
            header="Peso" 
            body={pesoProductoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="porcentajeProducto" 
            header="%" 
            body={porcentajeTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="rendimiento" 
            header="Rendimiento" 
            body={rendimientoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="merma" 
            header="Merma" 
            body={mermaTemplate}
            sortable 
            style={{ width: '100px' }}
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
        header={isEditing ? 'Editar Detalle de Producción' : 'Nuevo Detalle de Producción'}
        modal
        onHide={cerrarDialogo}
      >
        <DetCalaFaenaConsumoProduceForm
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

export default DetCalaFaenaConsumoProduce;
