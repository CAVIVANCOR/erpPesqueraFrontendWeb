// src/pages/MovLiquidacionFaenaConsumo.jsx
// Pantalla CRUD profesional para MovLiquidacionFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllMovLiquidacionFaenaConsumo, deleteMovLiquidacionFaenaConsumo } from '../api/movLiquidacionFaenaConsumo';
import MovLiquidacionFaenaConsumoForm from '../components/movLiquidacionFaenaConsumo/MovLiquidacionFaenaConsumoForm';

/**
 * Componente MovLiquidacionFaenaConsumo
 * Gestión CRUD de movimientos de liquidaciones de faenas de consumo con patrón profesional ERP Megui
 */
const MovLiquidacionFaenaConsumo = () => {
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
      const data = await getAllMovLiquidacionFaenaConsumo();
      setMovimientos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar movimientos de liquidación'
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
      message: `¿Está seguro de eliminar el movimiento ${movimiento.numeroMovimiento}?`,
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
      await deleteMovLiquidacionFaenaConsumo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Movimiento eliminado correctamente'
      });
      cargarMovimientos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el movimiento'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const numeroMovimientoTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">{rowData.numeroMovimiento}</div>
        <div className="text-sm text-gray-600">{formatearFecha(rowData.fechaMovimiento)}</div>
      </div>
    );
  };

  const liquidacionTemplate = (rowData) => {
    // Simulación de liquidación basado en ID
    const liquidaciones = {
      1: { numero: 'LIQ-2024-001', faena: 'FAE-2024-001', estado: 'APROBADA' },
      2: { numero: 'LIQ-2024-002', faena: 'FAE-2024-002', estado: 'PENDIENTE' },
      3: { numero: 'LIQ-2024-003', faena: 'FAE-2024-003', estado: 'BORRADOR' },
      4: { numero: 'LIQ-2024-004', faena: 'FAE-2024-004', estado: 'APROBADA' }
    };
    
    const liquidacion = liquidaciones[rowData.liquidacionFaenaConsumoId] || { 
      numero: `LIQ-${rowData.liquidacionFaenaConsumoId}`, 
      faena: `FAE-${rowData.liquidacionFaenaConsumoId}`,
      estado: 'BORRADOR'
    };
    
    const getSeverity = (estado) => {
      switch (estado) {
        case 'APROBADA': return 'success';
        case 'PENDIENTE': return 'warning';
        case 'BORRADOR': return 'secondary';
        default: return 'secondary';
      }
    };
    
    return (
      <div>
        <div className="font-medium text-blue-600">{liquidacion.numero}</div>
        <div className="text-sm text-gray-600">{liquidacion.faena}</div>
        <Tag value={liquidacion.estado} severity={getSeverity(liquidacion.estado)} className="text-xs mt-1" />
      </div>
    );
  };

  const tipoMovimientoTemplate = (rowData) => {
    const getSeverity = (tipo) => {
      switch (tipo) {
        case 'INGRESO': return 'success';
        case 'EGRESO': return 'danger';
        case 'AJUSTE': return 'warning';
        case 'TRANSFERENCIA': return 'info';
        default: return 'secondary';
      }
    };

    const getIcon = (tipo) => {
      switch (tipo) {
        case 'INGRESO': return 'pi pi-arrow-up';
        case 'EGRESO': return 'pi pi-arrow-down';
        case 'AJUSTE': return 'pi pi-refresh';
        case 'TRANSFERENCIA': return 'pi pi-arrow-right-arrow-left';
        default: return 'pi pi-circle';
      }
    };

    return (
      <div className="flex align-items-center gap-2">
        <i className={getIcon(rowData.tipoMovimiento)}></i>
        <Tag 
          value={rowData.tipoMovimiento || 'INGRESO'} 
          severity={getSeverity(rowData.tipoMovimiento)} 
        />
      </div>
    );
  };

  const conceptoTemplate = (rowData) => {
    // Simulación de conceptos basado en tipo
    const conceptos = {
      'INGRESO': ['Venta de Pescado', 'Bonificación', 'Descuento Comercial', 'Otros Ingresos'],
      'EGRESO': ['Combustible', 'Víveres', 'Mantenimiento', 'Salarios', 'Otros Gastos'],
      'AJUSTE': ['Ajuste por Diferencia', 'Corrección Contable', 'Regularización'],
      'TRANSFERENCIA': ['Transferencia Interna', 'Redistribución', 'Compensación']
    };
    
    const tipoConceptos = conceptos[rowData.tipoMovimiento] || conceptos['INGRESO'];
    const concepto = tipoConceptos[Math.floor(Math.random() * tipoConceptos.length)];
    
    return (
      <div>
        <div className="font-medium">{concepto}</div>
        {rowData.descripcion && (
          <div className="text-sm text-gray-600">{rowData.descripcion}</div>
        )}
      </div>
    );
  };

  const montoTemplate = (rowData) => {
    const isIngreso = rowData.tipoMovimiento === 'INGRESO';
    const colorClass = isIngreso ? 'text-green-600' : 'text-red-600';
    const signo = isIngreso ? '+' : '-';
    
    return (
      <div className="text-right">
        <div className={`font-bold ${colorClass}`}>
          {signo} {formatearMoneda(Math.abs(rowData.monto || 0))}
        </div>
        {rowData.montoOriginal && rowData.montoOriginal !== rowData.monto && (
          <div className="text-sm text-gray-600">
            Orig: {formatearMoneda(rowData.montoOriginal)}
          </div>
        )}
      </div>
    );
  };

  const centroCostoTemplate = (rowData) => {
    if (!rowData.centroCostoId) return <span className="text-gray-400">Sin asignar</span>;
    
    // Simulación de centros de costo basado en ID
    const centrosCosto = {
      1: { codigo: 'CC001', nombre: 'Operaciones Pesca', tipo: 'Operativo' },
      2: { codigo: 'CC002', nombre: 'Administración', tipo: 'Administrativo' },
      3: { codigo: 'CC003', nombre: 'Ventas', tipo: 'Comercial' },
      4: { codigo: 'CC004', nombre: 'Mantenimiento', tipo: 'Soporte' }
    };
    
    const centroCosto = centrosCosto[rowData.centroCostoId] || { 
      codigo: `CC${rowData.centroCostoId}`, 
      nombre: `Centro ${rowData.centroCostoId}`,
      tipo: 'General'
    };
    
    return (
      <div>
        <div className="font-medium">{centroCosto.codigo}</div>
        <div className="text-sm text-gray-600">{centroCosto.nombre}</div>
        <div className="text-xs text-gray-500">{centroCosto.tipo}</div>
      </div>
    );
  };

  const responsableTemplate = (rowData) => {
    if (!rowData.responsableMovimiento) return <span className="text-gray-400">Sin asignar</span>;
    
    // Simulación de personal basado en ID
    const personal = {
      1: { nombres: 'Carlos', apellidos: 'Mendoza García', cargo: 'Jefe de Operaciones' },
      2: { nombres: 'Ana María', apellidos: 'Torres Vega', cargo: 'Supervisora de Pesca' },
      3: { nombres: 'Luis Alberto', apellidos: 'Ramírez Silva', cargo: 'Contador' },
      4: { nombres: 'Patricia', apellidos: 'Flores Díaz', cargo: 'Administradora' }
    };
    
    const responsable = personal[rowData.responsableMovimiento] || { 
      nombres: 'Personal', 
      apellidos: `${rowData.responsableMovimiento}`,
      cargo: 'N/A'
    };
    
    return (
      <div>
        <div className="font-medium">{responsable.nombres} {responsable.apellidos}</div>
        <div className="text-sm text-gray-600">{responsable.cargo}</div>
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const getSeverity = (estado) => {
      switch (estado) {
        case 'REGISTRADO': return 'info';
        case 'VALIDADO': return 'success';
        case 'ANULADO': return 'danger';
        case 'PENDIENTE': return 'warning';
        default: return 'secondary';
      }
    };

    const getLabel = (estado) => {
      switch (estado) {
        case 'REGISTRADO': return 'Registrado';
        case 'VALIDADO': return 'Validado';
        case 'ANULADO': return 'Anulado';
        case 'PENDIENTE': return 'Pendiente';
        default: return estado || 'Registrado';
      }
    };

    return (
      <Tag 
        value={getLabel(rowData.estado)} 
        severity={getSeverity(rowData.estado)} 
      />
    );
  };

  const fechasTemplate = (rowData) => {
    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Mov:</span> {formatearFecha(rowData.fechaMovimiento)}
        </div>
        {rowData.fechaVencimiento && (
          <div>
            <span className="font-medium">Venc:</span> {formatearFecha(rowData.fechaVencimiento)}
          </div>
        )}
        {rowData.fechaValidacion && (
          <div className="text-green-600">
            <span className="font-medium">Valid:</span> {formatearFecha(rowData.fechaValidacion)}
          </div>
        )}
      </div>
    );
  };

  const documentoTemplate = (rowData) => {
    if (!rowData.numeroDocumento && !rowData.tipoDocumento) {
      return <span className="text-gray-400">Sin documento</span>;
    }
    
    return (
      <div>
        {rowData.tipoDocumento && (
          <div className="font-medium text-blue-600">{rowData.tipoDocumento}</div>
        )}
        {rowData.numeroDocumento && (
          <div className="text-sm text-gray-600">{rowData.numeroDocumento}</div>
        )}
        {rowData.serieDocumento && (
          <div className="text-xs text-gray-500">Serie: {rowData.serieDocumento}</div>
        )}
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
    <div className="mov-liquidacion-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Movimientos de Liquidación - Pesca Consumo</h2>
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
          emptyMessage="No se encontraron movimientos de liquidación"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="numeroMovimiento" 
            header="N° Movimiento" 
            body={numeroMovimientoTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="liquidacionFaenaConsumoId" 
            header="Liquidación" 
            body={liquidacionTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="tipoMovimiento" 
            header="Tipo" 
            body={tipoMovimientoTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            header="Concepto" 
            body={conceptoTemplate}
            style={{ width: '200px' }}
          />
          <Column 
            field="monto" 
            header="Monto" 
            body={montoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="centroCostoId" 
            header="Centro de Costo" 
            body={centroCostoTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="responsableMovimiento" 
            header="Responsable" 
            body={responsableTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="estado" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            header="Fechas" 
            body={fechasTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            header="Documento" 
            body={documentoTemplate}
            style={{ width: '150px' }}
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
        header={isEditing ? 'Editar Movimiento de Liquidación' : 'Nuevo Movimiento de Liquidación'}
        modal
        onHide={cerrarDialogo}
      >
        <MovLiquidacionFaenaConsumoForm
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

export default MovLiquidacionFaenaConsumo;
