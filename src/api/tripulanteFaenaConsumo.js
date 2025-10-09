// src/api/tripulanteFaenaConsumo.js
// Funciones de integración API REST para TripulanteFaenaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/tripulantes-faena-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tripulantes de faena consumo
 * @returns {Promise} Lista de tripulantes de faena consumo
 */
export async function getTripulantesFaenaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un tripulante de faena consumo por su ID
 * @param {number} id - ID del tripulante de faena consumo
 * @returns {Promise} Tripulante de faena consumo
 */
export async function getTripulanteFaenaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene tripulantes de faena consumo por faenaPescaConsumoId
 * @param {number} faenaPescaConsumoId - ID de la faena de pesca consumo
 * @returns {Promise} Lista de tripulantes de la faena
 */
export async function getTripulantesPorFaena(faenaPescaConsumoId) {
  const res = await axios.get(`${API_URL}/faena/${faenaPescaConsumoId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo tripulante de faena consumo
 * @param {Object} data - Datos del tripulante de faena consumo
 * @returns {Promise} Tripulante de faena consumo creado
 */
export async function createTripulanteFaenaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un tripulante de faena consumo existente
 * @param {number} id - ID del tripulante de faena consumo
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Tripulante de faena consumo actualizado
 */
export async function updateTripulanteFaenaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un tripulante de faena consumo
 * @param {number} id - ID del tripulante de faena consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarTripulanteFaenaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Regenera los tripulantes de una faena consumo
 * @param {number} faenaPescaConsumoId - ID de la faena de pesca consumo
 * @returns {Promise} Resultado de la regeneración
 */
export async function regenerarTripulantes(faenaPescaConsumoId) {
  const res = await axios.post(`${API_URL}/regenerar/${faenaPescaConsumoId}`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo tripulante de faena consumo
 */
export const crearTripulanteFaenaConsumo = async (data) => {
  try {
    const response = await axios.post(API_URL, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear tripulante de faena consumo:", error);
    throw error;
  }
};