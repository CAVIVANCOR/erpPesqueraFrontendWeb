// src/api/detAccionesPreviasFaenaConsumo.js
// Funciones de integración API REST para DetAccionesPreviasFaenaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/det-acciones-previas-faena-consumo`;
/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDetAccionesPreviasFaenaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDetAccionesPreviasFaenaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearDetAccionesPreviasFaenaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarDetAccionesPreviasFaenaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarDetAccionesPreviasFaenaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function subirConfirmaAccionConsumo(file) {
  const formData = new FormData();
  formData.append('confirmaAccion', file);
  const API_CONFIRMA = `${import.meta.env.VITE_API_URL}/det-accion-previas-faena-consumo/upload`;
  const res = await axios.post(API_CONFIRMA, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
