// src/api/tesoreria/pagoCuotaPrestamo.js
// Funciones de integración API REST para Pago de Cuota de Préstamo

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/pagos-cuota-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

// Con { cuotaPrestamoId } devuelve solo los pagos de esa cuota
export async function getPagosCuotaPrestamo(params = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params });
  return res.data;
}

export async function getPagoCuotaPrestamoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePagoCuotaPrestamo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePagoCuotaPrestamo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
