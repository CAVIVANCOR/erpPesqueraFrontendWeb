// c:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\api\entregaARendirOTMantenimiento.api.js

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Entrega a Rendir OT Mantenimiento
 * Proporciona funciones para operaciones CRUD en el módulo de entregas a rendir de OT mantenimiento
 */

/**
 * Obtiene todas las entregas a rendir de OT mantenimiento
 * @returns {Promise} Lista de entregas a rendir de OT mantenimiento
 */
export const obtenerEntregasRendirOTMantenimiento = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-ot-mantenimiento`, {
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
export const obtenerEntregaRendirOTMantenimientoPorId = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-ot-mantenimiento/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene una entrega a rendir por ID de OT mantenimiento
 * @param {number} otMantenimientoId - ID de la OT de mantenimiento
 * @returns {Promise} Entrega a rendir
 */
export const obtenerEntregaRendirPorOTMantenimiento = async (otMantenimientoId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-ot-mantenimiento/ot/${otMantenimientoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva entrega a rendir de OT mantenimiento
 * @param {Object} data - Datos de la entrega a rendir
 * @returns {Promise} Entrega a rendir creada
 */
export const crearEntregaRendirOTMantenimiento = async (data) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/entregas-rendir-ot-mantenimiento`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una entrega a rendir de OT mantenimiento existente
 * @param {number} id - ID de la entrega a rendir
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Entrega a rendir actualizada
 */
export const actualizarEntregaRendirOTMantenimiento = async (id, data) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/entregas-rendir-ot-mantenimiento/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una entrega a rendir de OT mantenimiento
 * @param {number} id - ID de la entrega a rendir a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const eliminarEntregaRendirOTMantenimiento = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/entregas-rendir-ot-mantenimiento/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases para compatibilidad
export const getAllEntregaARendirOTMantenimiento = obtenerEntregasRendirOTMantenimiento;
export const getEntregaARendirOTMantenimientoById = obtenerEntregaRendirOTMantenimientoPorId;
export const getEntregaARendirPorOT = obtenerEntregaRendirPorOTMantenimiento;
export const createEntregaARendirOTMantenimiento = crearEntregaRendirOTMantenimiento;
export const updateEntregaARendirOTMantenimiento = actualizarEntregaRendirOTMantenimiento;
export const deleteEntregaARendirOTMantenimiento = eliminarEntregaRendirOTMantenimiento;