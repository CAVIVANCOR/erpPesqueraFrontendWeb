// src/api/detDatosAdicionalesOrdenCompra.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/det-datos-adicionales-orden-compra`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDatosAdicionalesOrdenCompra(ordenCompraId) {
  const params = ordenCompraId ? { ordenCompraId } : {};
  const res = await axios.get(API_URL, { params, headers: getAuthHeaders() });
  return res.data;
}

export async function crearDatoAdicional(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarDatoAdicional(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarDatoAdicional(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
