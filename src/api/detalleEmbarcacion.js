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
 * Obtiene todos los detalles de embarcaciones del sistema
 * @returns {Promise<Array>} Lista de detalles de embarcaciones
 */
export const getAllDetalleEmbarcacion = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/detalle-embarcacion`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de embarcaciones:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de embarcación
 * @param {Object} detalleData - Datos del detalle de embarcación
 * @returns {Promise<Object>} Detalle de embarcación creado
 */
export const crearDetalleEmbarcacion = async (detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/detalle-embarcacion`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de embarcación:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de embarcación existente
 * @param {number} id - ID del detalle de embarcación
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de embarcación actualizado
 */
export const actualizarDetalleEmbarcacion = async (id, detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/detalle-embarcacion/${id}`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de embarcación:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de embarcación
 * @param {number} id - ID del detalle de embarcación a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleEmbarcacion = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/detalle-embarcacion/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de embarcación:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDetalleEmbarcacion = getAllDetalleEmbarcacion;
export const createDetalleEmbarcacion = crearDetalleEmbarcacion;
export const updateDetalleEmbarcacion = actualizarDetalleEmbarcacion;
export const deleteDetalleEmbarcacion = eliminarDetalleEmbarcacion;
