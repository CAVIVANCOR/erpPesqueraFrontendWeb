import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Entrega a Rendir Proceso Ventas
 * Proporciona funciones para operaciones CRUD en el módulo de entregas a rendir de procesos de ventas
 */

/**
 * Obtiene todas las entregas a rendir de procesos de ventas
 * @returns {Promise} Lista de entregas a rendir de procesos de ventas
 */
export const getAllEntregaARendirPVentas = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entrega-a-rendir-p-ventas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva entrega a rendir de proceso de ventas
 * @param {Object} entregaARendirPVentasData - Datos de la entrega a rendir de proceso de ventas
 * @returns {Promise} Entrega a rendir de proceso de ventas creada
 */
export const crearEntregaARendirPVentas = async (entregaARendirPVentasData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/entrega-a-rendir-p-ventas`, entregaARendirPVentasData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una entrega a rendir de proceso de ventas existente
 * @param {number} id - ID de la entrega a rendir de proceso de ventas
 * @param {Object} entregaARendirPVentasData - Datos actualizados
 * @returns {Promise} Entrega a rendir de proceso de ventas actualizada
 */
export const actualizarEntregaARendirPVentas = async (id, entregaARendirPVentasData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/entrega-a-rendir-p-ventas/${id}`, entregaARendirPVentasData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una entrega a rendir de proceso de ventas
 * @param {number} id - ID de la entrega a rendir de proceso de ventas a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteEntregaARendirPVentas = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/entrega-a-rendir-p-ventas/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createEntregaARendirPVentas = crearEntregaARendirPVentas;
export const updateEntregaARendirPVentas = actualizarEntregaARendirPVentas;
export const eliminarEntregaARendirPVentas = deleteEntregaARendirPVentas;
