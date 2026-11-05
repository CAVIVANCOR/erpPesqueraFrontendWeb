// src/api/recursosHumanos/conceptoPlanilla.js
// Funciones de integración API REST para Conceptos de Planilla y sus cuentas contables (RRHH Fase 1)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/conceptos-planilla`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getConceptosPlanilla(filtros = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params: filtros });
  return res.data;
}

export async function getConceptoPlanillaById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createConceptoPlanilla(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateConceptoPlanilla(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteConceptoPlanilla(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
