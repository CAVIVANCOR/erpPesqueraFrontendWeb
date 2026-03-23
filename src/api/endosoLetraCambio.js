// src/api/endosoLetraCambio.js
// Funciones de integración API REST para EndosoLetraCambio. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/endosos-letra-cambio`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los endosos de letra de cambio del sistema
 * @returns {Promise<Array>} Lista de endosos de letra de cambio
 */
export async function getAllEndosoLetraCambio() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export const getEndososLetraCambio = getAllEndosoLetraCambio;

/**
 * Obtiene un endoso de letra de cambio por ID
 * @param {number} id - ID del endoso
 * @returns {Promise<Object>} Endoso de letra de cambio
 */
export async function getEndosoLetraCambioPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo endoso de letra de cambio
 * @param {Object} data - Datos del endoso
 * @returns {Promise<Object>} Endoso de letra de cambio creado
 */
export async function crearEndosoLetraCambio(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un endoso de letra de cambio existente
 * @param {number} id - ID del endoso
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Endoso de letra de cambio actualizado
 */
export async function actualizarEndosoLetraCambio(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un endoso de letra de cambio
 * @param {number} id - ID del endoso a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarEndosoLetraCambio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene endosos de letra de cambio por letra
 * @param {number} letraCambioId - ID de la letra de cambio
 * @returns {Promise<Array>} Lista de endosos filtrados por letra
 */
export async function getEndososPorLetra(letraCambioId) {
  const res = await axios.get(`${API_URL}/letra/${letraCambioId}`, { headers: getAuthHeaders() });
  return res.data;
}