/**
 * API para gestión de Documentos Requeridos de Ventas
 * Funciones de integración con endpoints REST para el catálogo maestro de documentos de exportación.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/docs-requeridas-ventas`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los documentos requeridos
 * @returns {Promise<Array>} Lista de documentos requeridos
 */
export async function getDocRequeridaVentas() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener documentos requeridos:", error);
    throw error;
  }
}

/**
 * Obtiene un documento requerido por ID
 * @param {number} id - ID del documento
 * @returns {Promise<Object>} Documento requerido
 */
export async function getDocRequeridaVentasPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener documento requerido por ID:", error);
    throw error;
  }
}

/**
 * Obtiene documentos requeridos activos
 * @returns {Promise<Array>} Lista de documentos activos
 */
export async function getDocRequeridaVentasActivos() {
  try {
    const response = await axios.get(`${API_URL}/activos`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener documentos activos:", error);
    throw error;
  }
}

/**
 * Obtiene documentos requeridos por país y producto
 * @param {number} paisId - ID del país
 * @param {number} tipoProductoId - ID del tipo de producto
 * @returns {Promise<Array>} Lista de documentos filtrados
 */
export async function getDocRequeridaVentasPorPaisYProducto(paisId, tipoProductoId) {
  try {
    const response = await axios.get(`${API_URL}/por-pais-producto/${paisId}/${tipoProductoId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener documentos por país y producto:", error);
    throw error;
  }
}

/**
 * Crea un nuevo documento requerido
 * @param {Object} data - Datos del documento
 * @returns {Promise<Object>} Documento creado
 */
export async function crearDocRequeridaVentas(data) {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear documento requerido:", error);
    throw error;
  }
}

/**
 * Actualiza un documento requerido existente
 * @param {number} id - ID del documento
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Documento actualizado
 */
export async function actualizarDocRequeridaVentas(id, data) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar documento requerido:", error);
    throw error;
  }
}

/**
 * Elimina un documento requerido
 * @param {number} id - ID del documento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarDocRequeridaVentas(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar documento requerido:", error);
    throw error;
  }
}