import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Cala Faena Consumo Produce
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de calas de faena de consumo que produce
 */

/**
 * Obtiene todos los detalles de calas de faena de consumo que producen
 * @returns {Promise} Lista de detalles de calas de faena de consumo que producen
 */
export const getAllDetCalaFaenaConsumoProduce = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-cala-faena-consumo-produce`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de cala de faena de consumo que produce
 * @param {Object} detCalaFaenaConsumoProduceData - Datos del detalle de cala de faena de consumo que produce
 * @returns {Promise} Detalle de cala de faena de consumo que produce creado
 */
export const crearDetCalaFaenaConsumoProduce = async (detCalaFaenaConsumoProduceData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-cala-faena-consumo-produce`, detCalaFaenaConsumoProduceData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de cala de faena de consumo que produce existente
 * @param {number} id - ID del detalle de cala de faena de consumo que produce
 * @param {Object} detCalaFaenaConsumoProduceData - Datos actualizados
 * @returns {Promise} Detalle de cala de faena de consumo que produce actualizado
 */
export const actualizarDetCalaFaenaConsumoProduce = async (id, detCalaFaenaConsumoProduceData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-cala-faena-consumo-produce/${id}`, detCalaFaenaConsumoProduceData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de cala de faena de consumo que produce
 * @param {number} id - ID del detalle de cala de faena de consumo que produce a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetCalaFaenaConsumoProduce = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-cala-faena-consumo-produce/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetCalaFaenaConsumoProduce = crearDetCalaFaenaConsumoProduce;
export const updateDetCalaFaenaConsumoProduce = actualizarDetCalaFaenaConsumoProduce;
export const eliminarDetCalaFaenaConsumoProduce = deleteDetCalaFaenaConsumoProduce;
