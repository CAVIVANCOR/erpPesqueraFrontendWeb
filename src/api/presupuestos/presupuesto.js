// src/api/presupuestos/presupuesto.js
// Funciones de integración API REST para Presupuestos. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/presupuestos`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPresupuesto() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPresupuestoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPresupuesto(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePresupuesto(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePresupuesto(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPresupuestosByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPresupuestosByCentroCosto(centroCostoId) {
  const res = await axios.get(`${API_URL}/centro-costo/${centroCostoId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function aprobarPresupuesto(id, aprobadoPorId) {
  const res = await axios.post(`${API_URL}/${id}/aprobar`, { aprobadoPorId }, { headers: getAuthHeaders() });
  return res.data;
}