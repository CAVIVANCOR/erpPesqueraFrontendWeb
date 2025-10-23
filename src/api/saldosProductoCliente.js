// src/api/saldosProductoCliente.js
// Funciones de integración API REST para SaldosProductoCliente. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/saldos-producto-cliente`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getSaldosProductoCliente(params = {}) {
  const res = await axios.get(API_URL, { 
    headers: getAuthHeaders(),
    params: params // Permite filtrar por empresaId, clienteId, custodia, etc.
  });
  return res.data;
}

export async function getSaldosProductoClientePorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearSaldosProductoCliente(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarSaldosProductoCliente(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarSaldosProductoCliente(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene saldos generales con filtros profesionales
 * @param {Object} filtros - { empresaId, almacenId?, clienteId, custodia, soloConSaldo? }
 * @returns {Promise<Array>} Saldos generales filtrados
 */
export async function getSaldosProductoClienteConFiltros(filtros = {}) {
  const res = await axios.get(`${API_URL}/filtros`, {
    headers: getAuthHeaders(),
    params: filtros
  });
  return res.data;
}
