// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\asignarStockUtils.js

/**
 * ============================================================================
 * UTILIDADES PARA ASIGNACIÓN DE STOCK
 * ============================================================================
 * 
 * Funciones puras para lógica de negocio de asignación de stock.
 * Todas las funciones son testeables y reutilizables.
 * 
 * @author ERP Megui - Sistema Profesional
 * @version 1.0.0
 */

/**
 * Agrupa saldos de stock por almacén
 * @param {Array} saldos - Array de saldos detallados
 * @returns {Array} Array de objetos agrupados por almacén
 */
export const agruparPorAlmacen = (saldos) => {
  if (!saldos || saldos.length === 0) return [];

  const grupos = {};

  saldos.forEach(saldo => {
    const almacenId = Number(saldo.almacenId);
    
    if (!grupos[almacenId]) {
      grupos[almacenId] = {
        almacenId: almacenId,
        almacenNombre: saldo.almacen?.nombre || `Almacén ${almacenId}`,
        cantidadTotal: 0,
        pesoTotal: 0,
        numLotes: 0,
        lotes: []
      };
    }

    grupos[almacenId].cantidadTotal += Number(saldo.saldoCantidad || 0);
    grupos[almacenId].pesoTotal += Number(saldo.saldoPeso || 0);
    grupos[almacenId].numLotes += 1;
    grupos[almacenId].lotes.push(saldo);
  });

  return Object.values(grupos);
};

/**
 * Calcula el progreso de asignación
 * @param {Array} asignaciones - Array de asignaciones actuales
 * @param {number} cantidadRequerida - Cantidad total requerida
 * @returns {Object} { cantidadAsignada, porcentajeAsignado }
 */
export const calcularProgreso = (asignaciones, cantidadRequerida) => {
  const cantidadAsignada = asignaciones.reduce(
    (sum, a) => sum + Number(a.cantidadAsignada || 0),
    0
  );

  const porcentajeAsignado = cantidadRequerida > 0
    ? Math.min(100, (cantidadAsignada / cantidadRequerida) * 100)
    : 0;

  return {
    cantidadAsignada,
    porcentajeAsignado
  };
};

/**
 * Aplica algoritmo FIFO para asignación automática de lotes
 * @param {Array} lotes - Array de lotes disponibles
 * @param {number} cantidadRequerida - Cantidad a asignar
 * @param {number} cantidadYaAsignada - Cantidad ya asignada previamente
 * @returns {Array} Array de lotes seleccionados con cantidades asignadas
 */
export const aplicarFIFO = (lotes, cantidadRequerida, cantidadYaAsignada = 0) => {
  let cantidadRestante = cantidadRequerida - cantidadYaAsignada;
  
  if (cantidadRestante <= 0) {
    return [];
  }

  // Ordenar lotes por FIFO (fecha de ingreso ascendente)
  const lotesOrdenados = [...lotes].sort((a, b) => {
    const fechaA = new Date(a.fechaIngreso || 0);
    const fechaB = new Date(b.fechaIngreso || 0);
    return fechaA - fechaB;
  });

  const lotesSeleccionados = [];

  for (const lote of lotesOrdenados) {
    if (cantidadRestante <= 0) break;

    const cantidadDisponible = Number(lote.saldoCantidad || 0);
    const cantidadTomar = Math.min(cantidadRestante, cantidadDisponible);

    if (cantidadTomar > 0) {
      const pesoUnitario = cantidadDisponible > 0
        ? Number(lote.saldoPeso || 0) / cantidadDisponible
        : 0;

      lotesSeleccionados.push({
        ...lote,
        cantidadAsignada: cantidadTomar,
        pesoAsignado: cantidadTomar * pesoUnitario
      });

      cantidadRestante -= cantidadTomar;
    }
  }

  return lotesSeleccionados;
};

/**
 * Calcula peso proporcional basado en cantidad
 * @param {number} cantidad - Cantidad a asignar
 * @param {number} cantidadTotal - Cantidad total disponible
 * @param {number} pesoTotal - Peso total disponible
 * @returns {number} Peso proporcional calculado
 */
export const calcularPesoProporcional = (cantidad, cantidadTotal, pesoTotal) => {
  if (cantidadTotal <= 0) return 0;
  
  const pesoUnitario = pesoTotal / cantidadTotal;
  return cantidad * pesoUnitario;
};

