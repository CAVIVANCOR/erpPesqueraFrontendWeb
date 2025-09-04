import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/descargas-faena`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todas las descargas de faena pesca del sistema
 * @returns {Promise<Array>} Lista de descargas de faena pesca
 */
export const getAllDescargaFaenaPesca = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener descargas de faena pesca:', error);
    throw error;
  }
};

/**
 * Crea una nueva descarga de faena pesca
 * @param {Object} descargaData - Datos de la descarga de faena pesca
 * @returns {Promise<Object>} Descarga de faena pesca creada
 */
export const crearDescargaFaenaPesca = async (descargaData) => {
  try {
    const response = await axios.post(`${API_URL}`, descargaData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear descarga de faena pesca:', error);
    throw error;
  }
};

/**
 * Actualiza una descarga de faena pesca existente
 * @param {number} id - ID de la descarga de faena pesca
 * @param {Object} descargaData - Datos actualizados de la descarga
 * @returns {Promise<Object>} Descarga de faena pesca actualizada
 */
export const actualizarDescargaFaenaPesca = async (id, descargaData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, descargaData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar descarga de faena pesca:', error);
    throw error;
  }
};

/**
 * Elimina una descarga de faena pesca
 * @param {number} id - ID de la descarga de faena pesca a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDescargaFaenaPesca = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar descarga de faena pesca:', error);
    throw error;
  }
};
