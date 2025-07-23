import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Movimientos Entrega Rendir Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de movimientos de entregas a rendir de pesca de consumo
 */

/**
 * Obtiene todos los detalles de movimientos de entregas a rendir de pesca de consumo
 * @returns {Promise} Lista de detalles de movimientos de entregas a rendir de pesca de consumo
 */
export const getAllDetMovsEntRendirPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-ent-rendir-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de movimiento de entrega a rendir de pesca de consumo
 * @param {Object} detMovsEntRendirPescaConsumoData - Datos del detalle de movimiento de entrega a rendir de pesca de consumo
 * @returns {Promise} Detalle de movimiento de entrega a rendir de pesca de consumo creado
 */
export const crearDetMovsEntRendirPescaConsumo = async (detMovsEntRendirPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-movs-ent-rendir-pesca-consumo`, detMovsEntRendirPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de movimiento de entrega a rendir de pesca de consumo existente
 * @param {number} id - ID del detalle de movimiento de entrega a rendir de pesca de consumo
 * @param {Object} detMovsEntRendirPescaConsumoData - Datos actualizados
 * @returns {Promise} Detalle de movimiento de entrega a rendir de pesca de consumo actualizado
 */
export const actualizarDetMovsEntRendirPescaConsumo = async (id, detMovsEntRendirPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-movs-ent-rendir-pesca-consumo/${id}`, detMovsEntRendirPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de movimiento de entrega a rendir de pesca de consumo
 * @param {number} id - ID del detalle de movimiento de entrega a rendir de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetMovsEntRendirPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-movs-ent-rendir-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetMovsEntRendirPescaConsumo = crearDetMovsEntRendirPescaConsumo;
export const updateDetMovsEntRendirPescaConsumo = actualizarDetMovsEntRendirPescaConsumo;
export const eliminarDetMovsEntRendirPescaConsumo = deleteDetMovsEntRendirPescaConsumo;
