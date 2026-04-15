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

/**
 * Obtiene referencia costera para ubicación en alta mar
 * @param {number} latitud - Latitud del punto en el mar
 * @param {number} longitud - Longitud del punto en el mar
 * @returns {Promise<Object>} Información de referencia costera
 */
export const obtenerReferenciaCosta = async (latitud, longitud) => {
  try {
    const response = await axios.post(`${API_URL}/referencia-costa`, {
      latitud,
      longitud
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener referencia costera:', error);
    throw error;
  }
};

/**
 * Analiza coordenadas y obtiene referencia costera si está en alta mar
 * @param {number} latitud - Latitud del punto
 * @param {number} longitud - Longitud del punto
 * @param {number|null} puertoSalidaId - ID del puerto de salida (opcional)
 * @returns {Promise<Object>} Información geográfica completa con referencia costera si aplica
 */
export const analizarCoordenadasConReferencia = async (latitud, longitud, puertoSalidaId = null) => {
  try {
    // Primero analizar coordenadas normalmente
    const infoGeo = await analizarCoordenadas(latitud, longitud, puertoSalidaId);
    
    // Si está en alta mar (ciudad = N/A), obtener referencia costera
    if (infoGeo.ubicacion?.ciudad === 'N/A') {
      try {
        const referenciaCosta = await obtenerReferenciaCosta(latitud, longitud);
        return {
          ...infoGeo,
          referenciaCosta
        };
      } catch (error) {
        console.warn('No se pudo obtener referencia costera:', error);
        // Retornar info geo sin referencia si falla
        return infoGeo;
      }
    }
    
    return infoGeo;
  } catch (error) {
    console.error('Error al analizar coordenadas con referencia:', error);
    throw error;
  }
};