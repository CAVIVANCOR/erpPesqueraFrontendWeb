// src/components/accesoInstalacion/cards/MovimientosCard.jsx
// Card profesional para gestión de movimientos (AccesoInstalacionDetalle)
// Maneja el historial completo de movimientos del visitante: Ingreso Inicial, Salida Temporal, Ingreso Temporal, Salida Definitiva

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { formatearFechaHora } from '../../../utils/utils';

/**
 * Card para gestión de movimientos de AccesoInstalacionDetalle
 * @param {Object} props.movimientos - Array de movimientos existentes
 * @param {Function} props.onMovimientoAgregado - Callback cuando se agrega un movimiento
 * @param {Array} props.areasDestino - Array de áreas físicas disponibles
 * @param {Array} props.tiposMovimientoAcceso - Array de tipos de movimiento desde TipoMovimientoAcceso
 * @param {boolean} props.modoEdicion - Si está en modo edición
 * @param {boolean} props.accesoSellado - Si el acceso está sellado (no permite modificaciones)
 */
const MovimientosCard = ({
  movimientos = [],
  onMovimientoAgregado,
  areasDestino = [],
  tiposMovimientoAcceso = [],
  modoEdicion = false,
  accesoSellado = false
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipoMovimientoId: '',
    fechaHora: new Date(),
    areaDestinoVisitaId: '',
    observaciones: ''
  });

  // Obtener el último movimiento para validaciones
  const ultimoMovimiento = movimientos.length > 0 
    ? movimientos[movimientos.length - 1] 
    : null;

  // Determinar qué tipos de movimiento están permitidos en el modal
  // REGLA DE NEGOCIO: El modal solo permite ingresos y salidas temporales
  // La Salida Definitiva se maneja con botón específico en el formulario principal
  const getTiposPermitidos = () => {
    if (!ultimoMovimiento) {
      // Si no hay movimientos, solo permitir Ingreso Inicial
      const resultado = tiposMovimientoAcceso.filter(t => t.value === 1);
      return resultado;
    }

    const ultimoTipo = Number(ultimoMovimiento.tipoMovimientoId);
    
    switch (ultimoTipo) {
      case 1: // Después de Ingreso Inicial: Solo Salida Temporal (NO Salida Definitiva)
        const resultado1 = tiposMovimientoAcceso.filter(t => t.value === 2);
        return resultado1;
      case 2: // Después de Salida Temporal: Ingreso Temporal
        const resultado2 = tiposMovimientoAcceso.filter(t => t.value === 3);
        return resultado2;
      case 3: // Después de Ingreso Temporal: Solo Salida Temporal (NO Salida Definitiva)
        const resultado3 = tiposMovimientoAcceso.filter(t => t.value === 2);
        return resultado3;
      case 4: // Después de Salida Definitiva: No se permite nada más
        return [];
      default:
        // Por defecto, solo permitir tipos temporales (excluir Salida Definitiva)
        const resultadoDefault = tiposMovimientoAcceso.filter(t => t.value !== 4);
        return resultadoDefault;
    }
  };

  // Template para mostrar el tipo de movimiento
  const tipoMovimientoBodyTemplate = (rowData) => {
    // Primero intentar obtener el nombre de la relación expandida
    if (rowData.tipoMovimiento && rowData.tipoMovimiento.nombre) {
      return rowData.tipoMovimiento.nombre;
    }
    
    // Si no hay relación expandida, usar el array tiposMovimientoAcceso como fallback
    const tipo = tiposMovimientoAcceso.find(t => Number(t.value) === Number(rowData.tipoMovimientoId));
    return tipo ? tipo.label : `ID: ${rowData.tipoMovimientoId}`;
  };

  // Template para mostrar fecha y hora
  const fechaHoraBodyTemplate = (rowData) => {
    return formatearFechaHora(rowData.fechaHora);
  };

  // Template para mostrar área destino
  const areaDestinoBodyTemplate = (rowData) => {
    if (!rowData.areaDestinoVisitaId) return '-';
    
    // Buscar el área en el array areasDestino que ya contiene los nombres de AreaFisicaSede
    const area = areasDestino.find(a => a.value === Number(rowData.areaDestinoVisitaId));
    return area ? area.label : `ID: ${rowData.areaDestinoVisitaId}`;
  };

  // Manejar agregar nuevo movimiento
  const handleAgregarMovimiento = () => {
    const tiposPermitidos = getTiposPermitidos();
    if (tiposPermitidos.length === 0 || accesoSellado) {
      return; // No se pueden agregar más movimientos
    }
    // Obtener la última área visitada del último movimiento
    const ultimaAreaVisitada = ultimoMovimiento?.areaDestinoVisitaId ? Number(ultimoMovimiento.areaDestinoVisitaId) : '';
    setNuevoMovimiento({
      tipoMovimientoId: tiposPermitidos[0].value,
      fechaHora: new Date(),
      areaDestinoVisitaId: ultimaAreaVisitada,
      observaciones: ''
    });
    setShowDialog(true);
  };
  // Confirmar nuevo movimiento
  const confirmarMovimiento = () => {
    if (onMovimientoAgregado) {
      onMovimientoAgregado(nuevoMovimiento);
    }
    setShowDialog(false);
    setNuevoMovimiento({
      tipoMovimientoId: '',
      fechaHora: new Date(),
      areaDestinoVisitaId: '',
      observaciones: ''
    });
  };

  // Determinar si se pueden agregar más movimientos
  const puedeAgregarMovimientos = () => {
    return getTiposPermitidos().length > 0 && !accesoSellado;
  };

  // Obtener el mensaje de estado actual
  const getMensajeEstado = () => {
    if (accesoSellado) {
      return {
        severity: 'warn',
        text: '🔒 Acceso sellado - No se pueden agregar más movimientos'
      };
    }

    if (!modoEdicion) {
      return {
        severity: 'info',
        text: 'ℹ️ Guarde el acceso para poder agregar movimientos'
      };
    }

    const tiposPermitidos = getTiposPermitidos();
    if (tiposPermitidos.length === 0) {
      return {
        severity: 'success',
        text: '✅ Proceso completado - No se requieren más movimientos'
      };
    }

    return null; // No mostrar mensaje si se pueden agregar movimientos
  };

  return (
    <Card
      title="Historial de Movimientos"
      subTitle="Registro completo de ingresos y salidas del visitante"
      className="mb-3"
    >
      <div className="p-fluid">
        {/* Información de estado */}
        <div className="mb-3 p-3 border-round" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex justify-content-between align-items-center">
            {getMensajeEstado() && (
              <div className={`p-mr-2 ${getMensajeEstado().severity === 'success' ? 'text-green-500' : getMensajeEstado().severity === 'warn' ? 'text-orange-500' : 'text-blue-500'}`}>
                {getMensajeEstado().text}
              </div>
            )}
            {puedeAgregarMovimientos() && (
              <Button
                type="button"
                label="Agregar Movimiento"
                icon="pi pi-plus"
                size="small"
                onClick={handleAgregarMovimiento}
                className="p-button-success"
              />
            )}
          </div>
        </div>

        {/* Tabla de movimientos */}
        <DataTable
          value={movimientos}
          emptyMessage="No hay movimientos registrados"
          size="small"
          stripedRows
        >
          <Column 
            field="tipoMovimientoId" 
            header="Tipo Movimiento" 
            body={tipoMovimientoBodyTemplate}
            style={{ width: '200px' }}
          />
          <Column 
            field="fechaHora" 
            header="Fecha y Hora" 
            body={fechaHoraBodyTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            field="areaDestinoVisitaId" 
            header="Área" 
            body={areaDestinoBodyTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            field="observaciones" 
            header="Observaciones"
          />
        </DataTable>

        {/* Dialog para agregar nuevo movimiento */}
        <Dialog
          visible={showDialog}
          style={{ width: '500px' }}
          header="Agregar Nuevo Movimiento"
          modal
          onHide={() => setShowDialog(false)}
        >
          <div className="p-fluid">
            <div className="field">
              <label htmlFor="tipoMovimiento" className="font-semibold">
                Tipo de Movimiento <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="tipoMovimiento"
                value={nuevoMovimiento.tipoMovimientoId}
                options={getTiposPermitidos()}
                onChange={(e) => setNuevoMovimiento({
                  ...nuevoMovimiento,
                  tipoMovimientoId: e.value
                })}
                placeholder="Seleccione tipo de movimiento"
                className="w-full"
              />
            </div>

            <div className="field">
              <label htmlFor="fechaHoraMovimiento" className="font-semibold">
                Fecha y Hora <span className="text-red-500">*</span>
              </label>
              <div 
                className="p-inputtext p-component w-full"
                style={{ 
                  backgroundColor: '#f8f9fa', 
                  color: '#495057',
                  fontWeight: 'bold',
                  cursor: 'not-allowed',
                  userSelect: 'none'
                }}
              >
                {formatearFechaHora(nuevoMovimiento.fechaHora)}
              </div>
              <small className="p-d-block text-muted mt-1">
                La fecha y hora se genera automáticamente
              </small>
            </div>

            <div className="field">
              <label htmlFor="areaMovimiento" className="font-semibold">
                Área Destino
              </label>
              <Dropdown
                id="areaMovimiento"
                value={nuevoMovimiento.areaDestinoVisitaId}
                options={areasDestino}
                onChange={(e) => setNuevoMovimiento({
                  ...nuevoMovimiento,
                  areaDestinoVisitaId: e.value
                })}
                placeholder="Seleccione área"
                className="w-full"
                showClear
              />
            </div>

            <div className="field">
              <label htmlFor="observacionesMovimiento" className="font-semibold">
                Observaciones
              </label>
              <InputTextarea
                id="observacionesMovimiento"
                value={nuevoMovimiento.observaciones}
                onChange={(e) => setNuevoMovimiento({
                  ...nuevoMovimiento,
                  observaciones: e.target.value.toUpperCase()
                })}
                rows={3}
                placeholder="Observaciones del movimiento"
                className="w-full"
                style={{ fontWeight: 'bold' }}
              />
            </div>

            <div className="flex justify-content-end gap-2 mt-4">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setShowDialog(false)}
              />
              <Button
                label="Confirmar"
                icon="pi pi-check"
                className="p-button-success"
                onClick={confirmarMovimiento}
                disabled={!nuevoMovimiento.tipoMovimientoId}
              />
            </div>
          </div>
        </Dialog>
      </div>
    </Card>
  );
};

export default MovimientosCard;
