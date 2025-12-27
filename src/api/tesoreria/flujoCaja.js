// src/api/tesoreria/flujoCaja.js
// Funciones de integración API REST para Flujo de Caja. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/flujo-caja`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getFlujoCaja() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getFlujoCajaById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createFlujoCaja(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateFlujoCaja(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteFlujoCaja(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getFlujoCajaByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getFlujoCajaByPeriodo(empresaId, fechaInicio, fechaFin) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/periodo`, {
    params: { fechaInicio, fechaFin },
    headers: getAuthHeaders()
  });
  return res.data;
}

export async function getResumenFlujoCaja(empresaId, fechaInicio, fechaFin) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/resumen`, {
    params: { fechaInicio, fechaFin },
    headers: getAuthHeaders()
  });
  return res.data;
}