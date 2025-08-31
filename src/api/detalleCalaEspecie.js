/**
 * API para gestión de Detalle Cala Especie
 * Funciones de integración con endpoints REST para el manejo de detalles de cala por especie.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/detalles-cala-especie`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los detalles de cala especie
 * @returns {Promise<Array>} Lista de detalles de cala especie
 */
export async function getDetalleCalaEspecie() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalles de cala especie:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getAllDetalleCalaEspecie = getDetalleCalaEspecie;

/**
 * Obtiene un detalle de cala especie por ID
 * @param {number} id - ID del detalle de cala especie
 * @returns {Promise<Object>} Detalle de cala especie
 */
export async function getDetalleCalaEspeciePorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalle de cala especie por ID:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getDetalleCalaEspecieById = getDetalleCalaEspeciePorId;

/**
 * Crea un nuevo detalle de cala especie
 * @param {Object} detalleCalaEspecieData - Datos del detalle de cala especie
 * @returns {Promise<Object>} Detalle de cala especie creado
 */
export async function crearDetalleCalaEspecie(detalleCalaEspecieData) {
  try {
    const response = await axios.post(API_URL, detalleCalaEspecieData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear detalle de cala especie:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const createDetalleCalaEspecie = crearDetalleCalaEspecie;

/**
 * Actualiza un detalle de cala especie existente
 * @param {number} id - ID del detalle de cala especie
 * @param {Object} detalleCalaEspecieData - Datos actualizados
 * @returns {Promise<Object>} Detalle de cala especie actualizado
 */
export async function actualizarDetalleCalaEspecie(id, detalleCalaEspecieData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, detalleCalaEspecieData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar detalle de cala especie:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const updateDetalleCalaEspecie = actualizarDetalleCalaEspecie;

/**
 * Elimina un detalle de cala especie
 * @param {number} id - ID del detalle de cala especie a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarDetalleCalaEspecie(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar detalle de cala especie:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const deleteDetalleCalaEspecie = eliminarDetalleCalaEspecie;

/**
 * Obtiene detalles de cala especie por cala ID
 * @param {number} calaId - ID de la cala
 * @returns {Promise<Array>} Lista de detalles de cala especie filtrados por cala
 */
export async function getDetalleCalaEspeciePorCala(calaId) {
  try {
    const response = await axios.get(`${API_URL}/por-cala/${calaId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalles de cala especie por cala:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getDetalleCalaEspecieByCala = getDetalleCalaEspeciePorCala;
