// src/api/sedes.js
// API profesional para SedesEmpresa en el ERP Megui.
// Todas las funciones usan JWT desde useAuthStore.
// Documentado en español técnico.

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/sedes-empresa`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las sedes de empresa.
 * @returns {Promise<Array>} Lista de sedes
 */
export const getSedes = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene una sede de empresa por ID.
 * @param {number|string} id - ID de la sede
 * @returns {Promise<Object>} Sede encontrada
 */
export const getSedePorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Crea una nueva sede de empresa.
 * @param {Object} data - Datos de la sede
 * @returns {Promise<Object>} Sede creada
 */
export const crearSede = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza una sede de empresa existente.
 * @param {number|string} id - ID de la sede
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Sede actualizada
 */
export const actualizarSede = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene sedes de empresa filtradas por ID de empresa.
 * @param {number|string} empresaId - ID de la empresa
 * @returns {Promise<Array>} Lista de sedes de la empresa
 */
export const getSedesPorEmpresa = async (empresaId) => {
  const res = await axios.get(`${API_URL}?empresaId=${empresaId}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Elimina una sede de empresa por ID.
 * @param {number|string} id - ID de la sede
 * @returns {Promise<void>} 
 */
export const eliminarSede = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};
