// src/api/motivoSinFaena.js
// Funciones de integración API REST para MotivoSinFaena. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/motivos-sin-faena`;
/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los motivos sin faena
 * @returns {Promise} Lista de motivos sin faena
 */
export async function getMotivosSinFaena() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene motivos sin faena activos (no cesados)
 * @returns {Promise} Lista de motivos sin faena activos
 */
export async function getMotivosSinFaenaActivos() {
  const res = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un motivo sin faena por su ID
 * @param {number} id - ID del motivo sin faena
 * @returns {Promise} Motivo sin faena
 */
export async function getMotivoSinFaenaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo motivo sin faena
 * @param {Object} data - Datos del motivo sin faena
 * @returns {Promise} Motivo sin faena creado
 */
export async function crearMotivoSinFaena(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un motivo sin faena existente
 * @param {number} id - ID del motivo sin faena
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Motivo sin faena actualizado
 */
export async function actualizarMotivoSinFaena(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un motivo sin faena
 * @param {number} id - ID del motivo sin faena a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarMotivoSinFaena(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}