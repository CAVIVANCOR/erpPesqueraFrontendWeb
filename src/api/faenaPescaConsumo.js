// src/api/faenaPescaConsumo.js
// Funciones de integración API REST para FaenaPescaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/faenas-pesca-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las faenas de pesca consumo
 * @returns {Promise} Lista de faenas de pesca consumo
 */
export async function getFaenasPescaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene una faena de pesca consumo por su ID
 * @param {number} id - ID de la faena de pesca consumo
 * @returns {Promise} Faena de pesca consumo
 */
export async function getFaenaPescaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea una nueva faena de pesca consumo
 * @param {Object} data - Datos de la faena de pesca consumo
 * @returns {Promise} Faena de pesca consumo creada
 */
export async function crearFaenaPescaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza una faena de pesca consumo existente
 * @param {number} id - ID de la faena de pesca consumo
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Faena de pesca consumo actualizada
 */
export async function actualizarFaenaPescaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina una faena de pesca consumo
 * @param {number} id - ID de la faena de pesca consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarFaenaPescaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Sube documento de faena de pesca consumo
 * @param {File} file - Archivo a subir
 * @returns {Promise} Respuesta con URL del documento subido
 */
export async function subirDocumentoFaenaConsumo(file) {
  const formData = new FormData();
  formData.append('informeFaena', file);
  const API_DOCUMENTO = `${import.meta.env.VITE_API_URL}/faena-pesca-consumo-documento/upload`;
  const res = await axios.post(API_DOCUMENTO, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}