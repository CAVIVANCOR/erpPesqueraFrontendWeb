import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/categorias-tipo-mov-entrega-rendir`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * API para gestión de Categoría Tipo Movimiento Entrega Rendir
 * Proporciona funciones para operaciones CRUD en el módulo de categorías de tipos de movimientos de entregas a rendir
 */

/**
 * Obtiene todas las categorías de tipos de movimientos de entregas a rendir
 * @returns {Promise} Lista de categorías de tipos de movimientos de entregas a rendir
 */
export const getAllCategoriaTipoMovEntregaRendir = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Crea una nueva categoría de tipo de movimiento de entrega a rendir
 * @param {Object} categoriaData - Datos de la categoría de tipo de movimiento de entrega a rendir
 * @returns {Promise} Categoría de tipo de movimiento de entrega a rendir creada
 */
export const crearCategoriaTipoMovEntregaRendir = async (categoriaData) => {
  const response = await axios.post(API_URL, categoriaData, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Actualiza una categoría de tipo de movimiento de entrega a rendir existente
 * @param {number} id - ID de la categoría de tipo de movimiento de entrega a rendir
 * @param {Object} categoriaData - Datos actualizados
 * @returns {Promise} Categoría de tipo de movimiento de entrega a rendir actualizada
 */
export const actualizarCategoriaTipoMovEntregaRendir = async (id, categoriaData) => {
  const response = await axios.put(`${API_URL}/${id}`, categoriaData, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Elimina una categoría de tipo de movimiento de entrega a rendir
 * @param {number} id - ID de la categoría de tipo de movimiento de entrega a rendir a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteCategoriaTipoMovEntregaRendir = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};