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
 * Obtiene todos los tipos de cuenta corriente del sistema
 * @returns {Promise<Array>} Lista de tipos de cuenta corriente
 */
export const getAllTipoCuentaCorriente = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/tipo-cuenta-corriente`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de cuenta corriente:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de cuenta corriente
 * @param {Object} tipoCuentaData - Datos del tipo de cuenta corriente
 * @returns {Promise<Object>} Tipo de cuenta corriente creado
 */
export const crearTipoCuentaCorriente = async (tipoCuentaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/tipo-cuenta-corriente`, tipoCuentaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear tipo de cuenta corriente:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de cuenta corriente existente
 * @param {number} id - ID del tipo de cuenta corriente
 * @param {Object} tipoCuentaData - Datos actualizados del tipo de cuenta
 * @returns {Promise<Object>} Tipo de cuenta corriente actualizado
 */
export const actualizarTipoCuentaCorriente = async (id, tipoCuentaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/tipo-cuenta-corriente/${id}`, tipoCuentaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar tipo de cuenta corriente:', error);
    throw error;
  }
};

/**
 * Elimina un tipo de cuenta corriente
 * @param {number} id - ID del tipo de cuenta corriente a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarTipoCuentaCorriente = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/tipo-cuenta-corriente/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar tipo de cuenta corriente:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getTipoCuentaCorriente = getAllTipoCuentaCorriente;
export const createTipoCuentaCorriente = crearTipoCuentaCorriente;
export const updateTipoCuentaCorriente = actualizarTipoCuentaCorriente;
export const deleteTipoCuentaCorriente = eliminarTipoCuentaCorriente;
