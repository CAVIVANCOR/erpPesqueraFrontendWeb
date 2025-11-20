// src/components/movimientoAlmacen/productoSelector/utils/productoSelectorHelpers.js

/**
 * Obtiene el objeto producto desde un rowData según el modo
 * @param {Object} rowData - Datos de la fila
 * @param {boolean} esIngreso - Si es modo ingreso
 * @returns {Object} Objeto producto
 */
export const getProductoFromRow = (rowData, esIngreso) => {
  return esIngreso ? rowData : rowData.producto;
};

/**
 * Formatea un número con separadores de miles y decimales
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Cantidad de decimales
 * @returns {string} Número formateado
 */
export const formatNumber = (value, decimals = 2) => {
  return Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formatea una fecha
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

/**
 * Construye filtros para productos
 * @param {Object} params - Parámetros
 * @returns {Object} Filtros construidos
 */
export const buildFiltrosProductos = ({ empresaId, clienteId }) => {
  return {
    empresaId,
    clienteId,
    cesado: false,
  };
};

/**
 * Construye filtros para saldos
 * @param {Object} params - Parámetros
 * @returns {Object} Filtros construidos
 */
export const buildFiltrosSaldos = ({ empresaId, clienteId, almacenId, esCustodia, soloConSaldo = false }) => {
  const filtros = {
    empresaId,
    clienteId,
    custodia: esCustodia,
  };

  if (almacenId) {
    filtros.almacenId = almacenId;
  }

  if (soloConSaldo) {
    filtros.soloConSaldo = true;
  }

  return filtros;
};