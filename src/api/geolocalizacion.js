// src/api/geolocalizacion.js
// API para análisis de geolocalización de coordenadas GPS
// Documentado en español

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/geolocalizacion`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Analiza coordenadas GPS y obtiene información geográfica completa
 * @param {number} latitud - Latitud del punto
 * @param {number} longitud - Longitud del punto
 * @param {number|null} puertoSalidaId - ID del puerto de salida (opcional)
 * @returns {Promise<Object>} Información geográfica completa
 */
export const analizarCoordenadas = async (latitud, longitud, puertoSalidaId = null) => {
  try {
    const response = await axios.post(`${API_URL}/analizar`, {
      latitud,
      longitud,
      puertoSalidaId
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al analizar coordenadas:', error);
    throw error;
  }
};