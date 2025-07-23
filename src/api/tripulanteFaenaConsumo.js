import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Tripulante Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de tripulantes de faenas de consumo
 */

/**
 * Obtiene todos los tripulantes de faenas de consumo
 * @returns {Promise} Lista de tripulantes de faenas de consumo
 */
export const getAllTripulanteFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/tripulante-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo tripulante de faena de consumo
 * @param {Object} tripulanteFaenaConsumoData - Datos del tripulante de faena de consumo
 * @returns {Promise} Tripulante de faena de consumo creado
 */
export const crearTripulanteFaenaConsumo = async (tripulanteFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/tripulante-faena-consumo`, tripulanteFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un tripulante de faena de consumo existente
 * @param {number} id - ID del tripulante de faena de consumo
 * @param {Object} tripulanteFaenaConsumoData - Datos actualizados
 * @returns {Promise} Tripulante de faena de consumo actualizado
 */
export const actualizarTripulanteFaenaConsumo = async (id, tripulanteFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/tripulante-faena-consumo/${id}`, tripulanteFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un tripulante de faena de consumo
 * @param {number} id - ID del tripulante de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTripulanteFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/tripulante-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createTripulanteFaenaConsumo = crearTripulanteFaenaConsumo;
export const updateTripulanteFaenaConsumo = actualizarTripulanteFaenaConsumo;
export const eliminarTripulanteFaenaConsumo = deleteTripulanteFaenaConsumo;
