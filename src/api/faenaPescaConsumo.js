import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Faena Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de faenas de pesca de consumo
 */

/**
 * Obtiene todas las faenas de pesca de consumo
 * @returns {Promise} Lista de faenas de pesca de consumo
 */
export const getAllFaenaPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/faena-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva faena de pesca de consumo
 * @param {Object} faenaPescaConsumoData - Datos de la faena de pesca de consumo
 * @returns {Promise} Faena de pesca de consumo creada
 */
export const crearFaenaPescaConsumo = async (faenaPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/faena-pesca-consumo`, faenaPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una faena de pesca de consumo existente
 * @param {number} id - ID de la faena de pesca de consumo
 * @param {Object} faenaPescaConsumoData - Datos actualizados
 * @returns {Promise} Faena de pesca de consumo actualizada
 */
export const actualizarFaenaPescaConsumo = async (id, faenaPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/faena-pesca-consumo/${id}`, faenaPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una faena de pesca de consumo
 * @param {number} id - ID de la faena de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteFaenaPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/faena-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createFaenaPescaConsumo = crearFaenaPescaConsumo;
export const updateFaenaPescaConsumo = actualizarFaenaPescaConsumo;
export const eliminarFaenaPescaConsumo = deleteFaenaPescaConsumo;
