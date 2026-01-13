/**
 * API para gestión de Tarifas de Costo de Exportación por Ruta
 * Funciones de integración con endpoints REST para tarifas específicas por ruta.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tarifas-costo-exportacion-ruta`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las tarifas por ruta
 * @returns {Promise<Array>} Lista de tarifas
 */
export async function getTarifasCostoExportacionRuta() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tarifas por ruta:", error);
    throw error;
  }
}

/**
 * Obtiene una tarifa por ID
 * @param {number} id - ID de la tarifa
 * @returns {Promise<Object>} Tarifa
 */
export async function getTarifaCostoExportacionRutaPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tarifa por ID:", error);
    throw error;
  }
}

/**
 * Obtiene tarifas por costo de Incoterm
 * @param {number} costoIncotermId - ID del costo de Incoterm
 * @returns {Promise<Array>} Lista de tarifas del costo
 */
export async function getTarifasPorCostoIncoterm(costoIncotermId) {
  try {
    const response = await axios.get(`${API_URL}/costo-incoterm/${costoIncotermId}`, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tarifas por costo Incoterm:", error);
    throw error;
  }
}

/**
 * Obtiene tarifas vigentes por ruta específica
 * @param {number} costoIncotermId - ID del costo de Incoterm
 * @param {number} puertoOrigenId - ID del puerto de origen
 * @param {number} puertoDestinoId - ID del puerto de destino
 * @returns {Promise<Array>} Lista de tarifas vigentes para la ruta
 */
export async function getTarifasPorRuta(costoIncotermId, puertoOrigenId, puertoDestinoId) {
  try {
    const response = await axios.get(
      `${API_URL}/ruta/${costoIncotermId}/${puertoOrigenId}/${puertoDestinoId}`, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener tarifas por ruta específica:", error);
    throw error;
  }
}

/**
 * Crea una nueva tarifa por ruta
 * @param {Object} data - Datos de la tarifa
 * @returns {Promise<Object>} Tarifa creada
 */
export async function crearTarifaCostoExportacionRuta(data) {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear tarifa por ruta:", error);
    throw error;
  }
}

/**
 * Actualiza una tarifa existente
 * @param {number} id - ID de la tarifa
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Tarifa actualizada
 */
export async function actualizarTarifaCostoExportacionRuta(id, data) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar tarifa por ruta:", error);
    throw error;
  }
}

/**
 * Elimina una tarifa
 * @param {number} id - ID de la tarifa a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarTarifaCostoExportacionRuta(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar tarifa por ruta:", error);
    throw error;
  }
}