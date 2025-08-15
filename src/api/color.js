/**
 * API para gestión de Colores
 * Implementa todas las operaciones CRUD con manejo de errores y autenticación JWT.
 * Endpoints: GET /api/colores, POST /api/colores, PUT /api/colores/:id, DELETE /api/colores/:id
 * Patrón aplicado: Axios con interceptores, manejo de errores HTTP, normalización de datos.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/colores`;

/**
 * Configuración de headers con autenticación JWT
 * Obtiene el token desde el store global de autenticación
 */
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Obtiene todos los colores
 * @returns {Promise<Array>} Lista de colores
 */
export const getColores = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al obtener colores:", error);
    throw error;
  }
};

/**
 * Obtiene un color por ID
 * @param {number} id - ID del color
 * @returns {Promise<Object>} Datos del color
 */
export const getColorPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener color ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo color
 * @param {Object} color - Datos del color
 * @param {string} color.nombre - Nombre del color (máximo 80 caracteres)
 * @returns {Promise<Object>} Color creado
 */
export const crearColor = async (color) => {
  try {
    // Normalización de datos según reglas ERP Megui
    const datosNormalizados = {
      nombre: color.nombre?.toUpperCase().trim(),
    };

    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al crear color:", error);
    throw error;
  }
};

/**
 * Actualiza un color existente
 * @param {number} id - ID del color
 * @param {Object} color - Datos actualizados del color
 * @param {string} color.nombre - Nombre del color (máximo 80 caracteres)
 * @returns {Promise<Object>} Color actualizado
 */
export const actualizarColor = async (id, color) => {
  try {
    // Normalización de datos según reglas ERP Megui
    const datosNormalizados = {
      nombre: color.nombre?.toUpperCase().trim(),
    };

    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar color ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un color
 * @param {number} id - ID del color a eliminar
 * @returns {Promise<void>}
 */
export const eliminarColor = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  } catch (error) {
    console.error(`Error al eliminar color ${id}:`, error);
    throw error;
  }
};
