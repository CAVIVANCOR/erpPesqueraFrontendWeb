// src/api/tesoreria/tipoDeudaTributaria.js
// Funciones de integración API REST para Tipo Deuda Tributaria

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-deuda-tributaria`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getTiposDeudaTributaria() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTiposDeudaTributariaActivos() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoDeudaTributariaById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createTipoDeudaTributaria(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateTipoDeudaTributaria(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteTipoDeudaTributaria(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}