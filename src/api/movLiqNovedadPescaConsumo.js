import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Movimiento Liquidación Novedad Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de movimientos de liquidación de novedades de pesca de consumo
 */

/**
 * Obtiene todos los movimientos de liquidación de novedades de pesca de consumo
 * @returns {Promise} Lista de movimientos de liquidación de novedades de pesca de consumo
 */
export const getAllMovLiqNovedadPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/mov-liq-novedad-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo movimiento de liquidación de novedad de pesca de consumo
 * @param {Object} movLiqNovedadPescaConsumoData - Datos del movimiento de liquidación de novedad de pesca de consumo
 * @returns {Promise} Movimiento de liquidación de novedad de pesca de consumo creado
 */
export const crearMovLiqNovedadPescaConsumo = async (movLiqNovedadPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/mov-liq-novedad-pesca-consumo`, movLiqNovedadPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un movimiento de liquidación de novedad de pesca de consumo existente
 * @param {number} id - ID del movimiento de liquidación de novedad de pesca de consumo
 * @param {Object} movLiqNovedadPescaConsumoData - Datos actualizados
 * @returns {Promise} Movimiento de liquidación de novedad de pesca de consumo actualizado
 */
export const actualizarMovLiqNovedadPescaConsumo = async (id, movLiqNovedadPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/mov-liq-novedad-pesca-consumo/${id}`, movLiqNovedadPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un movimiento de liquidación de novedad de pesca de consumo
 * @param {number} id - ID del movimiento de liquidación de novedad de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteMovLiqNovedadPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/mov-liq-novedad-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createMovLiqNovedadPescaConsumo = crearMovLiqNovedadPescaConsumo;
export const updateMovLiqNovedadPescaConsumo = actualizarMovLiqNovedadPescaConsumo;
export const eliminarMovLiqNovedadPescaConsumo = deleteMovLiqNovedadPescaConsumo;
