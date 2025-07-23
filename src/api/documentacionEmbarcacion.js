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
 * Obtiene toda la documentación de embarcaciones del sistema
 * @returns {Promise<Array>} Lista de documentación de embarcaciones
 */
export const getAllDocumentacionEmbarcacion = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/documentacion-embarcacion`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener documentación de embarcaciones:', error);
    throw error;
  }
};

/**
 * Crea una nueva documentación de embarcación
 * @param {Object} documentacionData - Datos de la documentación de embarcación
 * @returns {Promise<Object>} Documentación de embarcación creada
 */
export const crearDocumentacionEmbarcacion = async (documentacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/documentacion-embarcacion`, documentacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear documentación de embarcación:', error);
    throw error;
  }
};

/**
 * Actualiza una documentación de embarcación existente
 * @param {number} id - ID de la documentación de embarcación
 * @param {Object} documentacionData - Datos actualizados de la documentación
 * @returns {Promise<Object>} Documentación de embarcación actualizada
 */
export const actualizarDocumentacionEmbarcacion = async (id, documentacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/documentacion-embarcacion/${id}`, documentacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar documentación de embarcación:', error);
    throw error;
  }
};

/**
 * Elimina una documentación de embarcación
 * @param {number} id - ID de la documentación de embarcación a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDocumentacionEmbarcacion = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/documentacion-embarcacion/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar documentación de embarcación:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDocumentacionEmbarcacion = getAllDocumentacionEmbarcacion;
export const createDocumentacionEmbarcacion = crearDocumentacionEmbarcacion;
export const updateDocumentacionEmbarcacion = actualizarDocumentacionEmbarcacion;
export const deleteDocumentacionEmbarcacion = eliminarDocumentacionEmbarcacion;
