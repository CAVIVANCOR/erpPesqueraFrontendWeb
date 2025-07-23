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
 * Obtiene todas las liquidaciones de faena pesca del sistema
 * @returns {Promise<Array>} Lista de liquidaciones de faena pesca
 */
export const getAllLiquidacionesFaenaPesca = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/liquidacion-faena-pesca`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener liquidaciones de faena pesca:', error);
    throw error;
  }
};

/**
 * Crea una nueva liquidación de faena pesca
 * @param {Object} liquidacionData - Datos de la liquidación de faena pesca
 * @returns {Promise<Object>} Liquidación de faena pesca creada
 */
export const crearLiquidacionFaenaPesca = async (liquidacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/liquidacion-faena-pesca`, liquidacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear liquidación de faena pesca:', error);
    throw error;
  }
};

/**
 * Actualiza una liquidación de faena pesca existente
 * @param {number} id - ID de la liquidación de faena pesca
 * @param {Object} liquidacionData - Datos actualizados de la liquidación
 * @returns {Promise<Object>} Liquidación de faena pesca actualizada
 */
export const actualizarLiquidacionFaenaPesca = async (id, liquidacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/liquidacion-faena-pesca/${id}`, liquidacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar liquidación de faena pesca:', error);
    throw error;
  }
};

/**
 * Elimina una liquidación de faena pesca
 * @param {number} id - ID de la liquidación de faena pesca a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarLiquidacionFaenaPesca = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/liquidacion-faena-pesca/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar liquidación de faena pesca:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getLiquidacionesFaenaPesca = getAllLiquidacionesFaenaPesca;
export const createLiquidacionFaenaPesca = crearLiquidacionFaenaPesca;
export const updateLiquidacionFaenaPesca = actualizarLiquidacionFaenaPesca;
export const deleteLiquidacionFaenaPesca = eliminarLiquidacionFaenaPesca;
