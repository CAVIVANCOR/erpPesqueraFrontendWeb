// src/api/faenaPesca.js
// Funciones de integración API REST para FaenaPesca. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/faenas-pesca`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getFaenasPesca() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getFaenaPescaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearFaenaPesca(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarFaenaPesca(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarFaenaPesca(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Finaliza una faena de pesca y genera automáticamente el movimiento de almacén
 * @param {number|string} faenaPescaId - ID de la faena de pesca
 * @param {number|string} temporadaPescaId - ID de la temporada de pesca
 * @returns {Promise<Object>} Respuesta con faena y movimiento de almacén generado
 */
export async function finalizarFaenaConMovimientoAlmacen(faenaPescaId, temporadaPescaId) {
  const res = await axios.post(
    `${API_URL}/${faenaPescaId}/finalizar-con-almacen`,
    { temporadaPescaId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}
