import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/detalles-doc-embarcacion`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}


/**
 * Obtiene todos los detalles de documentos de embarcación del sistema
 * @returns {Promise<Array>} Lista de detalles de documentos de embarcación
 */
export const getAllDetalleDocEmbarcacion = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de documentos de embarcación:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de documento de embarcación
 * @param {Object} detalleData - Datos del detalle de documento de embarcación
 * @returns {Promise<Object>} Detalle de documento de embarcación creado
 */
export const crearDetalleDocEmbarcacion = async (detalleData) => {
  try {
    const response = await axios.post(`${API_URL}`, detalleData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de documento de embarcación:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de documento de embarcación existente
 * @param {number} id - ID del detalle de documento de embarcación
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de documento de embarcación actualizado
 */
export const actualizarDetalleDocEmbarcacion = async (id, detalleData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, detalleData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de documento de embarcación:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de documento de embarcación
 * @param {number} id - ID del detalle de documento de embarcación a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleDocEmbarcacion = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de documento de embarcación:', error);
    throw error;
  }
};

