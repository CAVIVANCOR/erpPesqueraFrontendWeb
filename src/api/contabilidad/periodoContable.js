import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contabilidad/periodo-contable`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPeriodosContables() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPeriodoContableById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPeriodoContable(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePeriodoContable(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePeriodoContable(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPeriodosPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function cerrarPeriodo(id, data) {
  const res = await axios.post(`${API_URL}/${id}/cerrar`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function reabrirPeriodo(id, data) {
  const res = await axios.post(`${API_URL}/${id}/reabrir`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function bloquearPeriodo(id, data) {
  const res = await axios.post(`${API_URL}/${id}/bloquear`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerPeriodoActivo(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/activo`, { headers: getAuthHeaders() });
  return res.data;
}