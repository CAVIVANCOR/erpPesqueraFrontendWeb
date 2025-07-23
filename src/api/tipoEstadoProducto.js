import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Tipo Estado Producto
 * Proporciona funciones para operaciones CRUD en el módulo de tipos de estado de productos
 */

/**
 * Obtiene todos los tipos de estado de productos
 * @returns {Promise} Lista de tipos de estado de productos
 */
export const getAllTipoEstadoProducto = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/tipo-estado-producto`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo tipo de estado de producto
 * @param {Object} tipoEstadoProductoData - Datos del tipo de estado de producto
 * @returns {Promise} Tipo de estado de producto creado
 */
export const crearTipoEstadoProducto = async (tipoEstadoProductoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/tipo-estado-producto`, tipoEstadoProductoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un tipo de estado de producto existente
 * @param {number} id - ID del tipo de estado de producto
 * @param {Object} tipoEstadoProductoData - Datos actualizados
 * @returns {Promise} Tipo de estado de producto actualizado
 */
export const actualizarTipoEstadoProducto = async (id, tipoEstadoProductoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/tipo-estado-producto/${id}`, tipoEstadoProductoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un tipo de estado de producto
 * @param {number} id - ID del tipo de estado de producto a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTipoEstadoProducto = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/tipo-estado-producto/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createTipoEstadoProducto = crearTipoEstadoProducto;
export const updateTipoEstadoProducto = actualizarTipoEstadoProducto;
export const eliminarTipoEstadoProducto = deleteTipoEstadoProducto;
