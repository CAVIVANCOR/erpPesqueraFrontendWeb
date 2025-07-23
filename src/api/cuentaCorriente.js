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
 * Obtiene todas las cuentas corrientes del sistema
 * @returns {Promise<Array>} Lista de cuentas corrientes
 */
export const getAllCuentaCorriente = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/cuenta-corriente`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cuentas corrientes:', error);
    throw error;
  }
};

/**
 * Crea una nueva cuenta corriente
 * @param {Object} cuentaData - Datos de la cuenta corriente
 * @returns {Promise<Object>} Cuenta corriente creada
 */
export const crearCuentaCorriente = async (cuentaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/cuenta-corriente`, cuentaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear cuenta corriente:', error);
    throw error;
  }
};

/**
 * Actualiza una cuenta corriente existente
 * @param {number} id - ID de la cuenta corriente
 * @param {Object} cuentaData - Datos actualizados de la cuenta
 * @returns {Promise<Object>} Cuenta corriente actualizada
 */
export const actualizarCuentaCorriente = async (id, cuentaData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/cuenta-corriente/${id}`, cuentaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar cuenta corriente:', error);
    throw error;
  }
};

/**
 * Elimina una cuenta corriente
 * @param {number} id - ID de la cuenta corriente a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarCuentaCorriente = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/cuenta-corriente/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar cuenta corriente:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getCuentaCorriente = getAllCuentaCorriente;
export const createCuentaCorriente = crearCuentaCorriente;
export const updateCuentaCorriente = actualizarCuentaCorriente;
export const deleteCuentaCorriente = eliminarCuentaCorriente;
