/**
 * API para gestión de Tipos de Movimiento
 * Funciones de integración con endpoints REST para el manejo de tipos de movimiento en el sistema.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tipo-movimiento`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos de movimiento
 * @returns {Promise<Array>} Lista de tipos de movimiento
 */
export async function getTiposMovimiento() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de movimiento:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getAllTipoMovimiento = getTiposMovimiento;

/**
 * Crea un nuevo tipo de movimiento
 * @param {Object} tipoMovimientoData - Datos del tipo de movimiento
 * @returns {Promise<Object>} Tipo de movimiento creado
 */
export async function crearTipoMovimiento(tipoMovimientoData) {
  try {
    const response = await axios.post(API_URL, tipoMovimientoData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear tipo de movimiento:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const createTipoMovimiento = crearTipoMovimiento;

/**
 * Actualiza un tipo de movimiento existente
 * @param {number} id - ID del tipo de movimiento
 * @param {Object} tipoMovimientoData - Datos actualizados
 * @returns {Promise<Object>} Tipo de movimiento actualizado
 */
export async function actualizarTipoMovimiento(id, tipoMovimientoData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, tipoMovimientoData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar tipo de movimiento:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const updateTipoMovimiento = actualizarTipoMovimiento;

/**
 * Elimina un tipo de movimiento
 * @param {number} id - ID del tipo de movimiento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarTipoMovimiento(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar tipo de movimiento:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const deleteTipoMovimiento = eliminarTipoMovimiento;
