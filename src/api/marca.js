// src/api/marca.js
// API para gestión de Marcas
// Cumple el patrón estándar ERP Megui
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/marcas`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las marcas
 * @returns {Promise<Array>} Lista de marcas
 */
export const getMarcas = async () => {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    throw error;
  }
};

/**
 * Obtiene una marca por ID
 * @param {number} id - ID de la marca
 * @returns {Promise<Object>} Marca
 */
export const getMarcaPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener marca:', error);
    throw error;
  }
};

/**
 * Crea una nueva marca
 * @param {Object} data - Datos de la marca
 * @returns {Promise<Object>} Marca creada
 */
export const crearMarca = async (data) => {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al crear marca:', error);
    throw error;
  }
};

/**
 * Actualiza una marca
 * @param {number} id - ID de la marca
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Marca actualizada
 */
export const actualizarMarca = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    throw error;
  }
};

/**
 * Elimina una marca
 * @param {number} id - ID de la marca
 * @returns {Promise<void>}
 */
export const eliminarMarca = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  } catch (error) {
    console.error('Error al eliminar marca:', error);
    throw error;
  }
};
