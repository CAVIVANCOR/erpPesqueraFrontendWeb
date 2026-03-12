// src/api/comisionFidelizacion.js
// Funciones de integración API REST para ComisionFidelizacion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/comisiones-fidelizacion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Generar comisiones de fidelización para una temporada
 * Elimina comisiones previas y genera nuevas basadas en descargas
 * @param {number} temporadaId - ID de la temporada de pesca
 * @returns {Promise<Object>} Resultado con estadísticas de generación
 */
export async function generarComisionesFidelizacion(temporadaId) {
  const res = await axios.post(
    `${API_URL}/generar/${temporadaId}`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Obtener comisiones generadas de una temporada
 * @param {number} temporadaId - ID de la temporada de pesca
 * @returns {Promise<Array>} Lista de comisiones con información de cliente y personal
 */
export async function getComisionesPorTemporada(temporadaId) {
  const res = await axios.get(
    `${API_URL}/temporada/${temporadaId}`,
    { headers: getAuthHeaders() }
  );
  return res.data;
}