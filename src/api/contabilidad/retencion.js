// src/api/contabilidad/retencion.js
// Funciones de integración API REST para Retención. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contabilidad/retencion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getRetenciones() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getRetencionById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createRetencion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateRetencion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteRetencion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getRetencionesPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}