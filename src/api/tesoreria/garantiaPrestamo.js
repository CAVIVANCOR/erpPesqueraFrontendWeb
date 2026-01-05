/**
 * API para garantías de préstamos bancarios
 */

import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/garantias-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Listar todas las garantías
 */
export async function getAllGarantiaPrestamo() {
  const res = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar garantías activas
 */
export async function getGarantiasActivas() {
  const res = await axios.get(`${API_URL}/activas`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar garantías de un préstamo
 */
export async function getGarantiasPorPrestamo(prestamoBancarioId) {
  const res = await axios.get(`${API_URL}/prestamo/${prestamoBancarioId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener una garantía por ID
 */
export async function getGarantiaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear una nueva garantía
 */
export async function createGarantiaPrestamo(data) {
  const res = await axios.post(API_URL, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar una garantía
 */
export async function updateGarantiaPrestamo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar una garantía
 */
export async function deleteGarantiaPrestamo(id) {
  await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Liberar una garantía
 */
export async function liberarGarantia(id, fechaLiberacion = null) {
  const res = await axios.post(`${API_URL}/${id}/liberar`, 
    { fechaLiberacion }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Reactivar una garantía
 */
export async function reactivarGarantia(id) {
  const res = await axios.post(`${API_URL}/${id}/reactivar`, 
    {}, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}
