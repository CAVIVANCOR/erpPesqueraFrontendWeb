// src/api/cuentasPorCobrarPagar/pagoCuentaPorPagar.js
// Funciones de integración API REST para Pago Cuenta Por Pagar. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cuentas-por-cobrar-pagar/pago`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPagosCuentaPorPagar() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagoCuentaPorPagarById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPagoCuentaPorPagar(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePagoCuentaPorPagar(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePagoCuentaPorPagar(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosPorCuentaPagar(cuentaPorPagarId) {
  const res = await axios.get(`${API_URL}/cuenta-pagar/${cuentaPorPagarId}`, { headers: getAuthHeaders() });
  return res.data;
}
