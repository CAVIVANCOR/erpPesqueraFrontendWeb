import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Descarga Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de descargas de faenas de consumo
 */

/**
 * Obtiene todas las descargas de faenas de consumo
 * @returns {Promise} Lista de descargas de faenas de consumo
 */
export const getAllDescargaFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/descarga-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva descarga de faena de consumo
 * @param {Object} descargaFaenaConsumoData - Datos de la descarga de faena de consumo
 * @returns {Promise} Descarga de faena de consumo creada
 */
export const crearDescargaFaenaConsumo = async (descargaFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/descarga-faena-consumo`, descargaFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una descarga de faena de consumo existente
 * @param {number} id - ID de la descarga de faena de consumo
 * @param {Object} descargaFaenaConsumoData - Datos actualizados
 * @returns {Promise} Descarga de faena de consumo actualizada
 */
export const actualizarDescargaFaenaConsumo = async (id, descargaFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/descarga-faena-consumo/${id}`, descargaFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una descarga de faena de consumo
 * @param {number} id - ID de la descarga de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDescargaFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/descarga-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDescargaFaenaConsumo = crearDescargaFaenaConsumo;
export const updateDescargaFaenaConsumo = actualizarDescargaFaenaConsumo;
export const eliminarDescargaFaenaConsumo = deleteDescargaFaenaConsumo;
