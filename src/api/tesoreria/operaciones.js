// src/api/tesoreria/operaciones.js
// Reversión de operaciones especializadas de caja (Tesorería Pendientes)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/operaciones`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/** Operaciones realizadas, agrupadas por número de operación */
export async function listarOperaciones(params = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params });
  return res.data.data;
}

/** Simulación de solo lectura: { movimientoId } o { empresaId, correlativo } */
export async function obtenerPlanReversion(params) {
  const res = await axios.get(`${API_URL}/plan`, { headers: getAuthHeaders(), params });
  return res.data.data;
}

/** Ejecuta la reversión: { movimientoId | empresaId + correlativo, confirmacion, motivo } */
export async function revertirOperacionCaja(data) {
  const res = await axios.post(`${API_URL}/revertir`, data, { headers: getAuthHeaders() });
  return res.data;
}
