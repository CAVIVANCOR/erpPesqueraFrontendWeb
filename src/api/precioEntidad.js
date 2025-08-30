// src/api/precioEntidad.js
// Funciones de integración API REST para PrecioEntidad. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/precios-entidad`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPreciosEntidad() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerPreciosPorEntidad(entidadComercialId) {
  const res = await axios.get(`${API_URL}/entidad/${entidadComercialId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrecioEntidadPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearPrecioEntidad(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarPrecioEntidad(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarPrecioEntidad(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
