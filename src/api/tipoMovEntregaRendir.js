import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Tipo Movimiento Entrega Rendir
 * Proporciona funciones para operaciones CRUD en el módulo de tipos de movimientos de entregas a rendir
 */

/**
 * Obtiene todos los tipos de movimientos de entregas a rendir
 * @returns {Promise} Lista de tipos de movimientos de entregas a rendir
 */
export const getTiposMovEntregaRendir = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/tipo-mov-entrega-rendir`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene todos los tipos de movimientos de entregas a rendir (alias)
 * @returns {Promise} Lista de tipos de movimientos de entregas a rendir
 */
export const getAllTipoMovEntregaRendir = async () => {
  return getTiposMovEntregaRendir();
};

/**
 * Crea un nuevo tipo de movimiento de entrega a rendir
 * @param {Object} tipoMovEntregaRendirData - Datos del tipo de movimiento de entrega a rendir
 * @returns {Promise} Tipo de movimiento de entrega a rendir creado
 */
export const crearTipoMovEntregaRendir = async (tipoMovEntregaRendirData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/tipo-mov-entrega-rendir`, tipoMovEntregaRendirData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un tipo de movimiento de entrega a rendir existente
 * @param {number} id - ID del tipo de movimiento de entrega a rendir
 * @param {Object} tipoMovEntregaRendirData - Datos actualizados
 * @returns {Promise} Tipo de movimiento de entrega a rendir actualizado
 */
export const actualizarTipoMovEntregaRendir = async (id, tipoMovEntregaRendirData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/tipo-mov-entrega-rendir/${id}`, tipoMovEntregaRendirData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un tipo de movimiento de entrega a rendir
 * @param {number} id - ID del tipo de movimiento de entrega a rendir a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTipoMovEntregaRendir = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/tipo-mov-entrega-rendir/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createTipoMovEntregaRendir = crearTipoMovEntregaRendir;
export const updateTipoMovEntregaRendir = actualizarTipoMovEntregaRendir;
export const eliminarTipoMovEntregaRendir = deleteTipoMovEntregaRendir;
