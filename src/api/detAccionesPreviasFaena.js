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
 * Obtiene todos los detalles de acciones previas de faena del sistema
 * @returns {Promise<Array>} Lista de detalles de acciones previas de faena
 */
export const getAllDetAccionesPreviasFaena = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/det-acciones-previas-faena`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de acciones previas de faena
 * @param {Object} detalleData - Datos del detalle de acciones previas de faena
 * @returns {Promise<Object>} Detalle de acciones previas de faena creado
 */
export const crearDetAccionesPreviasFaena = async (detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/det-acciones-previas-faena`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de acciones previas de faena existente
 * @param {number} id - ID del detalle de acciones previas de faena
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de acciones previas de faena actualizado
 */
export const actualizarDetAccionesPreviasFaena = async (id, detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/det-acciones-previas-faena/${id}`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de acciones previas de faena
 * @param {number} id - ID del detalle de acciones previas de faena a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetAccionesPreviasFaena = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/det-acciones-previas-faena/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de acciones previas de faena:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDetAccionesPreviasFaena = getAllDetAccionesPreviasFaena;
export const createDetAccionesPreviasFaena = crearDetAccionesPreviasFaena;
export const updateDetAccionesPreviasFaena = actualizarDetAccionesPreviasFaena;
export const deleteDetAccionesPreviasFaena = eliminarDetAccionesPreviasFaena;
