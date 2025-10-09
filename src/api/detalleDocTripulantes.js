// src/api/detalleDocTripulantes.js
// Funciones de integración API REST para DetalleDocTripulantes. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/detalles-doc-tripulantes`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDetallesDocTripulantes(params = {}) {
  const res = await axios.get(API_URL, { 
    headers: getAuthHeader(),
    params: params  // Permite filtrar por faenaPescaId u otros parámetros
  });
  return res.data;
}

export async function getDetalleDocTripulantesPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
}

export async function crearDetalleDocTripulantes(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
}

export async function actualizarDetalleDocTripulantes(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
}

export async function eliminarDetalleDocTripulantes(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
}