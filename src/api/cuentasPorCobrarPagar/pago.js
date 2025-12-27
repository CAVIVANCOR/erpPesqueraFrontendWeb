// src/api/cuentasPorCobrarPagar/pago.js
// Funciones de integración API REST para Pagos. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cuentas-por-cobrar-pagar/pago`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPago() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPago(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePago(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePago(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosByCuentaPorCobrar(cuentaPorCobrarId) {
  const res = await axios.get(`${API_URL}/cuenta-por-cobrar/${cuentaPorCobrarId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosByCuentaPorPagar(cuentaPorPagarId) {
  const res = await axios.get(`${API_URL}/cuenta-por-pagar/${cuentaPorPagarId}`, { headers: getAuthHeaders() });
  return res.data;
}