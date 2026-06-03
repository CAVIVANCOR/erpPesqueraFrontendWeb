// src/api/tesoreria/registrarPago.js
// Funciones de integración API REST para Registrar Pagos con MovimientoCaja. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/registrar-pago`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Registrar pago de Cuenta por Cobrar (crea MovimientoCaja + PagoCuentaPorCobrar)
 * @param {Object} data - Datos del pago
 * @returns {Promise<Object>} MovimientoCaja y PagoCuentaPorCobrar creados
 */
export async function registrarPagoCuentaPorCobrar(data) {
  const res = await axios.post(`${API_URL}/cuenta-por-cobrar`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Registrar pago de Cuenta por Pagar (crea MovimientoCaja + PagoCuentaPorPagar)
 * @param {Object} data - Datos del pago
 * @returns {Promise<Object>} MovimientoCaja y PagoCuentaPorPagar creados
 */
export async function registrarPagoCuentaPorPagar(data) {
  const res = await axios.post(`${API_URL}/cuenta-por-pagar`, data, { headers: getAuthHeaders() });
  return res.data;
}
