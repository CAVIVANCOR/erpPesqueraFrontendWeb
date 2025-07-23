import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Cala Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de calas de pesca de consumo
 */

/**
 * Obtiene todos los detalles de calas de pesca de consumo
 * @returns {Promise} Lista de detalles de calas de pesca de consumo
 */
export const getAllDetCalaPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-cala-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de cala de pesca de consumo
 * @param {Object} detCalaPescaConsumoData - Datos del detalle de cala de pesca de consumo
 * @returns {Promise} Detalle de cala de pesca de consumo creado
 */
export const crearDetCalaPescaConsumo = async (detCalaPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-cala-pesca-consumo`, detCalaPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de cala de pesca de consumo existente
 * @param {number} id - ID del detalle de cala de pesca de consumo
 * @param {Object} detCalaPescaConsumoData - Datos actualizados
 * @returns {Promise} Detalle de cala de pesca de consumo actualizado
 */
export const actualizarDetCalaPescaConsumo = async (id, detCalaPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-cala-pesca-consumo/${id}`, detCalaPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de cala de pesca de consumo
 * @param {number} id - ID del detalle de cala de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetCalaPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-cala-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetCalaPescaConsumo = crearDetCalaPescaConsumo;
export const updateDetCalaPescaConsumo = actualizarDetCalaPescaConsumo;
export const eliminarDetCalaPescaConsumo = deleteDetCalaPescaConsumo;
