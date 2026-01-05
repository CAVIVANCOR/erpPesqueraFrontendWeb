/**
 * API para cuotas de préstamos bancarios
 */

import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/cuotas-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Listar todas las cuotas
 */
export async function getAllCuotaPrestamo() {
  const res = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar cuotas pendientes
 */
export async function getCuotasPendientes() {
  const res = await axios.get(`${API_URL}/pendientes`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar cuotas vencidas
 */
export async function getCuotasVencidas() {
  const res = await axios.get(`${API_URL}/vencidas`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Listar cuotas de un préstamo
 */
export async function getCuotasPorPrestamo(prestamoBancarioId) {
  const res = await axios.get(`${API_URL}/prestamo/${prestamoBancarioId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener una cuota por ID
 */
export async function getCuotaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear una nueva cuota
 */
export async function createCuotaPrestamo(data) {
  const res = await axios.post(API_URL, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar una cuota
 */
export async function updateCuotaPrestamo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar una cuota
 */
export async function deleteCuotaPrestamo(id) {
  await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Registrar pago de una cuota
 */
export async function registrarPagoCuota(id, data) {
  const res = await axios.post(`${API_URL}/${id}/pagar`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar estados de cuotas vencidas
 */
export async function actualizarCuotasVencidas() {
  const res = await axios.post(`${API_URL}/actualizar-vencidos`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
}