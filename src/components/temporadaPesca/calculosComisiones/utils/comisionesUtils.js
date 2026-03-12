/**
 * comisionesUtils.js
 * Funciones utilitarias para formateo, cálculo y agrupación de comisiones
 */

/**
 * Formatea el monto de comisión
 * @param {number} monto - Monto de comisión
 * @param {string} moneda - Código de moneda
 * @returns {string} Monto formateado
 */
export const formatearMontoComision = (monto, moneda = "USD") => {
  if (!monto && monto !== 0) return `${moneda} 0.00`;
  return `${moneda} ${Number(monto).toFixed(2)}`;
};

/**
 * Agrupa comisiones por personal
 * @param {array} comisiones - Array de comisiones
 * @returns {object} Comisiones agrupadas por personalId
 */
export const agruparComisionesPorPersonal = (comisiones) => {
  if (!comisiones || comisiones.length === 0) return {};

  return comisiones.reduce((grupos, comision) => {
    const personalId = comision.personalId || "sin_personal";
    if (!grupos[personalId]) {
      grupos[personalId] = {
        personal: comision.personal,
        comisiones: [],
        totalMonto: 0,
      };
    }
    grupos[personalId].comisiones.push(comision);
    grupos[personalId].totalMonto += Number(comision.montoComision || 0);
    return grupos;
  }, {});
};

/**
 * Agrupa comisiones por cliente
 * @param {array} comisiones - Array de comisiones
 * @returns {object} Comisiones agrupadas por clienteId
 */
export const agruparComisionesPorCliente = (comisiones) => {
  if (!comisiones || comisiones.length === 0) return {};

  return comisiones.reduce((grupos, comision) => {
    const clienteId = comision.clienteId || "sin_cliente";
    if (!grupos[clienteId]) {
      grupos[clienteId] = {
        cliente: comision.cliente,
        comisiones: [],
        totalMonto: 0,
        totalToneladas: 0,
      };
    }
    grupos[clienteId].comisiones.push(comision);
    grupos[clienteId].totalMonto += Number(comision.montoComision || 0);
    grupos[clienteId].totalToneladas += Number(comision.pesoToneladas || 0);
    return grupos;
  }, {});
};

/**
 * Calcula el total de comisiones
 * @param {array} comisiones - Array de comisiones
 * @returns {number} Total de comisiones
 */
export const calcularTotalComisiones = (comisiones) => {
  if (!comisiones || comisiones.length === 0) return 0;

  return comisiones.reduce((total, comision) => {
    return total + Number(comision.montoComision || 0);
  }, 0);
};

/**
 * Calcula estadísticas de comisiones
 * @param {array} comisiones - Array de comisiones
 * @returns {object} Estadísticas calculadas
 */
export const calcularEstadisticasComisiones = (comisiones) => {
  if (!comisiones || comisiones.length === 0) {
    return {
      totalComisiones: 0,
      totalMonto: 0,
      totalToneladas: 0,
      personalUnico: 0,
      clientesUnicos: 0,
    };
  }

  const personalesSet = new Set();
  const clientesSet = new Set();
  let totalMonto = 0;
  let totalToneladas = 0;

  comisiones.forEach((comision) => {
    if (comision.personalId) personalesSet.add(comision.personalId);
    if (comision.clienteId) clientesSet.add(comision.clienteId);
    totalMonto += Number(comision.montoComision || 0);
    totalToneladas += Number(comision.pesoToneladas || 0);
  });

  return {
    totalComisiones: comisiones.length,
    totalMonto,
    totalToneladas,
    personalUnico: personalesSet.size,
    clientesUnicos: clientesSet.size,
  };
};

/**
 * Filtra comisiones por rango de fechas
 * @param {array} comisiones - Array de comisiones
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {array} Comisiones filtradas
 */
export const filtrarComisionesPorFecha = (comisiones, fechaInicio, fechaFin) => {
  if (!comisiones || comisiones.length === 0) return [];
  if (!fechaInicio || !fechaFin) return comisiones;

  return comisiones.filter((comision) => {
    const fechaComision = new Date(comision.createdAt);
    return fechaComision >= fechaInicio && fechaComision <= fechaFin;
  });
};

/**
 * Ordena comisiones por monto (descendente)
 * @param {array} comisiones - Array de comisiones
 * @returns {array} Comisiones ordenadas
 */
export const ordenarComisionesPorMonto = (comisiones) => {
  if (!comisiones || comisiones.length === 0) return [];

  return [...comisiones].sort((a, b) => {
    return Number(b.montoComision || 0) - Number(a.montoComision || 0);
  });
};