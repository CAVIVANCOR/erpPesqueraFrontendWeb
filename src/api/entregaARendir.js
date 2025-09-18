import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/entregas-a-rendir`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las entregas a rendir del sistema
 * @returns {Promise<Array>} Lista de entregas a rendir
 */
export const getAllEntregaARendir = async () => {
  try {
    const res = await axios.get(API_URL, { headers: getAuthHeaders() });
    return res.data;
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
    const response = await axios.post(API_URL, entregaData, {
      headers: getAuthHeaders()
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
    const response = await axios.put(`${API_URL}/${id}`, entregaData, {
      headers: getAuthHeaders()
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
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar entrega a rendir:', error);
    throw error;
  }
};
