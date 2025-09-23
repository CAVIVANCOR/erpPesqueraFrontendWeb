import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-referencia-movimiento-caja`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
/**
 * Obtiene todos los tipos de referencia de movimiento de caja del sistema
 * @returns {Promise<Array>} Lista de tipos de referencia de movimiento de caja
 */
export const getAllTipoReferenciaMovimientoCaja = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de referencia de movimiento de caja:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de referencia de movimiento de caja
 * @param {Object} tipoReferenciaData - Datos del tipo de referencia de movimiento de caja
 * @returns {Promise<Object>} Tipo de referencia de movimiento de caja creado
 */
export const crearTipoReferenciaMovimientoCaja = async (tipoReferenciaData) => {
  try {
    const response = await axios.post(`${API_URL}`, tipoReferenciaData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear tipo de referencia de movimiento de caja:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de referencia de movimiento de caja existente
 * @param {number} id - ID del tipo de referencia de movimiento de caja
 * @param {Object} tipoReferenciaData - Datos actualizados del tipo de referencia
 * @returns {Promise<Object>} Tipo de referencia de movimiento de caja actualizado
 */
export const actualizarTipoReferenciaMovimientoCaja = async (id, tipoReferenciaData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, tipoReferenciaData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar tipo de referencia de movimiento de caja:', error);
    throw error;
  }
};

/**
 * Elimina un tipo de referencia de movimiento de caja
 * @param {number} id - ID del tipo de referencia de movimiento de caja a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarTipoReferenciaMovimientoCaja = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar tipo de referencia de movimiento de caja:', error);
    throw error;
  }
};