/**
 * Valida que la asignación esté completa
 * @param {number} cantidadAsignada - Cantidad asignada
 * @param {number} cantidadRequerida - Cantidad requerida
 * @returns {Object} { esValido, mensaje }
 */
export const validarAsignacionCompleta = (cantidadAsignada, cantidadRequerida) => {
  if (cantidadAsignada < cantidadRequerida) {
    return {
      esValido: false,
      mensaje: `Falta asignar ${cantidadRequerida - cantidadAsignada} unidades`
    };
  }

  return {
    esValido: true,
    mensaje: "Asignación completa"
  };
};

/**
 * Valida que una cantidad sea válida para un lote
 * @param {number} cantidad - Cantidad a validar
 * @param {number} cantidadMaxima - Cantidad máxima disponible
 * @returns {number} Cantidad válida ajustada
 */
export const validarCantidadLote = (cantidad, cantidadMaxima) => {
  return Math.min(Math.max(0, cantidad), cantidadMaxima);
};

/**
 * Prepara la estructura de resultado final para el callback onConfirmar
 * @param {Object} params - Parámetros de entrada
 * @returns {Object} Estructura de resultado completa
 */
export const prepararResultado = ({
  productoId,
  productoNombre,
  cantidadRequerida,
  cantidadAsignada,
  asignaciones
}) => {
  return {
    productoId: Number(productoId),
    productoNombre: productoNombre,
    cantidadRequerida: cantidadRequerida,
    cantidadAsignada: cantidadAsignada,
    esValido: cantidadAsignada >= cantidadRequerida,
    lotes: asignaciones.map(a => ({
      // IDs
      almacenId: Number(a.almacenId),
      almacenNombre: a.almacen?.nombre || `Almacén ${a.almacenId}`,
      productoId: Number(a.productoId),
      
      // Variables Kardex
      lote: a.lote || "",
      fechaIngreso: a.fechaIngreso,
      fechaProduccion: a.fechaProduccion,
      fechaVencimiento: a.fechaVencimiento,
      estadoMercaderiaId: a.estadoId ? Number(a.estadoId) : null,
      estadoMercaderiaNombre: a.estado?.nombre || "",
      estadoCalidadId: a.estadoCalidadId ? Number(a.estadoCalidadId) : null,
      estadoCalidadNombre: a.estadoCalidad?.nombre || "",
      ubicacionFisicaId: a.ubicacionFisicaId ? Number(a.ubicacionFisicaId) : null,
      ubicacionFisicaNombre: a.ubicacionFisica?.codigo || "",
      entidadComercialId: a.entidadComercialId ? Number(a.entidadComercialId) : null,
      clienteId: a.clienteId ? Number(a.clienteId) : null,
      esCustodia: a.esCustodia || false,
      numContenedor: a.numContenedor || "",
      nroSerie: a.nroSerie || "",
      
      // Cantidades
      cantidad: Number(a.cantidadAsignada || 0),
      peso: Number(a.pesoAsignado || 0),
      costoUnitario: Number(a.costoUnitario || 0),
      unidadMedidaId: a.unidadMedidaId ? Number(a.unidadMedidaId) : null,
      
      // Referencia al kardex original
      kardexId: a.id ? Number(a.id) : null
    }))
  };
};

/**
 * Cuenta almacenes únicos en las asignaciones
 * @param {Array} asignaciones - Array de asignaciones
 * @returns {number} Número de almacenes únicos
 */
export const contarAlmacenesUnicos = (asignaciones) => {
  const almacenesUnicos = new Set(asignaciones.map(a => a.almacenId));
  return almacenesUnicos.size;
};

/**
 * Calcula totales de asignaciones
 * @param {Array} asignaciones - Array de asignaciones
 * @returns {Object} { totalCantidad, totalPeso, totalLotes }
 */
export const calcularTotales = (asignaciones) => {
  return {
    totalCantidad: asignaciones.reduce((sum, a) => sum + Number(a.cantidadAsignada || 0), 0),
    totalPeso: asignaciones.reduce((sum, a) => sum + Number(a.pesoAsignado || 0), 0),
    totalLotes: asignaciones.length
  };
};