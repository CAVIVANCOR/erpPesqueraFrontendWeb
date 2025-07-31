/**
 * API para gestión de Tipos de Equipo
 * Funciones de integración con endpoints REST para el manejo de tipos de equipo en el sistema.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-equipo`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos de equipo
 * @returns {Promise<Array>} Lista de tipos de equipo
 */
export async function getTiposEquipo() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de equipo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getAllTipoEquipo = getTiposEquipo;

/**
 * Crea un nuevo tipo de equipo
 * @param {Object} tipoEquipoData - Datos del tipo de equipo
 * @returns {Promise<Object>} Tipo de equipo creado
 */
export async function crearTipoEquipo(tipoEquipoData) {
  try {
    const response = await axios.post(API_URL, tipoEquipoData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear tipo de equipo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const createTipoEquipo = crearTipoEquipo;

/**
 * Actualiza un tipo de equipo existente
 * @param {number} id - ID del tipo de equipo
 * @param {Object} tipoEquipoData - Datos actualizados
 * @returns {Promise<Object>} Tipo de equipo actualizado
 */
export async function actualizarTipoEquipo(id, tipoEquipoData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, tipoEquipoData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar tipo de equipo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const updateTipoEquipo = actualizarTipoEquipo;

/**
 * Elimina un tipo de equipo
 * @param {number} id - ID del tipo de equipo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarTipoEquipo(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar tipo de equipo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const deleteTipoEquipo = eliminarTipoEquipo;
