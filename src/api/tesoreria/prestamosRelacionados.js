// src/api/tesoreria/prestamosRelacionados.js
// Préstamos entre empresas relacionadas (Tesorería)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/prestamos-relacionados`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPrestamosRelacionados() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrestamoRelacionadoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPrestamoRelacionado(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePrestamoRelacionado(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePrestamoRelacionado(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/** Asientos de apertura (saldo inicial) del préstamo */
export async function getAsientosAperturaPrestamoRelacionado(id) {
  const res = await axios.get(`${API_URL}/${id}/asientos`, { headers: getAuthHeaders() });
  return res.data;
}

/** Genera los asientos de apertura del préstamo (uno por empresa) */
export async function generarAsientoAperturaPrestamoRelacionado(id) {
  const res = await axios.post(`${API_URL}/${id}/asientos`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/** Elimina los asientos de apertura pendientes del préstamo */
export async function eliminarAsientosAperturaPrestamoRelacionado(id) {
  const res = await axios.delete(`${API_URL}/${id}/asientos`, { headers: getAuthHeaders() });
  return res.data;
}

/** Préstamos vigentes con saldo entre dos empresas (para elegir en una devolución) */
export async function listarPrestamosRelacionadosVigentes(params) {
  const res = await axios.get(`${API_URL}/vigentes`, { headers: getAuthHeaders(), params });
  return res.data.data;
}
