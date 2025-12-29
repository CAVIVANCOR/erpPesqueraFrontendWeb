// src/api/tesoreria/prestamoBancario.js
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/prestamos-bancarios`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPrestamoBancario() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrestamoBancarioById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPrestamoBancario(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePrestamoBancario(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePrestamoBancario(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrestamoBancarioVigentes() {
  const res = await axios.get(`${API_URL}/vigentes`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrestamoBancarioPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCronogramaPrestamo(id) {
  const res = await axios.get(`${API_URL}/${id}/cronograma`, { headers: getAuthHeaders() });
  return res.data;
}