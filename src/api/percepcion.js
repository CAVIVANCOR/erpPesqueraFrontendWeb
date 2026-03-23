// src/api/percepcion.js
// Funciones de integración API REST para Percepcion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/percepciones`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las percepciones del sistema
 * @returns {Promise<Array>} Lista de percepciones
 */
export async function getAllPercepcion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getPercepciones = getAllPercepcion;

/**
 * Obtiene una percepción por ID
 * @param {number} id - ID de la percepción
 * @returns {Promise<Object>} Percepción
 */
export async function getPercepcionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva percepción
 * @param {Object} data - Datos de la percepción
 * @returns {Promise<Object>} Percepción creada
 */
export async function crearPercepcion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una percepción existente
 * @param {number} id - ID de la percepción
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Percepción actualizada
 */
export async function actualizarPercepcion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una percepción
 * @param {number} id - ID de la percepción a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarPercepcion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene percepciones por cliente
 * @param {number} clienteId - ID del cliente
 * @returns {Promise<Array>} Lista de percepciones filtradas por cliente
 */
export async function getPercepcionesPorCliente(clienteId) {
  const res = await axios.get(`${API_URL}/cliente/${clienteId}`, { headers: getAuthHeaders() });
  return res.data;
}