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
 * Obtiene todos los detalles de descarga de faena del sistema
 * @returns {Promise<Array>} Lista de detalles de descarga de faena
 */
export const getAllDetalleDescargaFaena = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/detalle-descarga-faena`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de descarga de faena:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de descarga de faena
 * @param {Object} detalleData - Datos del detalle de descarga de faena
 * @returns {Promise<Object>} Detalle de descarga de faena creado
 */
export const crearDetalleDescargaFaena = async (detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/detalle-descarga-faena`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de descarga de faena:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de descarga de faena existente
 * @param {number} id - ID del detalle de descarga de faena
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de descarga de faena actualizado
 */
export const actualizarDetalleDescargaFaena = async (id, detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/detalle-descarga-faena/${id}`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de descarga de faena:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de descarga de faena
 * @param {number} id - ID del detalle de descarga de faena a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleDescargaFaena = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/detalle-descarga-faena/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de descarga de faena:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDetalleDescargaFaena = getAllDetalleDescargaFaena;
export const createDetalleDescargaFaena = crearDetalleDescargaFaena;
export const updateDetalleDescargaFaena = actualizarDetalleDescargaFaena;
export const deleteDetalleDescargaFaena = eliminarDetalleDescargaFaena;
