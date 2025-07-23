import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Orden Compra
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de órdenes de compra
 */

/**
 * Obtiene todos los detalles de órdenes de compra
 * @returns {Promise} Lista de detalles de órdenes de compra
 */
export const getAllDetalleOrdenCompra = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/detalle-orden-compra`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de orden de compra
 * @param {Object} detalleOrdenCompraData - Datos del detalle de orden de compra
 * @returns {Promise} Detalle de orden de compra creado
 */
export const crearDetalleOrdenCompra = async (detalleOrdenCompraData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/detalle-orden-compra`, detalleOrdenCompraData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de orden de compra existente
 * @param {number} id - ID del detalle de orden de compra
 * @param {Object} detalleOrdenCompraData - Datos actualizados
 * @returns {Promise} Detalle de orden de compra actualizado
 */
export const actualizarDetalleOrdenCompra = async (id, detalleOrdenCompraData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/detalle-orden-compra/${id}`, detalleOrdenCompraData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de orden de compra
 * @param {number} id - ID del detalle de orden de compra a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetalleOrdenCompra = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/detalle-orden-compra/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetalleOrdenCompra = crearDetalleOrdenCompra;
export const updateDetalleOrdenCompra = actualizarDetalleOrdenCompra;
export const eliminarDetalleOrdenCompra = deleteDetalleOrdenCompra;
