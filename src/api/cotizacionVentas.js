// src/api/cotizacionVentas.js
// Funciones de integración API REST para CotizacionVentas. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cotizaciones-ventas`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getCotizacionesVentas() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllCotizacionVentas() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getCotizacionVentasPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearCotizacionVentas(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarCotizacionVentas(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarCotizacionVentas(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteCotizacionVentas(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene series de documentos filtradas por empresaId y tipoDocumentoId
 */
export async function getSeriesDoc(empresaId, tipoDocumentoId) {
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
