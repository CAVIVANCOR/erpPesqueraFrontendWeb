// src/api/katanaTripulacion.js
// API centralizada para gestión de katanas tripulación en el ERP Megui.
// Todas las funciones devuelven promesas y usan autenticación JWT desde useAuthStore.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/katanas-tripulacion`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todas las katanas tripulación.
 * @returns {Promise<Array>} Lista de katanas tripulación
 */
export const getKatanasTripulacion = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  const lista = Array.isArray(res.data) ? res.data : (res.data.katanasTripulacion || []);
  return lista;
};

/**
 * Obtiene una katana tripulación por ID.
 * @param {number|string} id - ID de la katana tripulación
 * @returns {Promise<Object>} Katana tripulación encontrada
 */
export const getKatanaTripulacionPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Crea una nueva katana tripulación.
 * @param {Object} data - Datos de la katana tripulación
 * @returns {Promise<Object>} Katana tripulación creada
 */
export const crearKatanaTripulacion = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza una katana tripulación existente.
 * @param {number|string} id - ID de la katana tripulación
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Katana tripulación actualizada
 */
export const actualizarKatanaTripulacion = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene katanas tripulación filtradas por empresa.
 * @param {number|string} empresaId - ID de la empresa
 * @returns {Promise<Array>} Lista de katanas tripulación de la empresa
 */
export const getKatanasTripulacionPorEmpresa = async (empresaId) => {
  const res = await axios.get(`${API_URL}?empresaId=${empresaId}`, { headers: getAuthHeader() });
  const lista = Array.isArray(res.data) ? res.data : (res.data.katanasTripulacion || []);
  return lista;
};

/**
 * Elimina una katana tripulación por ID.
 * @param {number|string} id - ID de la katana tripulación
 * @returns {Promise<void>} 
 */
export const eliminarKatanaTripulacion = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};
