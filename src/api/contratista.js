// src/api/contratista.js
// API centralizada para gestión de contratistas (EntidadComercial con esProveedor=true) en el ERP Megui.
// Los contratistas son EntidadComercial con esProveedor=true
// Todas las funciones devuelven promesas y usan autenticación JWT desde useAuthStore.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/entidades-comerciales`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Crea un nuevo contratista en el sistema.
 * @param {Object} data - Datos del contratista
 * @returns {Promise<Object>} Contratista creado
 */
export const crearContratista = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza un contratista existente.
 * @param {number|string} id - ID del contratista a actualizar
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Contratista actualizado
 */
export const actualizarContratista = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene un contratista por su ID.
 * @param {number|string} id - ID del contratista
 * @returns {Promise<Object>} Datos del contratista
 */
export const getContratistaPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene todos los contratistas (EntidadComercial con esProveedor=true) filtrados por empresa.
 * @param {number} [empresaId] - ID de la empresa para filtrar (opcional)
 * @returns {Promise<Array>} Lista de contratistas
 */
export const getContratistas = async (empresaId) => {
  const params = empresaId ? { empresaId, esProveedor: true } : { esProveedor: true };
  const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene contratistas activos filtrados por empresa para dropdowns.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de contratistas activos con formato para dropdown
 */
export const getContratistasActivosPorEmpresa = async (empresaId) => {
  const params = { empresaId, esProveedor: true, estado: true };
  const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
  return res.data.map(contratista => ({
    ...contratista,
    label: contratista.razonSocial || contratista.nombreComercial,
    value: Number(contratista.id)
  }));
};

/**
 * Elimina un contratista por ID.
 * @param {number|string} id - ID del contratista a eliminar
 * @returns {Promise<void>}
 */
export const eliminarContratista = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};
