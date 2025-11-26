// src/utils/formatters.js
// Utilidades de formateo para fechas, números y monedas

/**
 * Formatea una fecha a formato dd/mm/yyyy
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha con hora a formato dd/mm/yyyy HH:mm
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 */
export const formatDateTime = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formatea un número como moneda
 * @param {number} valor - Valor a formatear
 * @param {string} simbolo - Símbolo de moneda (default: 'S/')
 * @returns {string} Valor formateado
 */
export const formatCurrency = (valor, simbolo = 'S/') => {
  if (valor === null || valor === undefined) return `${simbolo} 0.00`;
  return `${simbolo} ${Number(valor).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Formatea un número con separadores de miles
 * @param {number} valor - Valor a formatear
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} Valor formateado
 */
export const formatNumber = (valor, decimales = 2) => {
  if (valor === null || valor === undefined) return '0';
  return Number(valor).toFixed(decimales).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
