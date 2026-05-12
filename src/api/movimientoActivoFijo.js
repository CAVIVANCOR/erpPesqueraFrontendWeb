// src/api/movimientoActivoFijo.js
// Funciones de integración API REST para MovimientoActivoFijo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/movimientos-activo-fijo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getMovimientosActivoFijo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMovimientoActivoFijoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMovimientosActivoFijoPorActivo(activoId) {
  const res = await axios.get(`${API_URL}/activo/${activoId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearMovimientoActivoFijo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarMovimientoActivoFijo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarMovimientoActivoFijo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function generarBorradorAsiento(movimientoId) {
  const res = await axios.post(
    `${API_URL}/${movimientoId}/generar-borrador-asiento`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function guardarAsientoContable(movimientoId, asientoData, usuarioId) {
  const res = await axios.post(
    `${API_URL}/${movimientoId}/guardar-asiento`,
    { asientoData },
    { headers: getAuthHeaders() }
  );
  return res.data;
}