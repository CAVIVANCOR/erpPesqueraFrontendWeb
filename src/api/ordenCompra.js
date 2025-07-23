import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Orden de Compra
 * Proporciona funciones para operaciones CRUD en el módulo de órdenes de compra
 */

/**
 * Obtiene todas las órdenes de compra
 * @returns {Promise} Lista de órdenes de compra
 */
export const getAllOrdenCompra = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/orden-compra`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva orden de compra
 * @param {Object} ordenCompraData - Datos de la orden de compra
 * @returns {Promise} Orden de compra creada
 */
export const crearOrdenCompra = async (ordenCompraData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/orden-compra`, ordenCompraData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una orden de compra existente
 * @param {number} id - ID de la orden de compra
 * @param {Object} ordenCompraData - Datos actualizados
 * @returns {Promise} Orden de compra actualizada
 */
export const actualizarOrdenCompra = async (id, ordenCompraData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/orden-compra/${id}`, ordenCompraData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una orden de compra
 * @param {number} id - ID de la orden de compra a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteOrdenCompra = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/orden-compra/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createOrdenCompra = crearOrdenCompra;
export const updateOrdenCompra = actualizarOrdenCompra;
export const eliminarOrdenCompra = deleteOrdenCompra;
