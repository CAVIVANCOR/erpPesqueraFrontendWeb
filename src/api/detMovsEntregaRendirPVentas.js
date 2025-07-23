import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Movimientos Entrega Rendir Proceso Ventas
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de movimientos de entregas a rendir de procesos de ventas
 */

/**
 * Obtiene todos los detalles de movimientos de entregas a rendir de procesos de ventas
 * @returns {Promise} Lista de detalles de movimientos de entregas a rendir de procesos de ventas
 */
export const getAllDetMovsEntregaRendirPVentas = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-p-ventas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de movimiento de entrega a rendir de proceso de ventas
 * @param {Object} detMovsEntregaRendirPVentasData - Datos del detalle de movimiento de entrega a rendir de proceso de ventas
 * @returns {Promise} Detalle de movimiento de entrega a rendir de proceso de ventas creado
 */
export const crearDetMovsEntregaRendirPVentas = async (detMovsEntregaRendirPVentasData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-movs-entrega-rendir-p-ventas`, detMovsEntregaRendirPVentasData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de movimiento de entrega a rendir de proceso de ventas existente
 * @param {number} id - ID del detalle de movimiento de entrega a rendir de proceso de ventas
 * @param {Object} detMovsEntregaRendirPVentasData - Datos actualizados
 * @returns {Promise} Detalle de movimiento de entrega a rendir de proceso de ventas actualizado
 */
export const actualizarDetMovsEntregaRendirPVentas = async (id, detMovsEntregaRendirPVentasData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-movs-entrega-rendir-p-ventas/${id}`, detMovsEntregaRendirPVentasData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de movimiento de entrega a rendir de proceso de ventas
 * @param {number} id - ID del detalle de movimiento de entrega a rendir de proceso de ventas a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetMovsEntregaRendirPVentas = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-movs-entrega-rendir-p-ventas/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetMovsEntregaRendirPVentas = crearDetMovsEntregaRendirPVentas;
export const updateDetMovsEntregaRendirPVentas = actualizarDetMovsEntregaRendirPVentas;
export const eliminarDetMovsEntregaRendirPVentas = deleteDetMovsEntregaRendirPVentas;
