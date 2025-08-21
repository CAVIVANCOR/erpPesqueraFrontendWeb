// src/api/estadoMultiFuncion.js
// Funciones de integración API REST para EstadoMultiFuncion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/estados-multi-funcion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getEstadosMultiFuncion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getEstadoMultiFuncionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getEstadosMultiFuncionPorTipoProvieneDe(tipoProvieneDeId) {
  const res = await axios.get(`${API_URL}?tipoProvieneDeId=${tipoProvieneDeId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para productos
 * Filtra por TipoProvieneDe con descripción "PRODUCTOS"
 */
export async function getEstadosMultiFuncionParaProductos() {
  const res = await axios.get(`${API_URL}/productos`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para embarcaciones
 * Filtra por TipoProvieneDe con descripción "EMBARCACIONES"
 */
export async function getEstadosMultiFuncionParaEmbarcaciones() {
  const res = await axios.get(`${API_URL}/embarcaciones`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearEstadoMultiFuncion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarEstadoMultiFuncion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarEstadoMultiFuncion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
