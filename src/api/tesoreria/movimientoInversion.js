/**
 * API para movimientos de inversiones financieras
 */

import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/movimientos-inversion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Listar todos los movimientos
 */
export async function getAllMovimientoInversion() {
  const res = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar movimientos de una inversión
 */
export async function getMovimientosPorInversion(inversionFinancieraId) {
  const res = await axios.get(`${API_URL}/inversion/${inversionFinancieraId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener resumen de movimientos de una inversión
 */
export async function getResumenMovimientos(inversionFinancieraId) {
  const res = await axios.get(`${API_URL}/inversion/${inversionFinancieraId}/resumen`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar movimientos por tipo
 */
export async function getMovimientosPorTipo(tipoMovimiento) {
  const res = await axios.get(`${API_URL}/tipo/${tipoMovimiento}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener un movimiento por ID
 */
export async function getMovimientoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear un nuevo movimiento
 */
export async function createMovimientoInversion(data) {
  const res = await axios.post(API_URL, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar un movimiento
 */
export async function updateMovimientoInversion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar un movimiento
 */
export async function deleteMovimientoInversion(id) {
  await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
}
