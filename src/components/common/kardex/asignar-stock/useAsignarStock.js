// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\useAsignarStock.js

import { useState, useEffect } from "react";
import { useStockData } from "../../../../hooks/useStockData";

/**
 * ============================================================================
 * HOOK: useAsignarStock
 * ============================================================================
 * 
 * Maneja la lógica de asignación de stock simplificada (1 sola pantalla).
 * 
 * @param {Object} params - Parámetros del hook
 * @returns {Object} Estado y handlers
 */
export default function useAsignarStock({
  visible,
  empresaId,
  productoId,
  cantidadRequerida,
  detallePreFacturaId
}) {
  // ============================================================================
  // ESTADO
  // ============================================================================
  const [loading, setLoading] = useState(false);
  const [lotesDisponibles, setLotesDisponibles] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  // Hook de stock
  const stockHook = useStockData();

  // ============================================================================
  // CARGAR STOCK DISPONIBLE
  // ============================================================================
  useEffect(() => {
    if (visible && empresaId && productoId) {
      cargarStockDisponible();
    }
  }, [visible, empresaId, productoId]);

  const cargarStockDisponible = async () => {
    try {
      setLoading(true);
      
      // Cargar saldos detallados
      const saldos = await stockHook.cargarSaldosDetallados({
        empresaId: Number(empresaId),
        esCustodia: false
      });

      // Filtrar por producto y saldo > 0
      const saldosFiltrados = saldos.filter(
        (s) => Number(s.productoId) === Number(productoId) && Number(s.saldoCantidad) > 0
      );

      setLotesDisponibles(saldosFiltrados);
    } catch (error) {
      console.error("Error al cargar stock:", error);
      setLotesDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Aplicar asignación de un lote
   */
  const handleAplicarAsignacion = (saldoDetallado, cantidadAsignada) => {
    // Calcular peso proporcional
    const pesoAsignado = (cantidadAsignada / Number(saldoDetallado.saldoCantidad)) * Number(saldoDetallado.saldoPeso);

    // Crear asignación con snapshot completo
    const nuevaAsignacion = {
      detallePreFacturaId: detallePreFacturaId,
      saldoDetalladoId: saldoDetallado.id,
      
      // Snapshot completo del saldo
      empresaId: saldoDetallado.empresaId,
      almacenId: saldoDetallado.almacenId,
      productoId: saldoDetallado.productoId,
      clienteId: saldoDetallado.clienteId,
      esCustodia: saldoDetallado.esCustodia,
      lote: saldoDetallado.lote,
      fechaVencimiento: saldoDetallado.fechaVencimiento,
      fechaProduccion: saldoDetallado.fechaProduccion,
      fechaIngreso: saldoDetallado.fechaIngreso,
      numContenedor: saldoDetallado.numContenedor,
      nroSerie: saldoDetallado.nroSerie,
      estadoId: saldoDetallado.estadoId,
      estadoCalidadId: saldoDetallado.estadoCalidadId,
      ubicacionFisicaId: saldoDetallado.ubicacionFisicaId,
      saldoCantidad: Number(saldoDetallado.saldoCantidad),
      saldoPeso: Number(saldoDetallado.saldoPeso),
      
      // Asignación del usuario
      cantidadAsignada: Number(cantidadAsignada),
      pesoAsignado: Number(pesoAsignado)
    };

    setAsignaciones(prev => [...prev, nuevaAsignacion]);
  };

  /**
   * Quitar asignación
   */
  const handleQuitarAsignacion = (asignacion) => {
    setAsignaciones(prev => prev.filter(a => a.saldoDetalladoId !== asignacion.saldoDetalladoId));
  };

  /**
   * Limpiar todo
   */
  const handleLimpiar = () => {
    setAsignaciones([]);
    setLotesDisponibles([]);
  };

  /**
   * Validar asignaciones antes de confirmar
   */
  const validarAsignaciones = async () => {
    if (asignaciones.length === 0) {
      return {
        valido: false,
        mensaje: "Debe asignar al menos un lote"
      };
    }

    // Recargar saldos actuales
    const saldosActuales = await stockHook.cargarSaldosDetallados({
      empresaId: Number(empresaId),
      esCustodia: false
    });

    const conflictos = [];

    for (const asignacion of asignaciones) {
      const saldoActual = saldosActuales.find(s => s.id === asignacion.saldoDetalladoId);

      if (!saldoActual) {
        conflictos.push({
          tipo: 'NO_EXISTE',
          lote: asignacion.lote,
          mensaje: `El lote ${asignacion.lote} ya no existe en el sistema`
        });
        continue;
      }

      if (Number(saldoActual.saldoCantidad) < asignacion.cantidadAsignada) {
        conflictos.push({
          tipo: 'STOCK_INSUFICIENTE',
          lote: asignacion.lote,
          disponibleAntes: asignacion.saldoCantidad,
          disponibleAhora: saldoActual.saldoCantidad,
          solicitado: asignacion.cantidadAsignada,
          mensaje: `Stock insuficiente en lote ${asignacion.lote}. Disponible: ${saldoActual.saldoCantidad}, Solicitado: ${asignacion.cantidadAsignada}`
        });
      }
    }

    if (conflictos.length > 0) {
      return {
        valido: false,
        conflictos: conflictos
      };
    }

    return {
      valido: true
    };
  };

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    loading,
    lotesDisponibles,
    asignaciones,
    handleAplicarAsignacion,
    handleQuitarAsignacion,
    handleLimpiar,
    validarAsignaciones
  };
}