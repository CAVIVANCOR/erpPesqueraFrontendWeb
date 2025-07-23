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
 * Obtiene todos los asientos contables interfaz del sistema
 * @returns {Promise<Array>} Lista de asientos contables interfaz
 */
export const getAllAsientoContableInterfaz = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/asiento-contable-interfaz`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener asientos contables interfaz:', error);
    throw error;
  }
};

/**
 * Crea un nuevo asiento contable interfaz
 * @param {Object} asientoData - Datos del asiento contable interfaz
 * @returns {Promise<Object>} Asiento contable interfaz creado
 */
export const crearAsientoContableInterfaz = async (asientoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/asiento-contable-interfaz`, asientoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear asiento contable interfaz:', error);
    throw error;
  }
};

/**
 * Actualiza un asiento contable interfaz existente
 * @param {number} id - ID del asiento contable interfaz
 * @param {Object} asientoData - Datos actualizados del asiento
 * @returns {Promise<Object>} Asiento contable interfaz actualizado
 */
export const actualizarAsientoContableInterfaz = async (id, asientoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/asiento-contable-interfaz/${id}`, asientoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar asiento contable interfaz:', error);
    throw error;
  }
};

/**
 * Elimina un asiento contable interfaz
 * @param {number} id - ID del asiento contable interfaz a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAsientoContableInterfaz = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/asiento-contable-interfaz/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar asiento contable interfaz:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getAsientoContableInterfaz = getAllAsientoContableInterfaz;
export const createAsientoContableInterfaz = crearAsientoContableInterfaz;
export const updateAsientoContableInterfaz = actualizarAsientoContableInterfaz;
export const deleteAsientoContableInterfaz = eliminarAsientoContableInterfaz;
