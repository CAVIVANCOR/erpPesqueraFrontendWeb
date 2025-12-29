// src/api/tesoreria/inversionFinanciera.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/inversiones-financieras`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getInversionFinanciera() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getInversionFinancieraById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createInversionFinanciera(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateInversionFinanciera(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteInversionFinanciera(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getInversionFinancieraVigentes() {
  const res = await axios.get(`${API_URL}/vigentes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getInversionFinancieraPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getInversionFinancieraPorTipo(tipo) {
  const res = await axios.get(`${API_URL}/tipo/${tipo}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMovimientosInversion(id) {
  const res = await axios.get(`${API_URL}/${id}/movimientos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function registrarMovimientoInversion(id, data) {
  const res = await axios.post(`${API_URL}/${id}/movimiento`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function liquidarInversion(id, data) {
  const res = await axios.post(`${API_URL}/${id}/liquidar`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function getResumenRendimientos(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/resumen`, { headers: getAuthHeaders() });
  return res.data;
}