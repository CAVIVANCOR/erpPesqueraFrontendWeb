// c:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\api\detMovsEntregaRendirOTMantenimiento.api.js

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Movimientos Entrega Rendir OT Mantenimiento
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de movimientos de entregas a rendir de OT mantenimiento
 */

/**
 * Obtiene todos los detalles de movimientos de entregas a rendir de OT mantenimiento
 * @returns {Promise} Lista de detalles de movimientos
 */
export const obtenerDetMovsEntregaRendirOTMantenimiento = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-ot-mantenimiento`, {
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
export const obtenerDetMovEntregaRendirOTMantenimientoPorId = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-ot-mantenimiento/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene movimientos por ID de entrega
 * @param {number} entregaARendirOTMantenimientoId - ID de la entrega a rendir
 * @returns {Promise} Lista de movimientos
 */
export const obtenerDetMovsPorEntregaOTMantenimiento = async (entregaARendirOTMantenimientoId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-ot-mantenimiento/entrega/${entregaARendirOTMantenimientoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de movimiento de entrega a rendir de OT mantenimiento
 * @param {Object} data - Datos del detalle de movimiento
 * @returns {Promise} Detalle de movimiento creado
 */
export const crearDetMovEntregaRendirOTMantenimiento = async (data) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-movs-entrega-rendir-ot-mantenimiento`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de movimiento de entrega a rendir de OT mantenimiento existente
 * @param {number} id - ID del detalle de movimiento
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Detalle de movimiento actualizado
 */
export const actualizarDetMovEntregaRendirOTMantenimiento = async (id, data) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-movs-entrega-rendir-ot-mantenimiento/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de movimiento de entrega a rendir de OT mantenimiento
 * @param {number} id - ID del detalle de movimiento a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const eliminarDetMovEntregaRendirOTMantenimiento = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-movs-entrega-rendir-ot-mantenimiento/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Sube PDF de comprobante de movimiento
 * @param {FormData} formData - Datos del formulario con el archivo
 * @returns {Promise} Respuesta de la subida
 */
export const subirPdfComprobanteMovimientoOTMantenimiento = async (formData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(
    `${API_URL}/det-movs-entrega-rendir-ot-mantenimiento-pdf/upload-pdf-comprobante`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Sube PDF de comprobante de operación
 * @param {FormData} formData - Datos del formulario con el archivo
 * @returns {Promise} Respuesta de la subida
 */
export const subirPdfComprobanteOperacionOTMantenimiento = async (formData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(
    `${API_URL}/det-movs-entrega-rendir-ot-mantenimiento-pdf/upload-pdf-operacion`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Aliases para compatibilidad
export const getAllDetMovsEntregaRendirOTMantenimiento = obtenerDetMovsEntregaRendirOTMantenimiento;
export const getDetMovsEntregaRendirOTMantenimientoById = obtenerDetMovEntregaRendirOTMantenimientoPorId;
export const getDetMovsPorEntrega = obtenerDetMovsPorEntregaOTMantenimiento;
export const createDetMovsEntregaRendirOTMantenimiento = crearDetMovEntregaRendirOTMantenimiento;
export const updateDetMovsEntregaRendirOTMantenimiento = actualizarDetMovEntregaRendirOTMantenimiento;
export const deleteDetMovsEntregaRendirOTMantenimiento = eliminarDetMovEntregaRendirOTMantenimiento;