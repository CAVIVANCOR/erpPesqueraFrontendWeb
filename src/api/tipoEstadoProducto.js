import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-estado-producto`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}
/**
 * API para gestión de Tipo Estado Producto
 * Proporciona funciones para operaciones CRUD en el módulo de tipos de estado de productos
 */

/**
 * Obtiene todos los tipos de estado de productos
 * @returns {Promise} Lista de tipos de estado de productos
 */
export const getAllTipoEstadoProducto = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Crea un nuevo tipo de estado de producto
 * @param {Object} tipoEstadoProductoData - Datos del tipo de estado de producto
 * @returns {Promise} Tipo de estado de producto creado
 */
export const crearTipoEstadoProducto = async (tipoEstadoProductoData) => {
  const response = await axios.post(API_URL, tipoEstadoProductoData, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Actualiza un tipo de estado de producto existente
 * @param {number} id - ID del tipo de estado de producto
 * @param {Object} tipoEstadoProductoData - Datos actualizados
 * @returns {Promise} Tipo de estado de producto actualizado
 */
export const actualizarTipoEstadoProducto = async (id, tipoEstadoProductoData) => {
  const response = await axios.put(`${API_URL}/${id}`, tipoEstadoProductoData, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Elimina un tipo de estado de producto
 * @param {number} id - ID del tipo de estado de producto a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTipoEstadoProducto = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};

