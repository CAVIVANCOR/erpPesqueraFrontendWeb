// src/api/detCuotaPesca.js
// API centralizada para gestión de detalles de cuota de pesca en el ERP Megui.
// Todas las funciones devuelven promesas y usan autenticación JWT desde useAuthStore.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/detalles-cuota-pesca`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los detalles de cuota de pesca.
 * Puede filtrar por empresaId, zona y esAlquiler si se proporcionan.
 * @param {Object} filtros - Filtros opcionales { empresaId, zona, esAlquiler }
 * @returns {Promise<Array>} Lista de detalles de cuota
 */
export const getDetallesCuotaPesca = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.empresaId) {
    params.append('empresaId', filtros.empresaId);
  }
  if (filtros.zona) {
    params.append('zona', filtros.zona);
  }
  if (filtros.esAlquiler !== undefined && filtros.esAlquiler !== null) {
    params.append('esAlquiler', filtros.esAlquiler);
  }
  const queryString = params.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  const res = await axios.get(url, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene un detalle de cuota de pesca por ID.
 * @param {number|string} id - ID del detalle de cuota
 * @returns {Promise<Object>} Detalle de cuota encontrado
 */
export const getDetalleCuotaPescaById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Crea un nuevo detalle de cuota de pesca.
 * @param {Object} data - Datos del detalle de cuota
 * @returns {Promise<Object>} Detalle de cuota creado
 */
export const crearDetalleCuotaPesca = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza un detalle de cuota de pesca existente.
 * @param {number|string} id - ID del detalle de cuota
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Detalle de cuota actualizado
 */
export const actualizarDetalleCuotaPesca = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Elimina un detalle de cuota de pesca por ID.
 * @param {number|string} id - ID del detalle de cuota
 * @returns {Promise<void>}
 */
export const eliminarDetalleCuotaPesca = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};

/**
 * Obtiene el resumen de cuotas por empresa.
 * Calcula totales de cuota propia y alquilada.
 * @param {number|string} empresaId - ID de la empresa
 * @returns {Promise<Object>} Resumen con totales de cuotas
 */
export const getResumenCuotasPorEmpresa = async (empresaId) => {
  const res = await axios.get(`${API_URL}/resumen/empresa/${empresaId}`, { headers: getAuthHeader() });
  return res.data;
};
