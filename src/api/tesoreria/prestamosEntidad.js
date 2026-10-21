// src/api/tesoreria/prestamosEntidad.js
// Préstamos con accionistas y terceros (recibidos y otorgados, solo capital)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/prestamos-entidad`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/** Filtros: empresaId, sentido, esAccionista, entidadComercialId */
export async function getPrestamosEntidad(params = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params });
  return res.data;
}

/** Préstamos vigentes con saldo. params: empresaId (obligatorio), sentido, entidadComercialId */
export async function getPrestamosEntidadVigentes(params) {
  const res = await axios.get(`${API_URL}/vigentes`, { headers: getAuthHeaders(), params });
  return res.data.data;
}

export async function getPrestamoEntidadById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/** Préstamo anterior al sistema (saldo inicial, sin movimiento de caja) */
export async function createPrestamoEntidad(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePrestamoEntidad(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePrestamoEntidad(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/** Operación de Tesorería: desembolso de un préstamo nuevo */
export async function desembolsarPrestamoEntidad(data) {
  const res = await axios.post(`${API_URL}/desembolsos`, data, { headers: getAuthHeaders() });
  return res.data;
}

/** Operación de Tesorería: pago (recibido) o cobro (otorgado) de capital */
export async function pagarPrestamoEntidad(data) {
  const res = await axios.post(`${API_URL}/pagos`, data, { headers: getAuthHeaders() });
  return res.data;
}

/** Asiento de apertura (saldo inicial) del préstamo */
export async function getAsientosAperturaPrestamoEntidad(id) {
  const res = await axios.get(`${API_URL}/${id}/asientos`, { headers: getAuthHeaders() });
  return res.data;
}

/** Genera el asiento de apertura del préstamo */
export async function generarAsientoAperturaPrestamoEntidad(id) {
  const res = await axios.post(`${API_URL}/${id}/asientos`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/** Elimina el asiento de apertura pendiente del préstamo */
export async function eliminarAsientosAperturaPrestamoEntidad(id) {
  const res = await axios.delete(`${API_URL}/${id}/asientos`, { headers: getAuthHeaders() });
  return res.data;
}
