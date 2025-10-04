// src/api/calaFaenaConsumo.js
// Funciones de integración API REST para CalaFaenaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/calas-faena-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las calas de faenas de consumo
 * @returns {Promise} Lista de calas de faenas de consumo
 */
export async function getCalasFaenaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene una cala de faena de consumo por su ID
 * @param {number} id - ID de la cala de faena de consumo
 * @returns {Promise} Cala de faena de consumo
 */
export async function getCalaFaenaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva cala de faena de consumo
 * @param {Object} calaFaenaConsumoData - Datos de la cala de faena de consumo
 * @returns {Promise} Cala de faena de consumo creada
 */
export async function crearCalaFaenaConsumo(calaFaenaConsumoData) {
  const res = await axios.post(API_URL, calaFaenaConsumoData, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una cala de faena de consumo existente
 * @param {number} id - ID de la cala de faena de consumo
 * @param {Object} calaFaenaConsumoData - Datos actualizados
 * @returns {Promise} Cala de faena de consumo actualizada
 */
export async function actualizarCalaFaenaConsumo(id, calaFaenaConsumoData) {
  const res = await axios.put(`${API_URL}/${id}`, calaFaenaConsumoData, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una cala de faena de consumo
 * @param {number} id - ID de la cala de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarCalaFaenaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene todas las calas de una faena de consumo específica
 * @param {number} faenaId - ID de la faena de pesca consumo
 * @returns {Promise} Lista de calas de la faena
 */
export async function getCalasFaenaConsumoPorFaena(faenaId) {
  const res = await axios.get(`${API_URL}/faena/${faenaId}`, { headers: getAuthHeaders() });
  return res.data;
}