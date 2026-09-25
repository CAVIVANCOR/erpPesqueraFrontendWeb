// src/api/tesoreria/pendientes.js
// Funciones de integración API REST para Documentos Pendientes. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/pendientes`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtener lista de documentos pendientes con filtros
 * @param {Object} filtros - Filtros básicos y avanzados
 * @param {Number} filtros.empresaId - ID de empresa
 * @param {String} filtros.tipo - 'COBRAR' | 'PAGAR' | 'ASIGNACIONES' | 'GASTOS_DIRECTOS' | 'TODOS'
 * @param {String} filtros.vencimiento - 'VENCIDOS' | 'HOY' | 'SEMANA' | 'TODOS'
 * @param {Number} filtros.monedaId - ID de moneda (filtro básico legacy)
 * @param {String} filtros.tipoDeuda - Tipo de deuda
 * 
 * Filtros avanzados:
 * @param {Date} filtros.fechaDesde - Fecha desde
 * @param {Date} filtros.fechaHasta - Fecha hasta
 * @param {Array<Number>} filtros.clienteIds - IDs de clientes
 * @param {Array<Number>} filtros.proveedorIds - IDs de proveedores
 * @param {Array<Number>} filtros.entidadComercialIds - IDs de entidades comerciales
 * @param {Array<Number>} filtros.tipoDocumentoIds - IDs de tipos de documento
 * @param {String} filtros.numeroDocumento - Búsqueda parcial de número
 * @param {Array<Number>} filtros.monedaIds - IDs de monedas (array)
 * @param {Array<Number>} filtros.estadoIds - IDs de estados
 * @param {Array<Number>} filtros.personalIds - IDs de personal
 * @param {Number} filtros.montoDesde - Monto mínimo
 * @param {Number} filtros.montoHasta - Monto máximo
 * 
 * @returns {Promise<Array>} Lista de documentos pendientes
 */
export async function getPendientes(filtros = {}) {
  const params = new URLSearchParams();
  
  // Filtros básicos
  if (filtros.empresaId) params.append('empresaId', filtros.empresaId);
  if (filtros.tipo) params.append('tipo', filtros.tipo);
  if (filtros.vencimiento) params.append('vencimiento', filtros.vencimiento);
  if (filtros.monedaId) params.append('monedaId', filtros.monedaId);
  if (filtros.tipoDeuda) params.append('tipoDeuda', filtros.tipoDeuda);

  // Filtros avanzados - Fechas
  if (filtros.fechaDesde) {
    params.append('fechaDesde', filtros.fechaDesde instanceof Date 
      ? filtros.fechaDesde.toISOString() 
      : filtros.fechaDesde);
  }
  if (filtros.fechaHasta) {
    params.append('fechaHasta', filtros.fechaHasta instanceof Date 
      ? filtros.fechaHasta.toISOString() 
      : filtros.fechaHasta);
  }

  // Filtros avanzados - Arrays de IDs (enviar como string separado por comas)
  if (filtros.clienteIds && filtros.clienteIds.length > 0) {
    params.append('clienteIds', filtros.clienteIds.join(','));
  }
  if (filtros.proveedorIds && filtros.proveedorIds.length > 0) {
    params.append('proveedorIds', filtros.proveedorIds.join(','));
  }
  if (filtros.entidadComercialIds && filtros.entidadComercialIds.length > 0) {
    params.append('entidadComercialIds', filtros.entidadComercialIds.join(','));
  }
  if (filtros.tipoDocumentoIds && filtros.tipoDocumentoIds.length > 0) {
    params.append('tipoDocumentoIds', filtros.tipoDocumentoIds.join(','));
  }
  if (filtros.monedaIds && filtros.monedaIds.length > 0) {
    params.append('monedaIds', filtros.monedaIds.join(','));
  }
  if (filtros.estadoIds && filtros.estadoIds.length > 0) {
    params.append('estadoIds', filtros.estadoIds.join(','));
  }
  if (filtros.personalIds && filtros.personalIds.length > 0) {
    params.append('personalIds', filtros.personalIds.join(','));
  }

  // Filtros avanzados - Texto y números
  if (filtros.numeroDocumento) {
    params.append('numeroDocumento', filtros.numeroDocumento);
  }
  if (filtros.montoDesde !== null && filtros.montoDesde !== undefined && filtros.montoDesde !== '') {
    params.append('montoDesde', filtros.montoDesde);
  }
  if (filtros.montoHasta !== null && filtros.montoHasta !== undefined && filtros.montoHasta !== '') {
    params.append('montoHasta', filtros.montoHasta);
  }

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener resumen de pendientes (totales por moneda y tipo)
 * @param {Number} empresaId - ID de empresa (opcional)
 * @returns {Promise<Object>} Resumen con totales
 */
export async function getResumenPendientes(empresaId = null) {
  const params = empresaId ? `?empresaId=${empresaId}` : '';
  const res = await axios.get(`${API_URL}/resumen${params}`, { headers: getAuthHeaders() });
  return res.data;
}
