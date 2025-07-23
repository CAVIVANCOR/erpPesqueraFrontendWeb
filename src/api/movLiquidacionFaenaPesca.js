import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Movimiento Liquidación Faena Pesca
 * Proporciona funciones para operaciones CRUD en el módulo de movimientos de liquidación de faenas de pesca
 */

/**
 * Obtiene todos los movimientos de liquidación de faenas de pesca
 * @returns {Promise} Lista de movimientos de liquidación de faenas de pesca
 */
export const getAllMovLiquidacionFaenaPesca = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/mov-liquidacion-faena-pesca`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo movimiento de liquidación de faena de pesca
 * @param {Object} movLiquidacionFaenaPescaData - Datos del movimiento de liquidación de faena de pesca
 * @returns {Promise} Movimiento de liquidación de faena de pesca creado
 */
export const crearMovLiquidacionFaenaPesca = async (movLiquidacionFaenaPescaData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/mov-liquidacion-faena-pesca`, movLiquidacionFaenaPescaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un movimiento de liquidación de faena de pesca existente
 * @param {number} id - ID del movimiento de liquidación de faena de pesca
 * @param {Object} movLiquidacionFaenaPescaData - Datos actualizados
 * @returns {Promise} Movimiento de liquidación de faena de pesca actualizado
 */
export const actualizarMovLiquidacionFaenaPesca = async (id, movLiquidacionFaenaPescaData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/mov-liquidacion-faena-pesca/${id}`, movLiquidacionFaenaPescaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un movimiento de liquidación de faena de pesca
 * @param {number} id - ID del movimiento de liquidación de faena de pesca a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteMovLiquidacionFaenaPesca = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/mov-liquidacion-faena-pesca/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createMovLiquidacionFaenaPesca = crearMovLiquidacionFaenaPesca;
export const updateMovLiquidacionFaenaPesca = actualizarMovLiquidacionFaenaPesca;
export const eliminarMovLiquidacionFaenaPesca = deleteMovLiquidacionFaenaPesca;
