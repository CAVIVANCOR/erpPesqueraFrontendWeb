// src/api/tesoreria/letrasOperaciones.js
// Letras de cambio de compras (PAGAR) y ventas (COBRAR): canje de facturas, pago/cobro, refinanciación

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/letras-operaciones`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/** Filtros: tipoLetra, empresaId, estadoId, entidadId, soloPendientes */
export async function getLetrasOperaciones(params = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params });
  return res.data;
}

export async function getLetraOperacionById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/** Facturas (CxP / CxC) canjeables de un proveedor o cliente. params: tipoLetra, empresaId, entidadId */
export async function getDocumentosCanjeables(params) {
  const res = await axios.get(`${API_URL}/documentos-canjeables`, { headers: getAuthHeaders(), params });
  return res.data?.data || [];
}

/** Letras con capital pendiente para pagar/cobrar. params: empresaId, tipoLetra */
export async function getLetrasPendientesPago(params = {}) {
  const res = await axios.get(`${API_URL}/pendientes-pago`, { headers: getAuthHeaders(), params });
  return res.data?.data || [];
}

export async function canjearFacturas(data) {
  const res = await axios.post(`${API_URL}/canje`, data, { headers: getAuthHeaders() });
  return res.data?.data;
}

export async function anularCanjeLetra(id) {
  const res = await axios.post(`${API_URL}/${id}/anular-canje`, {}, { headers: getAuthHeaders() });
  return res.data?.data;
}

export async function refinanciarLetra(data) {
  const res = await axios.post(`${API_URL}/refinanciar`, data, { headers: getAuthHeaders() });
  return res.data?.data;
}

export async function revertirRefinanciacionLetra(id) {
  const res = await axios.post(`${API_URL}/${id}/revertir-refinanciacion`, {}, { headers: getAuthHeaders() });
  return res.data?.data;
}

/** Pago (por pagar) o cobranza (por cobrar) de una letra desde Tesorería */
export async function pagarLetra(data) {
  const res = await axios.post(`${API_URL}/pagos`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function procesarVencimientosLetras() {
  const res = await axios.post(`${API_URL}/proceso/vencimientos`, {}, { headers: getAuthHeaders() });
  return res.data?.data;
}
