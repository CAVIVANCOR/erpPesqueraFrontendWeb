// src/api/tipoAlmacenamiento.js
// API para gestión de Tipos de Almacenamiento
// Cumple el patrón estándar ERP Megui

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-almacenamiento`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos de almacenamiento
 * @returns {Promise<Array>} Lista de tipos de almacenamiento
 */
export const getTiposAlmacenamiento = async () => {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de almacenamiento:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de almacenamiento por ID
 * @param {number} id - ID del tipo de almacenamiento
 * @returns {Promise<Object>} Tipo de almacenamiento
 */
export const getTipoAlmacenamientoPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipo de almacenamiento:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de almacenamiento
 * @param {Object} data - Datos del tipo de almacenamiento
 * @returns {Promise<Object>} Tipo de almacenamiento creado
 */
export const crearTipoAlmacenamiento = async (data) => {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al crear tipo de almacenamiento:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de almacenamiento
 * @param {number} id - ID del tipo de almacenamiento
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Tipo de almacenamiento actualizado
 */
export const actualizarTipoAlmacenamiento = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar tipo de almacenamiento:', error);
    throw error;
  }
};

/**
 * Elimina un tipo de almacenamiento
 * @param {number} id - ID del tipo de almacenamiento
 * @returns {Promise<void>}
 */
export const eliminarTipoAlmacenamiento = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  } catch (error) {
    console.error('Error al eliminar tipo de almacenamiento:', error);
    throw error;
  }
};
