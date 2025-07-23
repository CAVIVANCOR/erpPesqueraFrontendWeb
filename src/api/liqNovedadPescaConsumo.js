import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Liquidación Novedad Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de liquidaciones de novedades de pesca de consumo
 */

/**
 * Obtiene todas las liquidaciones de novedades de pesca de consumo
 * @returns {Promise} Lista de liquidaciones de novedades de pesca de consumo
 */
export const getAllLiqNovedadPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/liq-novedad-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva liquidación de novedad de pesca de consumo
 * @param {Object} liqNovedadPescaConsumoData - Datos de la liquidación de novedad de pesca de consumo
 * @returns {Promise} Liquidación de novedad de pesca de consumo creada
 */
export const crearLiqNovedadPescaConsumo = async (liqNovedadPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/liq-novedad-pesca-consumo`, liqNovedadPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una liquidación de novedad de pesca de consumo existente
 * @param {number} id - ID de la liquidación de novedad de pesca de consumo
 * @param {Object} liqNovedadPescaConsumoData - Datos actualizados
 * @returns {Promise} Liquidación de novedad de pesca de consumo actualizada
 */
export const actualizarLiqNovedadPescaConsumo = async (id, liqNovedadPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/liq-novedad-pesca-consumo/${id}`, liqNovedadPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una liquidación de novedad de pesca de consumo
 * @param {number} id - ID de la liquidación de novedad de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteLiqNovedadPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/liq-novedad-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createLiqNovedadPescaConsumo = crearLiqNovedadPescaConsumo;
export const updateLiqNovedadPescaConsumo = actualizarLiqNovedadPescaConsumo;
export const eliminarLiqNovedadPescaConsumo = deleteLiqNovedadPescaConsumo;
