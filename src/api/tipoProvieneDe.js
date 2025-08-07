// src/api/tipoProvieneDe.js
// Funciones de integración API REST para TipoProvieneDe. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-proviene-de`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos "proviene de" del sistema
 * @returns {Promise<Array>} Lista de tipos "proviene de"
 */
export async function getTiposProvieneDe() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un tipo "proviene de" por ID
 * @param {number} id - ID del tipo "proviene de"
 * @returns {Promise<Object>} Tipo "proviene de" encontrado
 */
export async function getTipoProvieneDePorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo tipo "proviene de"
 * @param {Object} data - Datos del tipo "proviene de"
 * @returns {Promise<Object>} Tipo "proviene de" creado
 */
export async function crearTipoProvieneDe(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un tipo "proviene de" existente
 * @param {number} id - ID del tipo "proviene de"
 * @param {Object} data - Datos actualizados del tipo
 * @returns {Promise<Object>} Tipo "proviene de" actualizado
 */
export async function actualizarTipoProvieneDe(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un tipo "proviene de"
 * @param {number} id - ID del tipo "proviene de" a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarTipoProvieneDe(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
