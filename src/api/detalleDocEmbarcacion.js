// src/api/detalleDocEmbarcacion.js
// Funciones de integración API REST para DetalleDocEmbarcacion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/detalles-doc-embarcacion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export async function getDetallesDocEmbarcacion() {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  return res.data;
}

export async function getDetalleDocEmbarcacionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
}

export async function crearDetalleDocEmbarcacion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
}

export async function actualizarDetalleDocEmbarcacion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
}

export async function eliminarDetalleDocEmbarcacion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
}
