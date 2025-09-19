// src/api/tripulanteFaena.js
// Funciones de integración API REST para TripulanteFaena. Usa JWT desde useAuthStore.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/tripulantes-faena`;

/**
 * Obtiene el token JWT profesionalmente desde useAuthStore
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tripulantes de faena
 */
export const getTripulantesFaena = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tripulantes de faena:", error);
    throw error;
  }
};

/**
 * Obtiene un tripulante de faena por ID
 */
export const getTripulanteFaenaById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tripulante de faena:", error);
    throw error;
  }
};

/**
 * Obtiene tripulantes de faena por faenaPescaId
 */
export const getTripulantesPorFaena = async (faenaPescaId) => {
  try {
    const response = await axios.get(`${API_URL}/faena/${faenaPescaId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tripulantes por faena:", error);
    throw error;
  }
};

/**
 * Actualiza un tripulante de faena (solo observaciones)
 */
export const actualizarTripulanteFaena = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar tripulante de faena:", error);
    throw error;
  }
};
