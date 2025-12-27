// src/api/tesoreria/conciliacionBancaria.js
// Funciones de integración API REST para Conciliación Bancaria. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/conciliacion-bancaria`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getConciliacionBancaria() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getConciliacionBancariaById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createConciliacionBancaria(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateConciliacionBancaria(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteConciliacionBancaria(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function marcarConciliado(id, conciliadoPorId) {
  const res = await axios.post(`${API_URL}/${id}/marcar-conciliado`, { conciliadoPorId }, { headers: getAuthHeaders() });
  return res.data;
}

export async function getConciliacionesByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}