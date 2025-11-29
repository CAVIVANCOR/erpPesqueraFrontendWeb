import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Entregas a Rendir de Movimientos de Almacén
 * Proporciona funciones para operaciones CRUD en el módulo de entregas a rendir de movimientos de almacén
 */

/**
 * Obtiene todas las entregas a rendir de movimientos de almacén
 * @returns {Promise} Lista de entregas a rendir
 */
export const getAllEntregaARendirMovAlmacen = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-mov-almacen`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene una entrega a rendir por ID
 * @param {number} id - ID de la entrega a rendir
 * @returns {Promise} Entrega a rendir
 */
export const getEntregaARendirMovAlmacenById = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-mov-almacen/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva entrega a rendir de movimiento de almacén
 * @param {Object} entregaData - Datos de la entrega a rendir
 * @returns {Promise} Entrega a rendir creada
 */
export const crearEntregaARendirMovAlmacen = async (entregaData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/entregas-rendir-mov-almacen`, entregaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una entrega a rendir de movimiento de almacén existente
 * @param {number} id - ID de la entrega a rendir
 * @param {Object} entregaData - Datos actualizados
 * @returns {Promise} Entrega a rendir actualizada
 */
export const actualizarEntregaARendirMovAlmacen = async (id, entregaData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/entregas-rendir-mov-almacen/${id}`, entregaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una entrega a rendir de movimiento de almacén
 * @param {number} id - ID de la entrega a rendir a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteEntregaARendirMovAlmacen = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/entregas-rendir-mov-almacen/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const eliminarEntregaARendirMovAlmacen = deleteEntregaARendirMovAlmacen;
