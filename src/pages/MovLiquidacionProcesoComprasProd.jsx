/**
 * Componente para gestión de Movimientos de Liquidación de Proceso de Compras de Producción
 * 
 * Características:
 * - CRUD completo con DataTable
 * - Edición por clic en fila
 * - Eliminación con confirmación (solo superusuario/admin)
 * - Gestión de tipos de movimiento y montos
 * - Relación con liquidaciones de proceso y centros de costo
 * - Control de fechas de movimiento y registro
 * - Toast para feedback visual
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { getMovLiquidacionesProcesoComprasProd, crearMovLiquidacionProcesoComprasProd, actualizarMovLiquidacionProcesoComprasProd, eliminarMovLiquidacionProcesoComprasProd } from '../api/movLiquidacionProcesoComprasProd';
import { getLiquidacionesProcesoComprasProd } from '../api/liquidacionProcesoComprasProd';
import { getTiposMovEntregaRendir } from '../api/tipoMovEntregaRendir';
import { getCentrosCosto } from '../api/centroCosto';
import { useAuthStore } from '../shared/stores/useAuthStore';
import MovLiquidacionProcesoComprasProdForm from '../components/movLiquidacionProcesoComprasProd/MovLiquidacionProcesoComprasProdForm';

/**
 * Componente principal para gestión de movimientos de liquidación de proceso de compras de producción
 * Implementa las reglas transversales del ERP Megui
 */
