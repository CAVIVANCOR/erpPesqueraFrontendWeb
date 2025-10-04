// src/api/cargos.js
// API profesional para gestión de cargos en el ERP Megui.
// Todas las funciones usan JWT desde useAuthStore y están documentadas en español técnico.

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/cargos`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los cargos para uso en combos.
 * @returns {Promise<Array>} Lista de cargos
 */
export const getAllCargos = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene un cargo por ID.
 * @param {number|string} id - ID del cargo
 * @returns {Promise<Object>} Cargo encontrado
 */
export const getCargoPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};