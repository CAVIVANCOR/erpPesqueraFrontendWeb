// src/api/contabilidad/asientoContable.js
// Funciones de integración API REST para Asiento Contable. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contabilidad/asiento-contable`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getAsientoContable() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAsientoContableById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createAsientoContable(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateAsientoContable(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteAsientoContable(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function aprobarAsiento(id, aprobadoPorId) {
  const res = await axios.post(`${API_URL}/${id}/aprobar`, { aprobadoPorId }, { headers: getAuthHeaders() });
  return res.data;
}

export async function anularAsiento(id) {
  const res = await axios.post(`${API_URL}/${id}/anular`, {}, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAsientosByPeriodo(periodoId) {
  const res = await axios.get(`${API_URL}/periodo/${periodoId}`, { headers: getAuthHeaders() });
  return res.data;
}