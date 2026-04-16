// src/api/precioCombustible.js
// Funciones de integración API REST para PrecioEntidad (Combustible). Usa JWT desde Zustand.
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

/**
 * Obtiene el precio del combustible (petróleo) vigente para una empresa y fecha
 * @param {number} entidadComercialId - ID de la empresa
 * @param {Date|string} fechaReferencia - Fecha de referencia para validar vigencia
 * @returns {Promise<Object>} { precioUnitario, monedaId, moneda: { codigo, simbolo } }
 */
export async function getPrecioCombustibleVigente(entidadComercialId, fechaReferencia) {
  const res = await axios.get(`${API_URL}/combustible`, {
    params: {
      entidadComercialId,
      fechaReferencia: new Date(fechaReferencia).toISOString(),
    },
    headers: getAuthHeaders(),
  });
  return res.data;
}