// src/api/cuentasPorCobrarPagar/cuentaPorCobrar.js
// Funciones de integración API REST para Cuenta Por Cobrar. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cuentas-por-cobrar-pagar/cuenta-por-cobrar`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getCuentaPorCobrar() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentaPorCobrarById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createCuentaPorCobrar(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateCuentaPorCobrar(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteCuentaPorCobrar(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentasPorCobrarByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentasPorCobrarPendientes(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/pendientes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCuentasPorCobrarVencidas(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/vencidas`, { headers: getAuthHeaders() });
  return res.data;
}