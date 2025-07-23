import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Centro de Costo
 * Proporciona funciones para operaciones CRUD en el módulo de centros de costo
 */

/**
 * Obtiene todos los centros de costo
 * @returns {Promise} Lista de centros de costo
 */
export const getCentrosCosto = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/centro-costo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene todos los centros de costo (alias)
 * @returns {Promise} Lista de centros de costo
 */
export const getAllCentroCosto = async () => {
  return getCentrosCosto();
};

/**
 * Crea un nuevo centro de costo
 * @param {Object} centroCostoData - Datos del centro de costo
 * @returns {Promise} Centro de costo creado
 */
export const crearCentroCosto = async (centroCostoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/centro-costo`, centroCostoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un centro de costo existente
 * @param {number} id - ID del centro de costo
 * @param {Object} centroCostoData - Datos actualizados
 * @returns {Promise} Centro de costo actualizado
 */
export const actualizarCentroCosto = async (id, centroCostoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/centro-costo/${id}`, centroCostoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un centro de costo
 * @param {number} id - ID del centro de costo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteCentroCosto = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/centro-costo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createCentroCosto = crearCentroCosto;
export const updateCentroCosto = actualizarCentroCosto;
export const eliminarCentroCosto = deleteCentroCosto;
