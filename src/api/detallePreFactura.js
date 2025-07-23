import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Pre Factura
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de pre facturas
 */

/**
 * Obtiene todos los detalles de pre facturas
 * @returns {Promise} Lista de detalles de pre facturas
 */
export const getAllDetallePreFactura = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/detalle-pre-factura`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de pre factura
 * @param {Object} detallePreFacturaData - Datos del detalle de pre factura
 * @returns {Promise} Detalle de pre factura creado
 */
export const crearDetallePreFactura = async (detallePreFacturaData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/detalle-pre-factura`, detallePreFacturaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de pre factura existente
 * @param {number} id - ID del detalle de pre factura
 * @param {Object} detallePreFacturaData - Datos actualizados
 * @returns {Promise} Detalle de pre factura actualizado
 */
export const actualizarDetallePreFactura = async (id, detallePreFacturaData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/detalle-pre-factura/${id}`, detallePreFacturaData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de pre factura
 * @param {number} id - ID del detalle de pre factura a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetallePreFactura = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/detalle-pre-factura/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetallePreFactura = crearDetallePreFactura;
export const updateDetallePreFactura = actualizarDetallePreFactura;
export const eliminarDetallePreFactura = deleteDetallePreFactura;
