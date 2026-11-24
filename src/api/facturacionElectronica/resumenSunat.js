// src/api/facturacionElectronica/resumenSunat.js
// Consulta de resúmenes diarios de boletas (RC) y comunicaciones de baja (RA). Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/facturacion-electronica/resumen-sunat`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Lista los resúmenes, del más reciente al más antiguo.
 * @param {{ empresaId?: number, tipo?: "RC"|"RA" }} filtros
 */
export async function getResumenesSunat(filtros = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params: filtros });
  return res.data;
}

/**
 * Obtiene un resumen con los comprobantes que informa.
 * @param {number} id
 */
export async function getResumenSunatById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
