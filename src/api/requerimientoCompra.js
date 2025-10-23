// src/api/requerimientoCompra.js
// Funciones de integración API REST para RequerimientoCompra. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/requerimientos-compra`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getRequerimientosCompra() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getRequerimientoCompraPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearRequerimientoCompra(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarRequerimientoCompra(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarRequerimientoCompra(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Aprueba un requerimiento de compra y crea automáticamente la EntregaARendir
 */
export async function aprobarRequerimientoCompra(id) {
  const res = await axios.post(`${API_URL}/${id}/aprobar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Anula un requerimiento de compra
 */
export async function anularRequerimientoCompra(id) {
  const res = await axios.post(`${API_URL}/${id}/anular`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Autoriza la compra de un requerimiento
 */
export async function autorizarCompraRequerimientoCompra(id, autorizadoPorId) {
  const res = await axios.post(
    `${API_URL}/${id}/autorizar-compra`, 
    { autorizadoPorId }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Obtiene series de documentos filtradas por empresaId y tipoDocumentoId
 */
export async function getSeriesDocRequerimiento(empresaId, tipoDocumentoId) {
  const params = {
    ...(empresaId && { empresaId }),
    ...(tipoDocumentoId && { tipoDocumentoId })
  };
  const res = await axios.get(`${API_URL}/series-doc`, { 
    params,
    headers: getAuthHeaders() 
  });
  return res.data;
}