// src/api/pagoLetraCambio.js
// Funciones de integración API REST para PagoLetraCambio. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/pagos-letra-cambio`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los pagos de letra de cambio del sistema
 * @returns {Promise<Array>} Lista de pagos de letra de cambio
 */
export async function getAllPagoLetraCambio() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getPagosLetraCambio = getAllPagoLetraCambio;

/**
 * Obtiene un pago de letra de cambio por ID
 * @param {number} id - ID del pago
 * @returns {Promise<Object>} Pago de letra de cambio
 */
export async function getPagoLetraCambioPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo pago de letra de cambio
 * @param {Object} data - Datos del pago
 * @returns {Promise<Object>} Pago de letra de cambio creado
 */
export async function crearPagoLetraCambio(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un pago de letra de cambio existente
 * @param {number} id - ID del pago
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Pago de letra de cambio actualizado
 */
export async function actualizarPagoLetraCambio(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un pago de letra de cambio
 * @param {number} id - ID del pago a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarPagoLetraCambio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene pagos de letra de cambio por letra
 * @param {number} letraCambioId - ID de la letra de cambio
 * @returns {Promise<Array>} Lista de pagos filtrados por letra
 */
export async function getPagosPorLetra(letraCambioId) {
  const res = await axios.get(`${API_URL}/letra/${letraCambioId}`, { headers: getAuthHeaders() });
  return res.data;
}