// src/api/retencion.js
// Funciones de integración API REST para Retencion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/retenciones`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las retenciones del sistema
 * @returns {Promise<Array>} Lista de retenciones
 */
export async function getAllRetencion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getRetenciones = getAllRetencion;

/**
 * Obtiene una retención por ID
 * @param {number} id - ID de la retención
 * @returns {Promise<Object>} Retención
 */
export async function getRetencionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva retención
 * @param {Object} data - Datos de la retención
 * @returns {Promise<Object>} Retención creada
 */
export async function crearRetencion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una retención existente
 * @param {number} id - ID de la retención
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Retención actualizada
 */
export async function actualizarRetencion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una retención
 * @param {number} id - ID de la retención a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarRetencion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene retenciones por proveedor
 * @param {number} proveedorId - ID del proveedor
 * @returns {Promise<Array>} Lista de retenciones filtradas por proveedor
 */
export async function getRetencionesPorProveedor(proveedorId) {
  const res = await axios.get(`${API_URL}/proveedor/${proveedorId}`, { headers: getAuthHeaders() });
  return res.data;
}