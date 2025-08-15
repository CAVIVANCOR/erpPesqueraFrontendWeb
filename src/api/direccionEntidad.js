// src/api/direccionEntidad.js
// Funciones de integración API REST para DireccionEntidad. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/direcciones-entidad`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDireccionesEntidad() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerDireccionesPorEntidad(entidadComercialId) {
  const res = await axios.get(`${API_URL}/entidad/${entidadComercialId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerDireccionFiscalPorEntidad(entidadComercialId) {
  const res = await axios.get(`${API_URL}/fiscal/${entidadComercialId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDireccionEntidadPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearDireccionEntidad(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarDireccionEntidad(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarDireccionEntidad(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
