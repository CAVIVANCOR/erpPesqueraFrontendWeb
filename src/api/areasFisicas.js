// src/api/areasFisicas.js
// API profesional para AreaFisicaSede en el ERP Megui.
// Todas las funciones usan JWT desde useAuthStore.
// Documentado en español técnico.

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/areas-fisicas-sede`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las áreas físicas de sede.
 * @returns {Promise<Array>} Lista de áreas físicas
 */
export const getAreasFisicas = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene un área física de sede por ID.
 * @param {number|string} id - ID del área física
 * @returns {Promise<Object>} Área física encontrada
 */
export const getAreaFisicaPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Crea una nueva área física de sede.
 * @param {Object} data - Datos del área física
 * @returns {Promise<Object>} Área física creada
 */
export const crearAreaFisica = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza un área física de sede existente.
 * @param {number|string} id - ID del área física
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Área física actualizada
 */
export const actualizarAreaFisica = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Elimina un área física de sede por ID.
 * @param {number|string} id - ID del área física
 * @returns {Promise<void>} 
 */
export const eliminarAreaFisica = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};
