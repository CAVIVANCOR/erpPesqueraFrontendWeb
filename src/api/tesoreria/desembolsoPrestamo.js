/**
 * API para desembolsos de préstamos bancarios
 */

import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/desembolsos-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Listar todos los desembolsos
 */
export async function getAllDesembolsoPrestamo() {
  const res = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar desembolsos de un préstamo
 */
export async function getDesembolsosPorPrestamo(prestamoBancarioId) {
  const res = await axios.get(`${API_URL}/prestamo/${prestamoBancarioId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener total desembolsado de un préstamo
 */
export async function getTotalDesembolsado(prestamoBancarioId) {
  const res = await axios.get(`${API_URL}/prestamo/${prestamoBancarioId}/total`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener un desembolso por ID
 */
export async function getDesembolsoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear un nuevo desembolso
 */
export async function createDesembolsoPrestamo(data) {
  const res = await axios.post(API_URL, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar un desembolso
 */
export async function updateDesembolsoPrestamo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar un desembolso
 */
export async function deleteDesembolsoPrestamo(id) {
  await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
}
