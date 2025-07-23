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
 * Obtiene todas las entregas a rendir del sistema
 * @returns {Promise<Array>} Lista de entregas a rendir
 */
export const getAllEntregaARendir = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/entrega-a-rendir`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener entregas a rendir:', error);
    throw error;
  }
};

/**
 * Crea una nueva entrega a rendir
 * @param {Object} entregaData - Datos de la entrega a rendir
 * @returns {Promise<Object>} Entrega a rendir creada
 */
export const crearEntregaARendir = async (entregaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/entrega-a-rendir`, entregaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear entrega a rendir:', error);
    throw error;
  }
};

/**
 * Actualiza una entrega a rendir existente
 * @param {number} id - ID de la entrega a rendir
 * @param {Object} entregaData - Datos actualizados de la entrega
 * @returns {Promise<Object>} Entrega a rendir actualizada
 */
export const actualizarEntregaARendir = async (id, entregaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/entrega-a-rendir/${id}`, entregaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar entrega a rendir:', error);
    throw error;
  }
};

/**
 * Elimina una entrega a rendir
 * @param {number} id - ID de la entrega a rendir a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarEntregaARendir = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/entrega-a-rendir/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar entrega a rendir:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getEntregaARendir = getAllEntregaARendir;
export const createEntregaARendir = crearEntregaARendir;
export const updateEntregaARendir = actualizarEntregaARendir;
export const deleteEntregaARendir = eliminarEntregaARendir;
