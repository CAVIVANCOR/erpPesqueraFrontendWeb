import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Novedad Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de novedades de pesca de consumo
 */

/**
 * Obtiene todas las novedades de pesca de consumo
 * @returns {Promise} Lista de novedades de pesca de consumo
 */
export const getAllNovedadPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/novedad-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva novedad de pesca de consumo
 * @param {Object} novedadPescaConsumoData - Datos de la novedad de pesca de consumo
 * @returns {Promise} Novedad de pesca de consumo creada
 */
export const crearNovedadPescaConsumo = async (novedadPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/novedad-pesca-consumo`, novedadPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una novedad de pesca de consumo existente
 * @param {number} id - ID de la novedad de pesca de consumo
 * @param {Object} novedadPescaConsumoData - Datos actualizados
 * @returns {Promise} Novedad de pesca de consumo actualizada
 */
export const actualizarNovedadPescaConsumo = async (id, novedadPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/novedad-pesca-consumo/${id}`, novedadPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una novedad de pesca de consumo
 * @param {number} id - ID de la novedad de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteNovedadPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/novedad-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createNovedadPescaConsumo = crearNovedadPescaConsumo;
export const updateNovedadPescaConsumo = actualizarNovedadPescaConsumo;
export const eliminarNovedadPescaConsumo = deleteNovedadPescaConsumo;
