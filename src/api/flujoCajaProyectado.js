// src/api/flujoCajaProyectado.js
// Funciones de integración API REST para FlujoCajaProyectado. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/flujo-caja-proyectado`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los flujos de caja proyectados del sistema
 * @returns {Promise<Array>} Lista de flujos de caja proyectados
 */
export async function getAllFlujoCajaProyectado() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getFlujoCajaProyectado = getAllFlujoCajaProyectado;

/**
 * Obtiene un flujo de caja proyectado por ID
 * @param {number} id - ID del flujo
 * @returns {Promise<Object>} Flujo de caja proyectado
 */
export async function getFlujoCajaProyectadoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo flujo de caja proyectado
 * @param {Object} data - Datos del flujo
 * @returns {Promise<Object>} Flujo de caja proyectado creado
 */
export async function crearFlujoCajaProyectado(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un flujo de caja proyectado existente
 * @param {number} id - ID del flujo
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Flujo de caja proyectado actualizado
 */
export async function actualizarFlujoCajaProyectado(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un flujo de caja proyectado
 * @param {number} id - ID del flujo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarFlujoCajaProyectado(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene flujos de caja proyectados por periodo
 * @param {number} anio - Año del periodo
 * @param {number} mes - Mes del periodo
 * @returns {Promise<Array>} Lista de flujos filtrados por periodo
 */
export async function getFlujoPorPeriodo(anio, mes) {
  const res = await axios.get(`${API_URL}/periodo/${anio}/${mes}`, { headers: getAuthHeaders() });
  return res.data;
}