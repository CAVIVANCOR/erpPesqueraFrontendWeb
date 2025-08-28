import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/categorias-ccosto`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todas las categorías de centro de costo del sistema
 * @returns {Promise<Array>} Lista de categorías de centro de costo
 */
export const getAllCategoriaCCosto = async () => {
  try {
    const res = await axios.get(API_URL, { headers: getAuthHeader() });
    return res.data;
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
    const response = await axios.post(API_URL, categoriaData, {
      headers: getAuthHeader()
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
    const response = await axios.put(`${API_URL}/${id}`, categoriaData, {
      headers: getAuthHeader()
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
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar categoría de centro de costo:', error);
    throw error;
  }
};
