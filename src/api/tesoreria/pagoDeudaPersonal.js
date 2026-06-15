// src/api/tesoreria/pagoDeudaPersonal.js
// Funciones de integración API REST para Pago Deuda Personal

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/pagos-deuda-personal`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPagosDeudaPersonal() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagoDeudaPersonalById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPagoDeudaPersonal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePagoDeudaPersonal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePagoDeudaPersonal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosDeudaPersonalByDeuda(deudaId) {
  const res = await axios.get(`${API_URL}/deuda/${deudaId}`, { headers: getAuthHeaders() });
  return res.data;
}