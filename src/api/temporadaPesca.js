// src/api/temporadaPesca.js
// Funciones de integración API REST para TemporadaPesca. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/temporadas-pesca`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getTemporadasPesca() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTemporadaPescaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearTemporadaPesca(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarTemporadaPesca(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarTemporadaPesca(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function subirDocumentoTemporada(file) {
  const formData = new FormData();
  formData.append('resolucionPdf', file);
  const API_RESOLUCION = `${import.meta.env.VITE_API_URL}/temporada-pesca-resolucion/upload`;
  const res = await axios.post(API_RESOLUCION, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function iniciarTemporada(temporadaId) {
  const res = await axios.post(`${API_URL}/${temporadaId}/iniciar`, {}, { headers: getAuthHeaders() });
  return res.data;
}