// src/api/ubicacionLetra.js
// Funciones de integración API REST para UbicacionLetra. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/ubicaciones-letra`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las ubicaciones de letra del sistema
 * @returns {Promise<Array>} Lista de ubicaciones de letra
 */
export async function getAllUbicacionLetra() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getUbicacionesLetra = getAllUbicacionLetra;

/**
 * Obtiene una ubicación de letra por ID
 * @param {number} id - ID de la ubicación
 * @returns {Promise<Object>} Ubicación de letra
 */
export async function getUbicacionLetraPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva ubicación de letra
 * @param {Object} data - Datos de la ubicación
 * @returns {Promise<Object>} Ubicación de letra creada
 */
export async function crearUbicacionLetra(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una ubicación de letra existente
 * @param {number} id - ID de la ubicación
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Ubicación de letra actualizada
 */
export async function actualizarUbicacionLetra(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una ubicación de letra
 * @param {number} id - ID de la ubicación a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarUbicacionLetra(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene ubicaciones de letra por banco
 * @param {number} bancoId - ID del banco
 * @returns {Promise<Array>} Lista de ubicaciones filtradas por banco
 */
export async function getUbicacionesPorBanco(bancoId) {
  const res = await axios.get(`${API_URL}/banco/${bancoId}`, { headers: getAuthHeaders() });
  return res.data;
}