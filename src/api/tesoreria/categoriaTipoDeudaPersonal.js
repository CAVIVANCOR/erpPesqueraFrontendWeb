// src/api/tesoreria/categoriaTipoDeudaPersonal.js
// Funciones de integración API REST para Categoría Tipo Deuda Personal

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/categorias-tipo-deuda-personal`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getCategoriaTipoDeudaPersonal() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCategoriaTipoDeudaPersonalActivos() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCategoriaTipoDeudaPersonalById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createCategoriaTipoDeudaPersonal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateCategoriaTipoDeudaPersonal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteCategoriaTipoDeudaPersonal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}