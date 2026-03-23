// src/api/tipoRetencionPercepcion.js
// Funciones de integración API REST para TipoRetencionPercepcion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-retencion-percepcion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos de retención/percepción del sistema
 * @returns {Promise<Array>} Lista de tipos de retención/percepción
 */
export async function getAllTipoRetencionPercepcion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getTiposRetencionPercepcion = getAllTipoRetencionPercepcion;

/**
 * Obtiene un tipo de retención/percepción por ID
 * @param {number} id - ID del tipo
 * @returns {Promise<Object>} Tipo de retención/percepción
 */
export async function getTipoRetencionPercepcionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo tipo de retención/percepción
 * @param {Object} data - Datos del tipo
 * @returns {Promise<Object>} Tipo de retención/percepción creado
 */
export async function crearTipoRetencionPercepcion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un tipo de retención/percepción existente
 * @param {number} id - ID del tipo
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Tipo de retención/percepción actualizado
 */
export async function actualizarTipoRetencionPercepcion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un tipo de retención/percepción
 * @param {number} id - ID del tipo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarTipoRetencionPercepcion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene tipos de retención/percepción por tipo de operación
 * @param {string} tipo - Tipo de operación (RETENCION o PERCEPCION)
 * @returns {Promise<Array>} Lista de tipos filtrados
 */
export async function getTiposPorTipo(tipo) {
  const res = await axios.get(`${API_URL}/tipo/${tipo}`, { headers: getAuthHeaders() });
  return res.data;
}