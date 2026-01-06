// src/api/tesoreria/tipoPrestamo.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getTipoPrestamo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllTipoPrestamo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoPrestamoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createTipoPrestamo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateTipoPrestamo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteTipoPrestamo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoPrestamoActivos() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoPrestamoComercioExterior() {
  const res = await axios.get(`${API_URL}/comercio-exterior`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoPrestamoEstadisticas() {
  const res = await axios.get(`${API_URL}/estadisticas`, { headers: getAuthHeaders() });
  return res.data;
}