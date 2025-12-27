// src/api/facturacionElectronica/comprobanteElectronico.js
// Funciones de integración API REST para Comprobante Electrónico. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/facturacion-electronica/comprobante-electronico`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getComprobanteElectronico() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getComprobanteElectronicoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createComprobanteElectronico(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updateComprobanteElectronico(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteComprobanteElectronico(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function marcarEnviado(id) {
  const res = await axios.post(`${API_URL}/${id}/marcar-enviado`, {}, { headers: getAuthHeaders() });
  return res.data;
}

export async function marcarCDRRecibido(id) {
  const res = await axios.post(`${API_URL}/${id}/marcar-cdr-recibido`, {}, { headers: getAuthHeaders() });
  return res.data;
}

export async function getComprobantesByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}