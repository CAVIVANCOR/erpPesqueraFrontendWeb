// src/api/ejecucionPresupuestal.js
// Funciones de integración API REST para EjecucionPresupuestal. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/ejecuciones-presupuestales`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las ejecuciones presupuestales del sistema
 * @returns {Promise<Array>} Lista de ejecuciones presupuestales
 */
export async function getAllEjecucionPresupuestal() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getEjecucionesPresupuestales = getAllEjecucionPresupuestal;

/**
 * Obtiene una ejecución presupuestal por ID
 * @param {number} id - ID de la ejecución
 * @returns {Promise<Object>} Ejecución presupuestal
 */
export async function getEjecucionPresupuestalPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva ejecución presupuestal
 * @param {Object} data - Datos de la ejecución
 * @returns {Promise<Object>} Ejecución presupuestal creada
 */
export async function crearEjecucionPresupuestal(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una ejecución presupuestal existente
 * @param {number} id - ID de la ejecución
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Ejecución presupuestal actualizada
 */
export async function actualizarEjecucionPresupuestal(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una ejecución presupuestal
 * @param {number} id - ID de la ejecución a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarEjecucionPresupuestal(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene ejecuciones presupuestales por presupuesto
 * @param {number} presupuestoId - ID del presupuesto anual
 * @returns {Promise<Array>} Lista de ejecuciones filtradas por presupuesto
 */
export async function getEjecucionesPorPresupuesto(presupuestoId) {
  const res = await axios.get(`${API_URL}/presupuesto/${presupuestoId}`, { headers: getAuthHeaders() });
  return res.data;
}