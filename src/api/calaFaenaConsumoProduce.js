import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Cala Faena Consumo Produce
 * Proporciona funciones para operaciones CRUD en el módulo de calas de faena de consumo que produce
 */

/**
 * Obtiene todas las calas de faena de consumo que producen
 * @returns {Promise} Lista de calas de faena de consumo que producen
 */
export const getAllCalaFaenaConsumoProduce = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/cala-faena-consumo-produce`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva cala de faena de consumo que produce
 * @param {Object} calaFaenaConsumoProduceData - Datos de la cala de faena de consumo que produce
 * @returns {Promise} Cala de faena de consumo que produce creada
 */
export const crearCalaFaenaConsumoProduce = async (calaFaenaConsumoProduceData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/cala-faena-consumo-produce`, calaFaenaConsumoProduceData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una cala de faena de consumo que produce existente
 * @param {number} id - ID de la cala de faena de consumo que produce
 * @param {Object} calaFaenaConsumoProduceData - Datos actualizados
 * @returns {Promise} Cala de faena de consumo que produce actualizada
 */
export const actualizarCalaFaenaConsumoProduce = async (id, calaFaenaConsumoProduceData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/cala-faena-consumo-produce/${id}`, calaFaenaConsumoProduceData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una cala de faena de consumo que produce
 * @param {number} id - ID de la cala de faena de consumo que produce a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteCalaFaenaConsumoProduce = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/cala-faena-consumo-produce/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createCalaFaenaConsumoProduce = crearCalaFaenaConsumoProduce;
export const updateCalaFaenaConsumoProduce = actualizarCalaFaenaConsumoProduce;
export const eliminarCalaFaenaConsumoProduce = deleteCalaFaenaConsumoProduce;
