// src/api/grabacionReunion.js
// Funciones de integración API REST para GrabacionReunion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/grabaciones-reunion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getGrabacionesPorVideoconferencia(videoconferenciaId) {
  const res = await axios.get(`${API_URL}/videoconferencia/${videoconferenciaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getGrabacionReunionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearGrabacionReunion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarGrabacionReunion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarGrabacionReunion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
