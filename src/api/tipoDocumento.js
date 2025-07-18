// src/api/tipoDocumento.js
// API profesional para gestión de tipos de documento en el ERP Megui.
// Todas las funciones usan JWT desde useAuthStore y están documentadas en español técnico.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-documento`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los tipos de documento.
 * @returns {Promise<Array>} Lista de tipos de documento
 */
export const getTiposDocumento = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Crea un nuevo tipo de documento.
 * @param {Object} data Datos del tipo de documento
 * @returns {Promise<Object>} Tipo de documento creado
 */
export const crearTipoDocumento = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza un tipo de documento existente.
 * @param {number|string} id ID del tipo de documento
 * @param {Object} data Datos a actualizar
 * @returns {Promise<Object>} Tipo de documento actualizado
 */
export const actualizarTipoDocumento = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Elimina un tipo de documento por ID.
 * @param {number|string} id ID del tipo de documento
 * @returns {Promise<void>}
 */
export const eliminarTipoDocumento = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};
