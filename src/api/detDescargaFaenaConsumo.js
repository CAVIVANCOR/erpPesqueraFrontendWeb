import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Descarga Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de descargas de faenas de consumo
 */

/**
 * Obtiene todos los detalles de descargas de faenas de consumo
 * @returns {Promise} Lista de detalles de descargas de faenas de consumo
 */
export const getAllDetDescargaFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-descarga-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de descarga de faena de consumo
 * @param {Object} detDescargaFaenaConsumoData - Datos del detalle de descarga de faena de consumo
 * @returns {Promise} Detalle de descarga de faena de consumo creado
 */
export const crearDetDescargaFaenaConsumo = async (detDescargaFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-descarga-faena-consumo`, detDescargaFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de descarga de faena de consumo existente
 * @param {number} id - ID del detalle de descarga de faena de consumo
 * @param {Object} detDescargaFaenaConsumoData - Datos actualizados
 * @returns {Promise} Detalle de descarga de faena de consumo actualizado
 */
export const actualizarDetDescargaFaenaConsumo = async (id, detDescargaFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-descarga-faena-consumo/${id}`, detDescargaFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de descarga de faena de consumo
 * @param {number} id - ID del detalle de descarga de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetDescargaFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-descarga-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetDescargaFaenaConsumo = crearDetDescargaFaenaConsumo;
export const updateDetDescargaFaenaConsumo = actualizarDetDescargaFaenaConsumo;
export const eliminarDetDescargaFaenaConsumo = deleteDetDescargaFaenaConsumo;
