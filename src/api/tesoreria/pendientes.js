// src/api/tesoreria/pendientes.js
// Funciones de integración API REST para Documentos Pendientes. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/pendientes`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtener lista de documentos pendientes con filtros
 * @param {Object} filtros - { empresaId, tipo, vencimiento, monedaId }
 * @returns {Promise<Array>} Lista de documentos pendientes
 */
export async function getPendientes(filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.empresaId) params.append('empresaId', filtros.empresaId);
  if (filtros.tipo) params.append('tipo', filtros.tipo);
  if (filtros.vencimiento) params.append('vencimiento', filtros.vencimiento);
  if (filtros.monedaId) params.append('monedaId', filtros.monedaId);
  
  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener resumen de pendientes (totales por moneda y tipo)
 * @param {Number} empresaId - ID de empresa (opcional)
 * @returns {Promise<Object>} Resumen con totales
 */
export async function getResumenPendientes(empresaId = null) {
  const params = empresaId ? `?empresaId=${empresaId}` : '';
  const res = await axios.get(`${API_URL}/resumen${params}`, { headers: getAuthHeaders() });
  return res.data;
}
