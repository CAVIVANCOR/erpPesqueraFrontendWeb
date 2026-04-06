// src/api/contabilidad/kardexValorizado.js
// API para generación de Kardex Valorizado mensual
import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/kardex-valorizado`;

/**
 * Obtiene el token JWT desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Genera el Kardex Valorizado mensual y crea el asiento contable correspondiente
 * @param {Object} params - Parámetros de generación
 * @param {number} params.empresaId - ID de la empresa
 * @param {number} params.anio - Año del período
 * @param {number} params.mes - Mes del período (1-12)
 * @returns {Promise<Object>} Resultado con el asientoId generado
 */
export async function generarKardexValorizado({ empresaId, anio, mes }) {
  const res = await axios.post(
    `${API_URL}/generar`,
    { empresaId, anio, mes },
    { headers: getAuthHeaders() }
  );
  return res.data.data;
}

/**
 * Obtiene el historial de generaciones de Kardex Valorizado
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Array>} Lista de generaciones
 */
export async function getHistorialKardexValorizado(empresaId) {
  const res = await axios.get(`${API_URL}/historial/${empresaId}`, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
}
