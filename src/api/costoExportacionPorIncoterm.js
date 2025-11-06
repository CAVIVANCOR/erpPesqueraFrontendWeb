/**
 * API para gestión de Costos de Exportación por Incoterm
 * Funciones de integración con endpoints REST para configuración de costos aplicables por Incoterm.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/costo-exportacion-por-incoterm`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los costos de exportación por Incoterm
 * @returns {Promise<Array>} Lista de costos
 */
export async function getCostosExportacionPorIncoterm() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costos de exportación por Incoterm:", error);
    throw error;
  }
}

/**
 * Obtiene un costo por ID
 * @param {number} id - ID del costo
 * @returns {Promise<Object>} Costo
 */
export async function getCostoExportacionPorIncotermPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costo por ID:", error);
    throw error;
  }
}

/**
 * Obtiene costos por Incoterm
 * @param {number} incotermId - ID del Incoterm
 * @returns {Promise<Array>} Lista de costos del Incoterm
 */
export async function getCostosExportacionPorIncotermPorIncoterm(incotermId) {
  try {
    const response = await axios.get(`${API_URL}/por-incoterm/${incotermId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costos por Incoterm:", error);
    throw error;
  }
}

/**
 * Obtiene costos del vendedor por Incoterm
 * @param {number} incotermId - ID del Incoterm
 * @returns {Promise<Array>} Lista de costos a cargo del vendedor
 */
export async function getCostosVendedorPorIncoterm(incotermId) {
  try {
    const response = await axios.get(`${API_URL}/vendedor/${incotermId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costos del vendedor por Incoterm:", error);
    throw error;
  }
}

/**
 * Crea un nuevo costo de exportación por Incoterm
 * @param {Object} data - Datos del costo
 * @returns {Promise<Object>} Costo creado
 */
export async function crearCostoExportacionPorIncoterm(data) {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear costo de exportación por Incoterm:", error);
    throw error;
  }
}

/**
 * Actualiza un costo existente
 * @param {number} id - ID del costo
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Costo actualizado
 */
export async function actualizarCostoExportacionPorIncoterm(id, data) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar costo de exportación por Incoterm:", error);
    throw error;
  }
}

/**
 * Elimina un costo
 * @param {number} id - ID del costo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarCostoExportacionPorIncoterm(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar costo de exportación por Incoterm:", error);
    throw error;
  }
}