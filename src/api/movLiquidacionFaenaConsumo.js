import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Movimiento Liquidación Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de movimientos de liquidación de faenas de consumo
 */

/**
 * Obtiene todos los movimientos de liquidación de faenas de consumo
 * @returns {Promise} Lista de movimientos de liquidación de faenas de consumo
 */
export const getAllMovLiquidacionFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/mov-liquidacion-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo movimiento de liquidación de faena de consumo
 * @param {Object} movLiquidacionFaenaConsumoData - Datos del movimiento de liquidación de faena de consumo
 * @returns {Promise} Movimiento de liquidación de faena de consumo creado
 */
export const crearMovLiquidacionFaenaConsumo = async (movLiquidacionFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/mov-liquidacion-faena-consumo`, movLiquidacionFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un movimiento de liquidación de faena de consumo existente
 * @param {number} id - ID del movimiento de liquidación de faena de consumo
 * @param {Object} movLiquidacionFaenaConsumoData - Datos actualizados
 * @returns {Promise} Movimiento de liquidación de faena de consumo actualizado
 */
export const actualizarMovLiquidacionFaenaConsumo = async (id, movLiquidacionFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/mov-liquidacion-faena-consumo/${id}`, movLiquidacionFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un movimiento de liquidación de faena de consumo
 * @param {number} id - ID del movimiento de liquidación de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteMovLiquidacionFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/mov-liquidacion-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createMovLiquidacionFaenaConsumo = crearMovLiquidacionFaenaConsumo;
export const updateMovLiquidacionFaenaConsumo = actualizarMovLiquidacionFaenaConsumo;
export const eliminarMovLiquidacionFaenaConsumo = deleteMovLiquidacionFaenaConsumo;
