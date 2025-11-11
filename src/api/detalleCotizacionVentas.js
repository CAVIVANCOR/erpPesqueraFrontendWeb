// src/api/detalleCotizacionVentas.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/detalles-cotizacion-ventas`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDetallesCotizacionVentas(cotizacionId) {
  const res = await axios.get(`${API_URL}/cotizacion/${cotizacionId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function getDetalleCotizacionVentasPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function crearDetalleCotizacionVentas(data) {
  const res = await axios.post(API_URL, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function actualizarDetalleCotizacionVentas(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function eliminarDetalleCotizacionVentas(id) {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}