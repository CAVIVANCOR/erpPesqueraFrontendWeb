import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Documentación Requerida Compras Ventas
 * Proporciona funciones para operaciones CRUD en el módulo de documentación requerida para compras y ventas
 */

/**
 * Obtiene toda la documentación requerida para compras y ventas
 * @returns {Promise} Lista de documentación requerida para compras y ventas
 */
export const getAllDocRequeridaComprasVentas = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/doc-requerida-compras-ventas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva documentación requerida para compras y ventas
 * @param {Object} docRequeridaComprasVentasData - Datos de la documentación requerida para compras y ventas
 * @returns {Promise} Documentación requerida para compras y ventas creada
 */
export const crearDocRequeridaComprasVentas = async (docRequeridaComprasVentasData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/doc-requerida-compras-ventas`, docRequeridaComprasVentasData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una documentación requerida para compras y ventas existente
 * @param {number} id - ID de la documentación requerida para compras y ventas
 * @param {Object} docRequeridaComprasVentasData - Datos actualizados
 * @returns {Promise} Documentación requerida para compras y ventas actualizada
 */
export const actualizarDocRequeridaComprasVentas = async (id, docRequeridaComprasVentasData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/doc-requerida-compras-ventas/${id}`, docRequeridaComprasVentasData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una documentación requerida para compras y ventas
 * @param {number} id - ID de la documentación requerida para compras y ventas a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDocRequeridaComprasVentas = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/doc-requerida-compras-ventas/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDocRequeridaComprasVentas = crearDocRequeridaComprasVentas;
export const updateDocRequeridaComprasVentas = actualizarDocRequeridaComprasVentas;
export const eliminarDocRequeridaComprasVentas = deleteDocRequeridaComprasVentas;
