// src/api/letraCambio.js
// Funciones de integración API REST para LetraCambio. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/letras-cambio`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las letras de cambio del sistema
 * @returns {Promise<Array>} Lista de letras de cambio
 */
export async function getAllLetraCambio() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getLetrasCambio = getAllLetraCambio;

/**
 * Obtiene una letra de cambio por ID
 * @param {number} id - ID de la letra
 * @returns {Promise<Object>} Letra de cambio
 */
export async function getLetraCambioPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva letra de cambio
 * @param {Object} data - Datos de la letra
 * @returns {Promise<Object>} Letra de cambio creada
 */
export async function crearLetraCambio(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una letra de cambio existente
 * @param {number} id - ID de la letra
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Letra de cambio actualizada
 */
export async function actualizarLetraCambio(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una letra de cambio
 * @param {number} id - ID de la letra a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarLetraCambio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene letras de cambio por estado
 * @param {string} estado - Estado de la letra (EMITIDA, ACEPTADA, etc.)
 * @returns {Promise<Array>} Lista de letras filtradas por estado
 */
export async function getLetrasPorEstado(estado) {
  const res = await axios.get(`${API_URL}/estado/${estado}`, { headers: getAuthHeaders() });
  return res.data;
}