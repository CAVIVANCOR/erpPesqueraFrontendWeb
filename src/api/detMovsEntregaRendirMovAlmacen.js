import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Movimientos Entrega Rendir Movimientos de Almacén
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de movimientos de entregas a rendir de movimientos de almacén
 */

/**
 * Obtiene todos los detalles de movimientos de entregas a rendir de movimientos de almacén
 * @returns {Promise} Lista de detalles de movimientos
 */
export const getAllDetMovsEntregaRendirMovAlmacen = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-mov-almacen`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene un detalle de movimiento por ID
 * @param {number} id - ID del detalle de movimiento
 * @returns {Promise} Detalle de movimiento
 */
export const getDetMovsEntregaRendirMovAlmacenById = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-mov-almacen/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene movimientos por ID de entrega
 * @param {number} entregaId - ID de la entrega a rendir
 * @returns {Promise} Lista de movimientos
 */
export const getDetMovsPorEntrega = async (entregaId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-mov-almacen/entrega/${entregaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de movimiento de entrega a rendir de movimiento de almacén
 * @param {Object} detMovsData - Datos del detalle de movimiento
 * @returns {Promise} Detalle de movimiento creado
 */
export const crearDetMovsEntregaRendirMovAlmacen = async (detMovsData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-movs-entrega-rendir-mov-almacen`, detMovsData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de movimiento de entrega a rendir de movimiento de almacén existente
 * @param {number} id - ID del detalle de movimiento
 * @param {Object} detMovsData - Datos actualizados
 * @returns {Promise} Detalle de movimiento actualizado
 */
export const actualizarDetMovsEntregaRendirMovAlmacen = async (id, detMovsData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-movs-entrega-rendir-mov-almacen/${id}`, detMovsData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de movimiento de entrega a rendir de movimiento de almacén
 * @param {number} id - ID del detalle de movimiento a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetMovsEntregaRendirMovAlmacen = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-movs-entrega-rendir-mov-almacen/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const eliminarDetMovsEntregaRendirMovAlmacen = deleteDetMovsEntregaRendirMovAlmacen;
