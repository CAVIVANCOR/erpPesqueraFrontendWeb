import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Liquidación Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de liquidaciones de faenas de consumo
 */

/**
 * Obtiene todas las liquidaciones de faenas de consumo
 * @returns {Promise} Lista de liquidaciones de faenas de consumo
 */
export const getAllLiquidacionFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/liquidacion-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva liquidación de faena de consumo
 * @param {Object} liquidacionFaenaConsumoData - Datos de la liquidación de faena de consumo
 * @returns {Promise} Liquidación de faena de consumo creada
 */
export const crearLiquidacionFaenaConsumo = async (liquidacionFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/liquidacion-faena-consumo`, liquidacionFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una liquidación de faena de consumo existente
 * @param {number} id - ID de la liquidación de faena de consumo
 * @param {Object} liquidacionFaenaConsumoData - Datos actualizados
 * @returns {Promise} Liquidación de faena de consumo actualizada
 */
export const actualizarLiquidacionFaenaConsumo = async (id, liquidacionFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/liquidacion-faena-consumo/${id}`, liquidacionFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una liquidación de faena de consumo
 * @param {number} id - ID de la liquidación de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteLiquidacionFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/liquidacion-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createLiquidacionFaenaConsumo = crearLiquidacionFaenaConsumo;
export const updateLiquidacionFaenaConsumo = actualizarLiquidacionFaenaConsumo;
export const eliminarLiquidacionFaenaConsumo = deleteLiquidacionFaenaConsumo;
