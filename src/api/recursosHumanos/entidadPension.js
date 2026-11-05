// src/api/recursosHumanos/entidadPension.js
// Funciones de integración API REST para Entidad de Pensión (AFP/ONP) y sus tarifas (RRHH Fase 1)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/entidades-pension`;
const API_TARIFAS_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/tarifas-entidad-pension`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getEntidadesPension() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getEntidadesPensionActivas() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getEntidadPensionById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createEntidadPension(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateEntidadPension(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteEntidadPension(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

// ── Tarifas con vigencia ──────────────────────────────────────

export async function getTarifasEntidadPension(entidadPensionId) {
  const res = await axios.get(API_TARIFAS_URL, {
    headers: getAuthHeaders(),
    params: entidadPensionId ? { entidadPensionId } : {},
  });
  return res.data;
}

export async function createTarifaEntidadPension(data) {
  const res = await axios.post(API_TARIFAS_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateTarifaEntidadPension(id, data) {
  const res = await axios.put(`${API_TARIFAS_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteTarifaEntidadPension(id) {
  const res = await axios.delete(`${API_TARIFAS_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
