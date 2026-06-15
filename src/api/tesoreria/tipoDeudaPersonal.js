// src/api/tesoreria/tipoDeudaPersonal.js
// Funciones de integración API REST para Tipo Deuda Personal

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-deuda-personal`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getTiposDeudaPersonal() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTiposDeudaPersonalActivos() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoDeudaPersonalById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createTipoDeudaPersonal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateTipoDeudaPersonal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteTipoDeudaPersonal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}