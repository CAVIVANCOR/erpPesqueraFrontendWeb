// src/api/tesoreria/saldosCuentas.js
// Funciones de integración API REST para Saldos de Cuentas Corrientes. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/saldos-cuentas`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtener lista de cuentas corrientes con saldos
 * @param {Object} filtros - { empresaId, monedaId, soloActivas }
 * @returns {Promise<Array>} Lista de cuentas con saldos
 */
export async function getSaldosCuentas(filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.empresaId) params.append('empresaId', filtros.empresaId);
  if (filtros.monedaId) params.append('monedaId', filtros.monedaId);
  if (filtros.soloActivas !== undefined) params.append('soloActivas', filtros.soloActivas);
  
  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener saldo consolidado en USD
 * @param {Number} empresaId - ID de empresa (opcional)
 * @returns {Promise<Object>} Total consolidado con desglose
 */
export async function getSaldoConsolidado(empresaId = null) {
  const params = empresaId ? `?empresaId=${empresaId}` : '';
  const res = await axios.get(`${API_URL}/consolidado${params}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener detalle de movimientos de una cuenta específica
 * @param {Number} cuentaCorrienteId - ID de cuenta corriente
 * @param {Number} limite - Cantidad de movimientos (default: 10)
 * @returns {Promise<Object>} Cuenta con movimientos
 */
export async function getDetalleCuenta(cuentaCorrienteId, limite = 10) {
  const res = await axios.get(`${API_URL}/${cuentaCorrienteId}/detalle?limite=${limite}`, { headers: getAuthHeaders() });
  return res.data;
}
