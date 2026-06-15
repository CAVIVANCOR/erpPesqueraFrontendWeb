// src/api/tesoreria/deudaTributaria.js
// Funciones de integración API REST para Deuda Tributaria

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/deudas-tributarias`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDeudasTributarias() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudaTributariaById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createDeudaTributaria(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateDeudaTributaria(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteDeudaTributaria(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasTributariasByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasTributariasPendientes(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/pendientes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasTributariasVencidas(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/vencidas`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasTributariasByTipo(tipoDeudaId) {
  const res = await axios.get(`${API_URL}/tipo/${tipoDeudaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDeudasTributariasByPeriodo(empresaId, periodo) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}/periodo/${periodo}`, { headers: getAuthHeaders() });
  return res.data;
}