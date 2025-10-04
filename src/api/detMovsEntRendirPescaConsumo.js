// src/api/detMovsEntRendirPescaConsumo.js
// Funciones de integración API REST para DetMovsEntRendirPescaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/movs-entregarendir-pesca-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los detalles de movimientos de entrega a rendir pesca consumo
 * @returns {Promise} Lista de detalles de movimientos
 */
export async function getDetMovsEntRendirPescaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un detalle de movimiento por su ID
 * @param {number} id - ID del detalle de movimiento
 * @returns {Promise} Detalle de movimiento
 */
export async function getDetMovEntRendirPescaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo detalle de movimiento de entrega a rendir
 * @param {Object} data - Datos del detalle de movimiento
 * @returns {Promise} Detalle de movimiento creado
 */
export async function crearDetMovEntRendirPescaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un detalle de movimiento existente
 * @param {number} id - ID del detalle de movimiento
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Detalle de movimiento actualizado
 */
export async function actualizarDetMovEntRendirPescaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un detalle de movimiento
 * @param {number} id - ID del detalle de movimiento a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarDetMovEntRendirPescaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

// Funciones con nombres que incluyen 's' en 'Movs' para compatibilidad con componentes
export async function getAllDetMovsEntRendirPescaConsumo() {
  return await getDetMovsEntRendirPescaConsumo();
}

export async function crearDetMovsEntRendirPescaConsumo(data) {
  return await crearDetMovEntRendirPescaConsumo(data);
}

export async function actualizarDetMovsEntRendirPescaConsumo(id, data) {
  return await actualizarDetMovEntRendirPescaConsumo(id, data);
}

export async function eliminarDetMovsEntRendirPescaConsumo(id) {
  return await eliminarDetMovEntRendirPescaConsumo(id);
}