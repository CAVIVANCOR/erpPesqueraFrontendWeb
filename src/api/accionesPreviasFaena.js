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
 * Obtiene todas las acciones previas de faena del sistema
 * @returns {Promise<Array>} Lista de acciones previas de faena
 */
export const getAllAccionesPreviasFaena = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/acciones-previas-faena`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Crea una nueva acción previa de faena
 * @param {Object} accionData - Datos de la acción previa de faena
 * @returns {Promise<Object>} Acción previa de faena creada
 */
export const crearAccionesPreviasFaena = async (accionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/acciones-previas-faena`, accionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear acción previa de faena:', error);
    throw error;
  }
};

/**
 * Actualiza una acción previa de faena existente
 * @param {number} id - ID de la acción previa de faena
 * @param {Object} accionData - Datos actualizados de la acción
 * @returns {Promise<Object>} Acción previa de faena actualizada
 */
export const actualizarAccionesPreviasFaena = async (id, accionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/acciones-previas-faena/${id}`, accionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar acción previa de faena:', error);
    throw error;
  }
};

/**
 * Elimina una acción previa de faena
 * @param {number} id - ID de la acción previa de faena a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAccionesPreviasFaena = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/acciones-previas-faena/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar acción previa de faena:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getAccionesPreviasFaena = getAllAccionesPreviasFaena;
export const createAccionesPreviasFaena = crearAccionesPreviasFaena;
export const updateAccionesPreviasFaena = actualizarAccionesPreviasFaena;
export const deleteAccionesPreviasFaena = eliminarAccionesPreviasFaena;
