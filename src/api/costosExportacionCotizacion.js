/**
 * API para gestión de Costos de Exportación de Cotización
 * Funciones de integración con endpoints REST para tracking de costos estimados vs reales.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/costos-exportacion-cotizacion`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los costos de exportación de cotizaciones
 * @returns {Promise<Array>} Lista de costos
 */
export async function getCostosExportacionCotizacion() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costos de exportación de cotizaciones:", error);
    throw error;
  }
}

/**
 * Obtiene un costo por ID
 * @param {number} id - ID del costo
 * @returns {Promise<Object>} Costo
 */
export async function getCostoExportacionCotizacionPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costo por ID:", error);
    throw error;
  }
}

/**
 * Obtiene costos por cotización
 * @param {number} cotizacionVentasId - ID de la cotización
 * @returns {Promise<Array>} Lista de costos de la cotización
 */
export async function getCostosExportacionPorCotizacion(cotizacionVentasId) {
  try {
    const response = await axios.get(`${API_URL}/por-cotizacion/${cotizacionVentasId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costos por cotización:", error);
    throw error;
  }
}

/**
 * Obtiene costos con variación (estimado vs real)
 * @param {number} cotizacionVentasId - ID de la cotización
 * @returns {Promise<Array>} Lista de costos con análisis de variación
 */
export async function getCostosConVariacion(cotizacionVentasId) {
  try {
    const response = await axios.get(`${API_URL}/con-variacion/${cotizacionVentasId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener costos con variación:", error);
    throw error;
  }
}

/**
 * Crea un nuevo costo de exportación de cotización
 * @param {Object} data - Datos del costo
 * @returns {Promise<Object>} Costo creado
 */
export async function crearCostoExportacionCotizacion(data) {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear costo de exportación de cotización:", error);
    throw error;
  }
}

/**
 * Actualiza un costo existente
 * @param {number} id - ID del costo
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Costo actualizado
 */
export async function actualizarCostoExportacionCotizacion(id, data) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar costo de exportación de cotización:", error);
    throw error;
  }
}

/**
 * Registra el monto real de un costo
 * @param {number} id - ID del costo
 * @param {Object} data - Datos del monto real
 * @returns {Promise<Object>} Costo actualizado con monto real
 */
export async function registrarMontoReal(id, data) {
  try {
    const response = await axios.patch(`${API_URL}/${id}/monto-real`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al registrar monto real:", error);
    throw error;
  }
}

/**
 * Elimina un costo
 * @param {number} id - ID del costo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarCostoExportacionCotizacion(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar costo de exportación de cotización:", error);
    throw error;
  }
}