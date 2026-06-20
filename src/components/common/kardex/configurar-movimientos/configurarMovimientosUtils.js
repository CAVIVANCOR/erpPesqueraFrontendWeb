// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\configurar-movimientos\configurarMovimientosUtils.js

/**
 * ============================================================================
 * UTILIDADES PARA CONFIGURACIÓN DE MOVIMIENTOS
 * ============================================================================
 * 
 * Funciones puras para lógica de negocio de configuración de movimientos.
 * Todas las funciones son testeables y reutilizables.
 * 
 * @author ERP Megui - Sistema Profesional
 * @version 1.0.0
 */

/**
 * Agrupa asignaciones de stock por almacén
 * @param {Array} asignacionesStock - Array de asignaciones de stock (resultado de AsignarStockDialog)
 * @returns {Array} Array de almacenes únicos con sus lotes agrupados
 */
export const agruparPorAlmacen = (asignacionesStock) => {
  if (!asignacionesStock || asignacionesStock.length === 0) return [];

  const almacenesMap = {};

  asignacionesStock.forEach(producto => {
    if (!producto.lotes || producto.lotes.length === 0) return;

    producto.lotes.forEach(lote => {
      const almacenId = Number(lote.almacenId);

      if (!almacenesMap[almacenId]) {
        almacenesMap[almacenId] = {
          almacenId: almacenId,
          almacenNombre: lote.almacenNombre || `Almacén ${almacenId}`,
          totalCantidad: 0,
          totalPeso: 0,
          numLotes: 0,
          productos: []
        };
      }

      almacenesMap[almacenId].totalCantidad += Number(lote.cantidad || 0);
      almacenesMap[almacenId].totalPeso += Number(lote.peso || 0);
      almacenesMap[almacenId].numLotes += 1;
      almacenesMap[almacenId].productos.push({
        productoId: producto.productoId,
        productoNombre: producto.productoNombre,
        ...lote
      });
    });
  });

  return Object.values(almacenesMap);
};

/**
 * Valida que todos los almacenes tengan configuración completa
 * @param {Array} configuraciones - Array de configuraciones por almacén
 * @returns {Object} { esValido, mensajes }
 */
export const validarConfiguracionCompleta = (configuraciones) => {
  const mensajes = [];
  let esValido = true;

  configuraciones.forEach(config => {
    if (!config.conceptoMovAlmacenId) {
      mensajes.push(`${config.almacenNombre}: Falta seleccionar Concepto de Movimiento`);
      esValido = false;
    }

    if (!config.fechaMovimiento) {
      mensajes.push(`${config.almacenNombre}: Falta seleccionar Fecha de Movimiento`);
      esValido = false;
    }

    if (!config.direccionOrigenId && config.requiereDireccionOrigen) {
      mensajes.push(`${config.almacenNombre}: Falta seleccionar Dirección de Origen`);
      esValido = false;
    }

    if (!config.direccionDestinoId && config.requiereDireccionDestino) {
      mensajes.push(`${config.almacenNombre}: Falta seleccionar Dirección de Destino`);
      esValido = false;
    }
  });

  return { esValido, mensajes };
};

/**
 * Prepara la estructura de resultado final para el callback onConfirmar
 * @param {Array} configuraciones - Array de configuraciones por almacén
 * @param {Array} almacenesAgrupados - Array de almacenes con sus productos
 * @returns {Array} Array de movimientos configurados por almacén
 */
export const prepararResultado = (configuraciones, almacenesAgrupados) => {
  return configuraciones.map(config => {
    const almacen = almacenesAgrupados.find(a => a.almacenId === config.almacenId);

    return {
      almacenId: config.almacenId,
      almacenNombre: config.almacenNombre,
      conceptoMovAlmacenId: Number(config.conceptoMovAlmacenId),
      conceptoMovAlmacenNombre: config.conceptoMovAlmacenNombre,
      fechaMovimiento: config.fechaMovimiento,
      direccionOrigenId: config.direccionOrigenId ? Number(config.direccionOrigenId) : null,
      direccionDestinoId: config.direccionDestinoId ? Number(config.direccionDestinoId) : null,
      observaciones: config.observaciones || "",
      totalCantidad: almacen?.totalCantidad || 0,
      totalPeso: almacen?.totalPeso || 0,
      numLotes: almacen?.numLotes || 0,
      productos: almacen?.productos || []
    };
  });
};

/**
 * Inicializa configuraciones por almacén con valores por defecto
 * @param {Array} almacenesAgrupados - Array de almacenes agrupados
 * @param {Date} fechaPorDefecto - Fecha por defecto para los movimientos
 * @returns {Array} Array de configuraciones inicializadas
 */
export const inicializarConfiguraciones = (almacenesAgrupados, fechaPorDefecto = new Date()) => {
  return almacenesAgrupados.map(almacen => ({
    almacenId: almacen.almacenId,
    almacenNombre: almacen.almacenNombre,
    conceptoMovAlmacenId: null,
    conceptoMovAlmacenNombre: "",
    fechaMovimiento: fechaPorDefecto,
    direccionOrigenId: null,
    direccionDestinoId: null,
    observaciones: "",
    requiereDireccionOrigen: false,
    requiereDireccionDestino: false
  }));
};

/**
 * Actualiza una configuración específica
 * @param {Array} configuraciones - Array de configuraciones actuales
 * @param {number} almacenId - ID del almacén a actualizar
 * @param {Object} cambios - Objeto con los cambios a aplicar
 * @returns {Array} Array de configuraciones actualizado
 */
export const actualizarConfiguracion = (configuraciones, almacenId, cambios) => {
  return configuraciones.map(config =>
    config.almacenId === almacenId
      ? { ...config, ...cambios }
      : config
  );
};

/**
 * Cuenta el total de almacenes configurados
 * @param {Array} configuraciones - Array de configuraciones
 * @returns {number} Número de almacenes con configuración completa
 */
export const contarAlmacenesConfigurados = (configuraciones) => {
  return configuraciones.filter(config =>
    config.conceptoMovAlmacenId &&
    config.fechaMovimiento &&
    (!config.requiereDireccionOrigen || config.direccionOrigenId) &&
    (!config.requiereDireccionDestino || config.direccionDestinoId)
  ).length;
};

/**
 * Obtiene el concepto de movimiento por ID
 * @param {Array} conceptos - Array de conceptos disponibles
 * @param {number} conceptoId - ID del concepto a buscar
 * @returns {Object|null} Concepto encontrado o null
 */
export const obtenerConcepto = (conceptos, conceptoId) => {
  return conceptos.find(c => Number(c.id) === Number(conceptoId)) || null;
};

/**
 * Filtra conceptos por tipo de movimiento
 * @param {Array} conceptos - Array de conceptos disponibles
 * @param {number} tipoMovimientoId - ID del tipo de movimiento (1=INGRESO, 2=SALIDA, 3=TRASLADO)
 * @returns {Array} Array de conceptos filtrados
 */
export const filtrarConceptosPorTipo = (conceptos, tipoMovimientoId) => {
  if (!tipoMovimientoId) return conceptos;
  return conceptos.filter(c => Number(c.tipoMovimientoId) === Number(tipoMovimientoId));
};