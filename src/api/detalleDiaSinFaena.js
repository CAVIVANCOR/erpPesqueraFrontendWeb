// src/api/detalleDiaSinFaena.js
// Funciones de integración API REST para DetalleDiaSinFaena. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/detalle-dias-sin-faena`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los detalles de días sin faena
 * @returns {Promise} Lista de detalles
 */
export async function getDetallesDiasSinFaena() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene detalles por temporadaPescaId
 * @param {number} temporadaPescaId - ID de la temporada de pesca
 * @returns {Promise} Lista de detalles filtrados
 */
export async function getDetallesPorTemporada(temporadaPescaId) {
  const res = await axios.get(`${API_URL}/por-temporada`, {
    params: { temporadaPescaId },
    headers: getAuthHeaders()
  });
  return res.data;
}

/**
 * Obtiene detalles por novedadPescaConsumoId
 * @param {number} novedadPescaConsumoId - ID de la novedad de pesca consumo
 * @returns {Promise} Lista de detalles filtrados
 */
export async function getDetallesPorNovedad(novedadPescaConsumoId) {
  const res = await axios.get(`${API_URL}/por-novedad`, {
    params: { novedadPescaConsumoId },
    headers: getAuthHeaders()
  });
  return res.data;
}

/**
 * Obtiene un detalle por su ID
 * @param {number} id - ID del detalle
 * @returns {Promise} Detalle de día sin faena
 */
export async function getDetalleDiaSinFaenaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo detalle de día sin faena
 * @param {Object} data - Datos del detalle
 * @returns {Promise} Detalle creado
 */
export async function crearDetalleDiaSinFaena(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un detalle de día sin faena existente
 * @param {number} id - ID del detalle
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Detalle actualizado
 */
export async function actualizarDetalleDiaSinFaena(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un detalle de día sin faena
 * @param {number} id - ID del detalle a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarDetalleDiaSinFaena(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}