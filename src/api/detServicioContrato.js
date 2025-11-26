// src/api/detServicioContrato.js
// Funciones de integración API REST para DetServicioContrato. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/detalles-servicio-contrato`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDetallesServicioContrato() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllDetServicioContrato() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDetServicioContratoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDetallesPorContrato(contratoServicioId) {
  const res = await axios.get(`${API_URL}/contrato/${contratoServicioId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function calcularTotalContrato(contratoServicioId) {
  const res = await axios.get(`${API_URL}/contrato/${contratoServicioId}/total`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearDetServicioContrato(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarDetServicioContrato(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarDetServicioContrato(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteDetServicioContrato(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
