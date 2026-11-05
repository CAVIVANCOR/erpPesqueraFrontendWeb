// src/api/recursosHumanos/parametroLegal.js
// Funciones de integración API REST para Parámetros Legales con vigencia (RRHH Fase 1)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/parametros-legales`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getParametrosLegales(filtros = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params: filtros });
  return res.data;
}

/** Valores ACTIVOS vigentes a una fecha (opcionalmente para un régimen). */
export async function getParametrosLegalesVigentes(params = {}) {
  const res = await axios.get(`${API_URL}/vigentes`, { headers: getAuthHeaders(), params });
  return res.data;
}

export async function getParametroLegalById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createParametroLegal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateParametroLegal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteParametroLegal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
