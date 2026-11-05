// src/api/recursosHumanos/contratoPersonal.js
// Funciones de integración API REST para Contratos de Personal y sus líneas de pago (RRHH Fase 1)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/contratos-personal`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getContratosPersonal(filtros = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params: filtros });
  return res.data;
}

export async function getContratoPersonalById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createContratoPersonal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateContratoPersonal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteContratoPersonal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
