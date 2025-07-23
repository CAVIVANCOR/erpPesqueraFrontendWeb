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
 * Obtiene toda la documentación personal del sistema
 * @returns {Promise<Array>} Lista de documentación personal
 */
export const getAllDocumentacionPersonal = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/documentacion-personal`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener documentación personal:', error);
    throw error;
  }
};

/**
 * Crea una nueva documentación personal
 * @param {Object} documentacionData - Datos de la documentación personal
 * @returns {Promise<Object>} Documentación personal creada
 */
export const crearDocumentacionPersonal = async (documentacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/documentacion-personal`, documentacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear documentación personal:', error);
    throw error;
  }
};

/**
 * Actualiza una documentación personal existente
 * @param {number} id - ID de la documentación personal
 * @param {Object} documentacionData - Datos actualizados de la documentación
 * @returns {Promise<Object>} Documentación personal actualizada
 */
export const actualizarDocumentacionPersonal = async (id, documentacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/documentacion-personal/${id}`, documentacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar documentación personal:', error);
    throw error;
  }
};

/**
 * Elimina una documentación personal
 * @param {number} id - ID de la documentación personal a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDocumentacionPersonal = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/documentacion-personal/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar documentación personal:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDocumentacionPersonal = getAllDocumentacionPersonal;
export const createDocumentacionPersonal = crearDocumentacionPersonal;
export const updateDocumentacionPersonal = actualizarDocumentacionPersonal;
export const deleteDocumentacionPersonal = eliminarDocumentacionPersonal;
