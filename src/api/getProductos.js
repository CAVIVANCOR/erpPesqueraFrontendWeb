import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para obtener Productos
 * Proporciona funciones para obtener productos utilizados en otros módulos
 */

/**
 * Obtiene todos los productos
 * @returns {Promise} Lista de productos
 */
export const getProductos = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/producto`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene todos los productos (alias)
 * @returns {Promise} Lista de productos
 */
export const getAllProductos = async () => {
  return getProductos();
};
