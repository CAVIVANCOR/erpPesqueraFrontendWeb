// src/api/precioEntidad.js
// Funciones de integración API REST para PrecioEntidad. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/precios-entidad`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPreciosEntidad() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerPreciosPorEntidad(entidadComercialId) {
  const res = await axios.get(`${API_URL}/entidad/${entidadComercialId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene el precio especial activo vigente para un cliente-producto específico.
 * @param {number} entidadComercialId - ID del cliente
 * @param {number} productoId - ID del producto
 * @returns {Promise<Object|null>} - Precio especial vigente o null
 */
export async function obtenerPrecioEspecialActivo(entidadComercialId, productoId) {
  const res = await axios.get(`${API_URL}/especial/${entidadComercialId}/${productoId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getPrecioEntidadPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearPrecioEntidad(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarPrecioEntidad(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarPrecioEntidad(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene el precio vigente para un producto en una fecha específica.
 * Busca primero precio especial del cliente, luego precio global de la empresa.
 * @param {number} empresaId - ID de la empresa
 * @param {number} empresaEntidadComercialId - ID de la entidad comercial de la empresa
 * @param {number} especieId - ID de la especie
 * @param {number|null} clienteId - ID del cliente (null para precio global)
 * @param {string} fechaDescarga - Fecha de descarga en formato ISO
 * @returns {Promise<Object|null>} - Precio vigente o null
 */
export async function obtenerPrecioVigente(empresaId, empresaEntidadComercialId, especieId, clienteId, fechaDescarga) {
  const params = new URLSearchParams({
    empresaId,
    empresaEntidadComercialId,
    especieId,
    fechaDescarga,
  });
  if (clienteId) {
    params.append('clienteId', clienteId);
  }
  const res = await axios.get(`${API_URL}/precio-vigente?${params.toString()}`, { headers: getAuthHeaders() });
  return res.data;
}
