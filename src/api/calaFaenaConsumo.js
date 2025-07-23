import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Cala Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de calas de faenas de consumo
 */

/**
 * Obtiene todas las calas de faenas de consumo
 * @returns {Promise} Lista de calas de faenas de consumo
 */
export const getAllCalaFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/cala-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva cala de faena de consumo
 * @param {Object} calaFaenaConsumoData - Datos de la cala de faena de consumo
 * @returns {Promise} Cala de faena de consumo creada
 */
export const crearCalaFaenaConsumo = async (calaFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/cala-faena-consumo`, calaFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una cala de faena de consumo existente
 * @param {number} id - ID de la cala de faena de consumo
 * @param {Object} calaFaenaConsumoData - Datos actualizados
 * @returns {Promise} Cala de faena de consumo actualizada
 */
export const actualizarCalaFaenaConsumo = async (id, calaFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/cala-faena-consumo/${id}`, calaFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una cala de faena de consumo
 * @param {number} id - ID de la cala de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteCalaFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/cala-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createCalaFaenaConsumo = crearCalaFaenaConsumo;
export const updateCalaFaenaConsumo = actualizarCalaFaenaConsumo;
export const eliminarCalaFaenaConsumo = deleteCalaFaenaConsumo;
