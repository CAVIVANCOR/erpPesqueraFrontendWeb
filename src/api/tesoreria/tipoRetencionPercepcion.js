// src/api/tesoreria/tipoRetencionPercepcion.js
import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-retencion-percepcion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getTiposRetencionPercepcion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTipoRetencionPercepcionById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getTiposPorTipo(tipo) {
  const res = await axios.get(`${API_URL}/tipo/${tipo}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearTipoRetencionPercepcion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarTipoRetencionPercepcion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarTipoRetencionPercepcion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}