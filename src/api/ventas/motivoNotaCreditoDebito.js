// src/api/ventas/motivoNotaCreditoDebito.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/motivos-nc-nd`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getMotivoNotaCreditoDebito() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllMotivoNotaCreditoDebito() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMotivoNotaCreditoDebitoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createMotivoNotaCreditoDebito(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateMotivoNotaCreditoDebito(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteMotivoNotaCreditoDebito(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMotivoNotaCreditoDebitoActivos() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMotivoNotasCredito() {
  const res = await axios.get(`${API_URL}/notas-credito`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMotivoNotasDebito() {
  const res = await axios.get(`${API_URL}/notas-debito`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMotivoNotaCreditoDebitoEstadisticas() {
  const res = await axios.get(`${API_URL}/estadisticas`, { headers: getAuthHeaders() });
  return res.data;
}