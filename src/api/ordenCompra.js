// src/api/ordenCompra.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/ordenes-compra`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getOrdenesCompra() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getOrdenCompraPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearOrdenCompra(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarOrdenCompra(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarOrdenCompra(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function aprobarOrdenCompra(id) {
  const res = await axios.post(`${API_URL}/${id}/aprobar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

export async function anularOrdenCompra(id) {
  const res = await axios.post(`${API_URL}/${id}/anular`, {}, { headers: getAuthHeaders() });
  return res.data;
}

export async function generarMovimientoAlmacen(id, data) {
  const res = await axios.post(`${API_URL}/${id}/generar-movimiento`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function generarOrdenDesdeRequerimiento(requerimientoCompraId) {
  const res = await axios.post(`${API_URL}/generar-desde-requerimiento`, 
    { requerimientoCompraId }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}