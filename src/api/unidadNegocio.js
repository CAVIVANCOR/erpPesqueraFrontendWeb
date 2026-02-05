// src/api/unidadNegocio.js
// Funciones de integración API REST para UnidadNegocio. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL + "/unidades-negocio";

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getUnidadesNegocio(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.activo !== undefined) {
    params.append('activo', filtros.activo);
  }
  const res = await axios.get(`${API_URL}?${params.toString()}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getUnidadNegocioPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearUnidadNegocio(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarUnidadNegocio(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarUnidadNegocio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}