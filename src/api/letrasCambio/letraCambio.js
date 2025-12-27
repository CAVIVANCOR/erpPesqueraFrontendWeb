// src/api/letrasCambio/letraCambio.js
// Funciones de integración API REST para Letras de Cambio. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/letras-cambio`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getLetraCambio() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLetraCambioById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createLetraCambio(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateLetraCambio(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteLetraCambio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLetrasCambioByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLetrasCambioByTipo(empresaId, tipoLetra) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/tipo/${tipoLetra}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getLetrasCambioVencidas(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/vencidas`, { headers: getAuthHeaders() });
  return res.data;
}

export async function marcarProtestada(id, fechaProtesto, motivoProtesto) {
  const res = await axios.post(`${API_URL}/${id}/marcar-protestada`, { fechaProtesto, motivoProtesto }, { headers: getAuthHeaders() });
  return res.data;
}

export async function marcarRenovada(id, nuevaLetraId) {
  const res = await axios.post(`${API_URL}/${id}/marcar-renovada`, { nuevaLetraId }, { headers: getAuthHeaders() });
  return res.data;
}