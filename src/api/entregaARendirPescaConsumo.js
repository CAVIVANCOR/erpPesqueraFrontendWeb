// src/api/entregaARendirPescaConsumo.js
// Funciones de integración API REST para EntregaARendirPescaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/entregas-a-rendir-pesca-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las entregas a rendir pesca consumo
 * @returns {Promise} Lista de entregas a rendir
 */
export async function getEntregasARendirPescaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene una entrega a rendir por su ID
 * @param {number} id - ID de la entrega a rendir
 * @returns {Promise} Entrega a rendir
 */
export async function getEntregaARendirPescaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva entrega a rendir
 * @param {Object} data - Datos de la entrega a rendir
 * @returns {Promise} Entrega a rendir creada
 */
export async function crearEntregaARendirPescaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una entrega a rendir existente
 * @param {number} id - ID de la entrega a rendir
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Entrega a rendir actualizada
 */
export async function actualizarEntregaARendirPescaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una entrega a rendir
 * @param {number} id - ID de la entrega a rendir a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarEntregaARendirPescaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Liquida una entrega de pesca consumo
 * @param {number} id - ID de la entrega a liquidar
 * @returns {Promise} Confirmación de liquidación
 */
export async function liquidarEntregaPescaConsumo(id) {
  const res = await axios.post(`${API_URL}/${id}/liquidar`, {}, { headers: getAuthHeaders() });
  return res.data;
}