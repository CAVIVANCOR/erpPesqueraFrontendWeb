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
 * Obtiene todos los boliches red del sistema
 * @returns {Promise<Array>} Lista de boliches red
 */
export const getAllBolicheRed = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/pesca/boliches-red`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener boliches red:', error);
    throw error;
  }
};

/**
 * Crea un nuevo boliche red
 * @param {Object} bolicheData - Datos del boliche red
 * @returns {Promise<Object>} Boliche red creado
 */
export const crearBolicheRed = async (bolicheData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/pesca/boliches-red`, bolicheData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear boliche red:', error);
    throw error;
  }
};

/**
 * Actualiza un boliche red existente
 * @param {number} id - ID del boliche red
 * @param {Object} bolicheData - Datos actualizados del boliche
 * @returns {Promise<Object>} Boliche red actualizado
 */
export const actualizarBolicheRed = async (id, bolicheData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/pesca/boliches-red/${id}`, bolicheData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar boliche red:', error);
    throw error;
  }
};

/**
 * Elimina un boliche red
 * @param {number} id - ID del boliche red a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarBolicheRed = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/pesca/boliches-red/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar boliche red:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getBolicheRed = getAllBolicheRed;
export const createBolicheRed = crearBolicheRed;
export const updateBolicheRed = actualizarBolicheRed;
export const deleteBolicheRed = eliminarBolicheRed;
