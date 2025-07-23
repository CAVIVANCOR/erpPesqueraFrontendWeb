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
 * Obtiene todos los detalles de documentos de embarcación del sistema
 * @returns {Promise<Array>} Lista de detalles de documentos de embarcación
 */
export const getAllDetalleDocEmbarcacion = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/detalle-doc-embarcacion`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/detalle-doc-embarcacion`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/detalle-doc-embarcacion/${id}`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/detalle-doc-embarcacion/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de documento de embarcación:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDetalleDocEmbarcacion = getAllDetalleDocEmbarcacion;
export const createDetalleDocEmbarcacion = crearDetalleDocEmbarcacion;
export const updateDetalleDocEmbarcacion = actualizarDetalleDocEmbarcacion;
export const deleteDetalleDocEmbarcacion = eliminarDetalleDocEmbarcacion;
