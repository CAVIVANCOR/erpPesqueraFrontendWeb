// src/api/presupuestoAnual.js
// Funciones de integración API REST para PresupuestoAnual. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/presupuestos-anuales`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los presupuestos anuales del sistema
 * @returns {Promise<Array>} Lista de presupuestos anuales
 */
export async function getAllPresupuestoAnual() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getPresupuestosAnuales = getAllPresupuestoAnual;

/**
 * Obtiene un presupuesto anual por ID
 * @param {number} id - ID del presupuesto
 * @returns {Promise<Object>} Presupuesto anual
 */
export async function getPresupuestoAnualPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo presupuesto anual
 * @param {Object} data - Datos del presupuesto
 * @returns {Promise<Object>} Presupuesto anual creado
 */
export async function crearPresupuestoAnual(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un presupuesto anual existente
 * @param {number} id - ID del presupuesto
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Presupuesto anual actualizado
 */
export async function actualizarPresupuestoAnual(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un presupuesto anual
 * @param {number} id - ID del presupuesto a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarPresupuestoAnual(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene presupuestos anuales por año
 * @param {number} anio - Año del presupuesto
 * @returns {Promise<Array>} Lista de presupuestos filtrados por año
 */
export async function getPresupuestosPorAnio(anio) {
  const res = await axios.get(`${API_URL}/anio/${anio}`, { headers: getAuthHeaders() });
  return res.data;
}