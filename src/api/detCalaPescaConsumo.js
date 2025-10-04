// src/api/detCalaPescaConsumo.js
// Funciones de integración API REST para DetCalaPescaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/det-cala-pesca-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los detalles de cala de pesca consumo
 * @returns {Promise} Lista de detalles de cala de pesca consumo
 */
export async function getDetCalaPescaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un detalle de cala de pesca consumo por su ID
 * @param {number} id - ID del detalle de cala de pesca consumo
 * @returns {Promise} Detalle de cala de pesca consumo
 */
export async function getDetCalaPescaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo detalle de cala de pesca consumo
 * @param {Object} data - Datos del detalle de cala de pesca consumo
 * @returns {Promise} Detalle de cala de pesca consumo creado
 */
export async function crearDetCalaPescaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un detalle de cala de pesca consumo existente
 * @param {number} id - ID del detalle de cala de pesca consumo
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Detalle de cala de pesca consumo actualizado
 */
export async function actualizarDetCalaPescaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un detalle de cala de pesca consumo
 * @param {number} id - ID del detalle de cala de pesca consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarDetCalaPescaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene todos los detalles de cala de pesca consumo por cala específica
 * @param {number} calaId - ID de la cala de faena consumo
 * @returns {Promise} Lista de detalles de la cala
 */
export async function getDetCalaPescaConsumoPorCala(calaId) {
  const res = await axios.get(`${API_URL}/cala/${calaId}`, { headers: getAuthHeaders() });
  return res.data;
}