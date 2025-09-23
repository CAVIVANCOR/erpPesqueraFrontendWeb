import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/movimientos-caja`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los movimientos de caja del sistema
 * @returns {Promise<Array>} Lista de movimientos de caja
 */
export const getAllMovimientoCaja = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener movimientos de caja:', error);
    throw error;
  }
};

/**
 * Crea un nuevo movimiento de caja
 * @param {Object} movimientoData - Datos del movimiento de caja
 * @returns {Promise<Object>} Movimiento de caja creado
 */
export const crearMovimientoCaja = async (movimientoData) => {
  try {
    const response = await axios.post(`${API_URL}`, movimientoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear movimiento de caja:', error);
    throw error;
  }
};

/**
 * Actualiza un movimiento de caja existente
 * @param {number} id - ID del movimiento de caja
 * @param {Object} movimientoData - Datos actualizados del movimiento
 * @returns {Promise<Object>} Movimiento de caja actualizado
 */
export const actualizarMovimientoCaja = async (id, movimientoData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, movimientoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar movimiento de caja:', error);
    throw error;
  }
};

/**
 * Elimina un movimiento de caja
 * @param {number} id - ID del movimiento de caja a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarMovimientoCaja = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar movimiento de caja:', error);
    throw error;
  }
};
