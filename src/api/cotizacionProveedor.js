// src/api/cotizacionProveedor.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/cotizaciones-proveedor`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getCotizacionesProveedor(requerimientoCompraId) {
  const params = requerimientoCompraId ? { requerimientoCompraId } : {};
  const res = await axios.get(API_URL, { params, headers: getAuthHeaders() });
  return res.data;
}

export async function crearCotizacionProveedor(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarCotizacionProveedor(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarCotizacionProveedor(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function seleccionarCotizacionProveedor(id) {
  const res = await axios.post(`${API_URL}/${id}/seleccionar`, {}, { headers: getAuthHeaders() });
  return res.data;
}