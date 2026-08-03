// src/api/contabilidad/detraccion.js
// Funciones de integración API REST para Detracción. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contabilidad/detraccion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDetracciones() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDetraccionById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createDetraccion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateDetraccion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteDetraccion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDetraccionesPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}