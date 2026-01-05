// src/api/tesoreria/lineaCredito.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/api/lineas-credito`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getAllLineaCredito() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLineaCreditoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createLineaCredito(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateLineaCredito(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteLineaCredito(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLineaCreditoVigentes() {
  const res = await axios.get(`${API_URL}/vigentes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLineaCreditoPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrestamosPorLinea(lineaCreditoId) {
  const res = await axios.get(`${API_URL}/${lineaCreditoId}/prestamos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getReporteLineasDisponibles(empresaId) {
  const res = await axios.get(`${API_URL}/reporte/lineas-disponibles/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}