// src/api/cuentasPorCobrarPagar/pago.js
// Funciones de integración API REST para Pagos. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cuentas-por-cobrar-pagar/pago`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

// ============================================
// FUNCIONES GENÉRICAS (CONSULTA CONSOLIDADA)
// ============================================

export async function getPago() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagoById(id, tipoPago) {
  const res = await axios.get(`${API_URL}/${id}?tipoPago=${tipoPago}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPagosByMovimiento(movimientoCajaId) {
  const res = await axios.get(`${API_URL}/por-movimiento/${movimientoCajaId}`, { headers: getAuthHeaders() });
  return res.data;
}

// ============================================
// FUNCIONES ESPECÍFICAS - CUENTA POR COBRAR
// ============================================

export async function getPagosByCuentaPorCobrar(cuentaPorCobrarId) {
  const res = await axios.get(`${API_URL}/cuenta-cobrar/${cuentaPorCobrarId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPagoCuentaPorCobrar(data) {
  const res = await axios.post(`${API_URL}/cuenta-por-cobrar`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePagoCuentaPorCobrar(id, data) {
  const res = await axios.put(`${API_URL}/cuenta-por-cobrar/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePagoCuentaPorCobrar(id) {
  const res = await axios.delete(`${API_URL}/cuenta-por-cobrar/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

// ============================================
// FUNCIONES ESPECÍFICAS - CUENTA POR PAGAR
// ============================================

export async function getPagosByCuentaPorPagar(cuentaPorPagarId) {
  const res = await axios.get(`${API_URL}/cuenta-pagar/${cuentaPorPagarId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPagoCuentaPorPagar(data) {
  const res = await axios.post(`${API_URL}/cuenta-por-pagar`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePagoCuentaPorPagar(id, data) {
  const res = await axios.put(`${API_URL}/cuenta-por-pagar/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePagoCuentaPorPagar(id) {
  const res = await axios.delete(`${API_URL}/cuenta-por-pagar/${id}`, { headers: getAuthHeaders() });
  return res.data;
}