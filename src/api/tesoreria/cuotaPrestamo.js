// src/api/tesoreria/cuotaPrestamo.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/cuotas-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getCuotaPrestamo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuotaPrestamoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createCuotaPrestamo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateCuotaPrestamo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteCuotaPrestamo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuotasPendientes() {
  const res = await axios.get(`${API_URL}/pendientes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuotasVencidas() {
  const res = await axios.get(`${API_URL}/vencidas`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuotasPorPrestamo(prestamoBancarioId) {
  const res = await axios.get(`${API_URL}/prestamo/${prestamoBancarioId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function registrarPagoCuota(id, data) {
  const res = await axios.post(`${API_URL}/${id}/pagar`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarEstadosVencidos() {
  const res = await axios.post(`${API_URL}/actualizar-vencidos`, {}, { headers: getAuthHeaders() });
  return res.data;
}