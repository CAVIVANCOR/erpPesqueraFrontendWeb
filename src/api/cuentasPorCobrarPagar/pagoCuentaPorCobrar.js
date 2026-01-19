// src/api/cuentasPorCobrarPagar/pagoCuentaPorCobrar.js
// Funciones de integración API REST para Pago Cuenta Por Cobrar. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cuentas-por-cobrar-pagar/pago`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPagosCuentaPorCobrar() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagoCuentaPorCobrarById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPagoCuentaPorCobrar(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePagoCuentaPorCobrar(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePagoCuentaPorCobrar(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosPorCuentaCobrar(cuentaPorCobrarId) {
  const res = await axios.get(`${API_URL}/cuenta-cobrar/${cuentaPorCobrarId}`, { headers: getAuthHeaders() });
  return res.data;
}
