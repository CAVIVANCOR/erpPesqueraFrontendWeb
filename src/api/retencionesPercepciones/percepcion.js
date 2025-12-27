// src/api/retencionesPercepciones/percepcion.js
// Funciones de integración API REST para Percepciones. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/retenciones-percepciones/percepcion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPercepcion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPercepcionById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPercepcion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePercepcion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePercepcion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPercepcionesByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPercepcionesByCliente(clienteId) {
  const res = await axios.get(`${API_URL}/cliente/${clienteId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPercepcionesByPeriodo(empresaId, fechaInicio, fechaFin) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/periodo`, {
    params: { fechaInicio, fechaFin },
    headers: getAuthHeaders()
  });
  return res.data;
}