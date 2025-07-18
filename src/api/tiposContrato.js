// src/api/tiposContrato.js
// API profesional para gestión de tipos de contrato en el ERP Megui.
// Todas las funciones usan JWT desde useAuthStore y están documentadas en español técnico.

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-contrato`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los tipos de contrato para uso en combos.
 * @returns {Promise<Array>} Lista de tipos de contrato
 */
export const getTiposContrato = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene un tipo de contrato por ID.
 * @param {number|string} id - ID del tipo de contrato
 * @returns {Promise<Object>} Tipo de contrato encontrado
 */
export const getTipoContratoPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};
