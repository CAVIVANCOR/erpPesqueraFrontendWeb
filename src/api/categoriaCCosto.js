import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
const getAuthToken = () => {
  const { token } = useAuthStore.getState();
  return token;
};

/**
 * Obtiene todas las categorías de centro de costo del sistema
 * @returns {Promise<Array>} Lista de categorías de centro de costo
 */
export const getAllCategoriaCCosto = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/categoria-ccosto`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías de centro de costo:', error);
    throw error;
  }
};

/**
 * Crea una nueva categoría de centro de costo
 * @param {Object} categoriaData - Datos de la categoría de centro de costo
 * @returns {Promise<Object>} Categoría de centro de costo creada
 */
export const crearCategoriaCCosto = async (categoriaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/categoria-ccosto`, categoriaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear categoría de centro de costo:', error);
    throw error;
  }
};

/**
 * Actualiza una categoría de centro de costo existente
 * @param {number} id - ID de la categoría de centro de costo
 * @param {Object} categoriaData - Datos actualizados de la categoría
 * @returns {Promise<Object>} Categoría de centro de costo actualizada
 */
export const actualizarCategoriaCCosto = async (id, categoriaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/categoria-ccosto/${id}`, categoriaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar categoría de centro de costo:', error);
    throw error;
  }
};

/**
 * Elimina una categoría de centro de costo
 * @param {number} id - ID de la categoría de centro de costo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarCategoriaCCosto = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/categoria-ccosto/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar categoría de centro de costo:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getCategoriaCCosto = getAllCategoriaCCosto;
export const createCategoriaCCosto = crearCategoriaCCosto;
export const updateCategoriaCCosto = actualizarCategoriaCCosto;
export const deleteCategoriaCCosto = eliminarCategoriaCCosto;
