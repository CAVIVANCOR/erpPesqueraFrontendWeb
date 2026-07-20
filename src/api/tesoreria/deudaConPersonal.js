// src/api/tesoreria/deudaConPersonal.js
// Funciones de integración API REST para Deuda Con Personal

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/deudas-con-personal`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDeudasConPersonal() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudaConPersonalById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createDeudaConPersonal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateDeudaConPersonal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteDeudaConPersonal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasConPersonalByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasConPersonalPendientes(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/pendientes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasConPersonalVencidas(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/vencidas`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasConPersonalByPersonal(personalId) {
  const res = await axios.get(`${API_URL}/personal/${personalId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasConPersonalByTipo(tipoDeudaId) {
  const res = await axios.get(`${API_URL}/tipo/${tipoDeudaId}`, { headers: getAuthHeaders() });
  return res.data;
}


// ════════════════════════════════════════════════════════════
// ASIENTOS CONTABLES
// ════════════════════════════════════════════════════════════

export async function generarBorradorAsiento(deudaId) {
  const res = await axios.get(`${API_URL}/${deudaId}/borrador-asiento`, { headers: getAuthHeaders() });
  return res.data;
}

export async function guardarAsientoContable(deudaId, borrador, usuarioId) {
  const res = await axios.post(`${API_URL}/${deudaId}/guardar-asiento`, { asientos: borrador.asientos }, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarAsientoContable(deudaId, asientoId) {
  const res = await axios.delete(`${API_URL}/${deudaId}/asiento/${asientoId}`, { headers: getAuthHeaders() });
  return res.data;
}
