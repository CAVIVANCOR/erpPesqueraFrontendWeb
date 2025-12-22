// src/api/videoconferencia.js
// Funciones de integración API REST para Videoconferencia. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/videoconferencias`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getVideoconferencias() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getVideoconferenciaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearVideoconferencia(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarVideoconferencia(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarVideoconferencia(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Inicia una videoconferencia (PROGRAMADA → EN_CURSO)
 */
export async function iniciarVideoconferencia(id) {
  const res = await axios.post(`${API_URL}/${id}/iniciar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Finaliza una videoconferencia (EN_CURSO → FINALIZADA)
 */
export async function finalizarVideoconferencia(id) {
  const res = await axios.post(`${API_URL}/${id}/finalizar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Cancela una videoconferencia
 */
export async function cancelarVideoconferencia(id) {
  const res = await axios.post(`${API_URL}/${id}/cancelar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene videoconferencias por organizador
 */
export async function getVideoconferenciasPorOrganizador(organizadorId) {
  const res = await axios.get(`${API_URL}/organizador/${organizadorId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene videoconferencias por estado
 */
export async function getVideoconferenciasPorEstado(estado) {
  const res = await axios.get(`${API_URL}/estado/${estado}`, { headers: getAuthHeaders() });
  return res.data;
}
