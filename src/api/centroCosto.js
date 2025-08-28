import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/centros-costo`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
/**
 * API para gestión de Centro de Costo
 * Proporciona funciones para operaciones CRUD en el módulo de centros de costo
 */

/**
 * Obtiene todos los centros de costo
 * @returns {Promise} Lista de centros de costo
 */
export const getCentrosCosto = async () => {
  const response = await axios.get(`${API_URL}`, {
    headers: getAuthHeader(),
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
  const response = await axios.post(`${API_URL}`, centroCostoData, {
    headers: getAuthHeader(),
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
  const response = await axios.put(`${API_URL}/${id}`, centroCostoData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Elimina un centro de costo
 * @param {number} id - ID del centro de costo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const eliminarCentroCosto = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

