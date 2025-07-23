// src/pages/KardexAlmacen.jsx
// Pantalla CRUD profesional para KardexAlmacen. Cumple regla transversal ERP Megui:
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
import { getKardexAlmacen, eliminarKardexAlmacen } from '../api/kardexAlmacen';
import KardexAlmacenForm from '../components/kardexAlmacen/KardexAlmacenForm';

/**
 * Componente KardexAlmacen
 * Gestión CRUD de movimientos de kardex de almacén con patrón profesional ERP Megui
 * Sistema complejo de trazabilidad de inventario con múltiples campos y relaciones
 */
const KardexAlmacen = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await getKardexAlmacen();
      setMovimientos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar movimientos de kardex'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedMovimiento(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedMovimiento(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento de kardex ${movimiento.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarMovimiento(movimiento.id)
    });
  };

  const eliminarMovimiento = async (id) => {
    try {
      await eliminarKardexAlmacen(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Movimiento de kardex eliminado correctamente'
      });
      cargarMovimientos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el movimiento de kardex'
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

  const formatearDecimal = (valor) => {
    if (valor === null || valor === undefined) return '';
    return Number(valor).toFixed(2);
  };

  const tipoMovimientoTemplate = (rowData) => {
    const severity = rowData.ingreso ? 'success' : 'danger';
    const value = rowData.ingreso ? 'INGRESO' : 'EGRESO';
    return <Tag value={value} severity={severity} />;
  };

  const custodiaTemplate = (rowData) => {
    return rowData.custodia ? 
      <i className="pi pi-check text-green-500" /> : 
      <i className="pi pi-times text-red-500" />;
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
    <div className="kardex-almacen-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Kardex de Almacén</h2>
          <Button
            label="Nuevo Movimiento"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={movimientos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron movimientos de kardex"
          scrollable
          scrollHeight="700px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="empresaId" header="Empresa" sortable style={{ width: '100px' }} />
          <Column field="almacenId" header="Almacén" sortable style={{ width: '100px' }} />
          <Column field="productoId" header="Producto" sortable style={{ width: '100px' }} />
          <Column field="clienteId" header="Cliente" sortable style={{ width: '100px' }} />
          <Column 
            field="custodia" 
            header="Custodia" 
            body={custodiaTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="fechaMovimiento" 
            header="F. Movimiento" 
            body={(rowData) => formatearFecha(rowData.fechaMovimiento)}
            sortable 
            style={{ width: '130px' }}
          />
          <Column 
            field="ingreso" 
            header="Tipo" 
            body={tipoMovimientoTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column field="tipoMovimientoId" header="Tipo Mov." sortable style={{ width: '100px' }} />
          <Column field="conceptoMovAlmacenId" header="Concepto" sortable style={{ width: '100px' }} />
          <Column 
            field="cantidad" 
            header="Cantidad" 
            body={(rowData) => formatearDecimal(rowData.cantidad)}
            sortable 
            className="text-right"
            style={{ width: '100px' }}
          />
          <Column 
            field="peso" 
            header="Peso" 
            body={(rowData) => formatearDecimal(rowData.peso)}
            sortable 
            className="text-right"
            style={{ width: '100px' }}
          />
          <Column field="lote" header="Lote" sortable style={{ width: '120px' }} />
          <Column 
            field="saldoCantidad" 
            header="Saldo Cantidad" 
            body={(rowData) => formatearDecimal(rowData.saldoCantidad)}
            sortable 
            className="text-right"
            style={{ width: '130px' }}
          />
          <Column 
            field="saldoPeso" 
            header="Saldo Peso" 
            body={(rowData) => formatearDecimal(rowData.saldoPeso)}
            sortable 
            className="text-right"
            style={{ width: '120px' }}
          />
          <Column 
            field="costoUnitarioPromedio" 
            header="Costo Unit. Prom." 
            body={(rowData) => formatearDecimal(rowData.costoUnitarioPromedio)}
            sortable 
            className="text-right"
            style={{ width: '140px' }}
          />
          <Column field="numContenedor" header="Contenedor" sortable style={{ width: '120px' }} />
          <Column field="nroSerie" header="Serie" sortable style={{ width: '120px' }} />
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
        header={isEditing ? 'Editar Movimiento de Kardex' : 'Nuevo Movimiento de Kardex'}
        modal
        onHide={cerrarDialogo}
      >
        <KardexAlmacenForm
          movimiento={selectedMovimiento}
          onSave={() => {
            cargarMovimientos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default KardexAlmacen;