const MovLiquidacionProcesoComprasProd = () => {
  // Estados principales
  const [movimientos, setMovimientos] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Referencias y stores
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Función para cargar todos los datos necesarios
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [movimientosData, liquidacionesData, tiposMovData, centrosCostoData] = await Promise.all([
        getMovLiquidacionesProcesoComprasProd(),
        getLiquidacionesProcesoComprasProd(),
        getTiposMovEntregaRendir(),
        getCentrosCosto()
      ]);
      
      setMovimientos(movimientosData);
      setLiquidaciones(liquidacionesData);
      setTiposMovimiento(tiposMovData);
      setCentrosCosto(centrosCostoData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar creación de nuevo movimiento
   */
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  /**
   * Manejar edición de movimiento (clic en fila)
   */
  const handleEdit = (rowData) => {
    setEditingItem(rowData);
    setShowForm(true);
  };

  /**
   * Manejar eliminación de movimiento
   * Solo visible para superusuario o admin
   */
  const handleDelete = (rowData) => {
    const liquidacion = liquidaciones.find(l => Number(l.id) === Number(rowData.liquidacionProcesoComprasProdId));
    const tipoMov = tiposMovimiento.find(t => Number(t.id) === Number(rowData.tipoMovimientoId));
    
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento "${tipoMov?.nombre || 'Sin tipo'}" de S/ ${Number(rowData.monto).toFixed(2)}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await eliminarMovLiquidacionProcesoComprasProd(rowData.id);
          await cargarDatos();
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Movimiento eliminado correctamente',
            life: 3000
          });
        } catch (error) {
          console.error('Error al eliminar:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al eliminar el movimiento',
            life: 3000
          });
        }
      }
    });
  };

  /**
   * Manejar guardado desde el formulario
   */
  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await actualizarMovLiquidacionProcesoComprasProd(editingItem.id, data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento actualizado correctamente',
          life: 3000
        });
      } else {
        await crearMovLiquidacionProcesoComprasProd(data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento creado correctamente',
          life: 3000
        });
      }
      
      setShowForm(false);
      setEditingItem(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al guardar el movimiento',
        life: 3000
      });
    }
  };

  /**
   * Template para mostrar liquidación de proceso
   */
  const liquidacionTemplate = (rowData) => {
    const liquidacion = liquidaciones.find(l => Number(l.id) === Number(rowData.liquidacionProcesoComprasProdId));
    return liquidacion ? (
      <div>
        <div className="font-semibold">
          {liquidacion.cotizacionCompras?.numeroReferencia || 'Sin referencia'}
        </div>
        <div className="text-sm text-gray-600">
          {liquidacion.empresa?.nombre || 'Sin empresa'}
        </div>
        <div className="text-sm">
          <Tag 
            value={liquidacion.verificadorId ? 'Verificada' : 'Pendiente'} 
            severity={liquidacion.verificadorId ? 'success' : 'warning'} 
            size="small"
          />
        </div>
      </div>
    ) : 'No encontrada';
  };

  /**
   * Template para mostrar tipo de movimiento
   */
  const tipoMovimientoTemplate = (rowData) => {
    const tipoMov = tiposMovimiento.find(t => Number(t.id) === Number(rowData.tipoMovimientoId));
    return tipoMov ? (
      <div>
        <div className="font-semibold">{tipoMov.nombre}</div>
        <div className="text-sm text-gray-600">{tipoMov.descripcion || 'Sin descripción'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar centro de costo
   */
  const centroCostoTemplate = (rowData) => {
    if (!rowData.centroCostoId) {
      return <Tag value="Sin centro de costo" severity="secondary" size="small" />;
    }
    
    const centroCosto = centrosCosto.find(cc => Number(cc.id) === Number(rowData.centroCostoId));
    return centroCosto ? (
      <div>
        <div className="font-semibold">{centroCosto.nombre}</div>
        <div className="text-sm text-gray-600">{centroCosto.codigo || 'Sin código'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar monto
   */
  const montoTemplate = (rowData) => {
    const monto = Number(rowData.monto);
    return (
      <div className={`text-right font-semibold ${monto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        S/ {monto.toFixed(2)}
      </div>
    );
  };

  /**
   * Template para mostrar fecha de movimiento
   */
  const fechaMovimientoTemplate = (rowData) => {
    const fecha = new Date(rowData.fechaMovimiento);
    return (
      <div>
        <div className="font-semibold">{fecha.toLocaleDateString('es-PE')}</div>
        <div className="text-sm text-gray-600">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    );
  };

  /**
   * Template para mostrar fecha de registro
   */
  const fechaRegistroTemplate = (rowData) => {
    const fecha = new Date(rowData.fechaRegistro);
    return (
      <div>
        <div className="font-semibold">{fecha.toLocaleDateString('es-PE')}</div>
        <div className="text-sm text-gray-600">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    );
  };

  /**
   * Template para acciones
   * Solo muestra eliminar para superusuario o admin
   */
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            size="small"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Toolbar del componente
   */
  const toolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <h4 className="m-0">Movimientos de Liquidación - Proceso Compras</h4>
        <Button
          label="Nuevo Movimiento"
          icon="pi pi-plus"
          onClick={handleCreate}
          className="p-button-primary"
        />
      </div>
    );
  };

  /**
   * Header del DataTable con filtro global
   */
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Movimientos</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <input
          type="search"
          placeholder="Buscar..."
          className="p-inputtext p-component"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </span>
    </div>
  );

  return (
    <div className="movliquidacionprocesocomprasprod-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <Card>
        <Toolbar className="mb-4" template={toolbarTemplate} />
        
        <DataTable
          value={movimientos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron movimientos"
          onRowClick={(e) => handleEdit(e.data)}
          selectionMode="single"
          className="datatable-responsive"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="liquidacionProceso" 
            header="Liquidación de Proceso" 
            body={liquidacionTemplate}
            sortable
            style={{ minWidth: '250px' }}
          />
          <Column 
            field="tipoMovimiento" 
            header="Tipo Movimiento" 
            body={tipoMovimientoTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="centroCosto" 
            header="Centro de Costo" 
            body={centroCostoTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="monto" 
            header="Monto" 
            body={montoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="fechaMovimiento" 
            header="Fecha Movimiento" 
            body={fechaMovimientoTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="fechaRegistro" 
            header="Fecha Registro" 
            body={fechaRegistroTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: '100px' }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </Card>

      {showForm && (
        <MovLiquidacionProcesoComprasProdForm
          visible={showForm}
          onHide={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          editingItem={editingItem}
          liquidaciones={liquidaciones}
          tiposMovimiento={tiposMovimiento}
          centrosCosto={centrosCosto}
        />
      )}
    </div>
  );
};

export default MovLiquidacionProcesoComprasProd;
