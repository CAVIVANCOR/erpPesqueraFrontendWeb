import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Entrega a Rendir Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de entregas a rendir de pesca de consumo
 */

/**
 * Obtiene todas las entregas a rendir de pesca de consumo
 * @returns {Promise} Lista de entregas a rendir de pesca de consumo
 */
export const getAllEntregaARendirPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entrega-a-rendir-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva entrega a rendir de pesca de consumo
 * @param {Object} entregaARendirPescaConsumoData - Datos de la entrega a rendir de pesca de consumo
 * @returns {Promise} Entrega a rendir de pesca de consumo creada
 */
export const crearEntregaARendirPescaConsumo = async (entregaARendirPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/entrega-a-rendir-pesca-consumo`, entregaARendirPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una entrega a rendir de pesca de consumo existente
 * @param {number} id - ID de la entrega a rendir de pesca de consumo
 * @param {Object} entregaARendirPescaConsumoData - Datos actualizados
 * @returns {Promise} Entrega a rendir de pesca de consumo actualizada
 */
export const actualizarEntregaARendirPescaConsumo = async (id, entregaARendirPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/entrega-a-rendir-pesca-consumo/${id}`, entregaARendirPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una entrega a rendir de pesca de consumo
 * @param {number} id - ID de la entrega a rendir de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteEntregaARendirPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/entrega-a-rendir-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createEntregaARendirPescaConsumo = crearEntregaARendirPescaConsumo;
export const updateEntregaARendirPescaConsumo = actualizarEntregaARendirPescaConsumo;
export const eliminarEntregaARendirPescaConsumo = deleteEntregaARendirPescaConsumo;
