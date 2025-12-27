// src/api/cuentasPorCobrarPagar/cuentaPorPagar.js
// Funciones de integración API REST para Cuenta Por Pagar. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cuentas-por-cobrar-pagar/cuenta-por-pagar`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getCuentaPorPagar() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentaPorPagarById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createCuentaPorPagar(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateCuentaPorPagar(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteCuentaPorPagar(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentasPorPagarByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentasPorPagarPendientes(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/pendientes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentasPorPagarVencidas(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/vencidas`, { headers: getAuthHeaders() });
  return res.data;
}