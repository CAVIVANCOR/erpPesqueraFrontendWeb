/**
 * API para gestión de Órdenes de Trabajo de Mantenimiento
 * Funciones de integración con endpoints REST para el manejo de órdenes de trabajo.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/ot-mantenimiento`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las órdenes de trabajo de mantenimiento
 * @returns {Promise<Array>} Lista de órdenes de trabajo
 */
export async function getOrdenesTrabajoMantenimiento() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes de trabajo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getAllOTMantenimiento = getOrdenesTrabajoMantenimiento;

/**
 * Obtiene una orden de trabajo por ID
 * @param {number} id - ID de la orden de trabajo
 * @returns {Promise<Object>} Orden de trabajo
 */
export async function getOrdenTrabajoPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener orden de trabajo por ID:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getOTMantenimientoById = getOrdenTrabajoPorId;

/**
 * Crea una nueva orden de trabajo
 * @param {Object} ordenTrabajoData - Datos de la orden de trabajo
 * @returns {Promise<Object>} Orden de trabajo creada
 */
export async function crearOrdenTrabajo(ordenTrabajoData) {
  try {
    const response = await axios.post(API_URL, ordenTrabajoData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear orden de trabajo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const createOTMantenimiento = crearOrdenTrabajo;

/**
 * Actualiza una orden de trabajo existente
 * @param {number} id - ID de la orden de trabajo
 * @param {Object} ordenTrabajoData - Datos actualizados
 * @returns {Promise<Object>} Orden de trabajo actualizada
 */
export async function actualizarOrdenTrabajo(id, ordenTrabajoData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, ordenTrabajoData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar orden de trabajo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const updateOTMantenimiento = actualizarOrdenTrabajo;

/**
 * Elimina una orden de trabajo
 * @param {number} id - ID de la orden de trabajo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarOrdenTrabajo(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar orden de trabajo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const deleteOTMantenimiento = eliminarOrdenTrabajo;

/**
 * Obtiene órdenes de trabajo por estado
 * @param {number} estadoId - ID del estado
 * @returns {Promise<Array>} Lista de órdenes filtradas por estado
 */
export async function getOrdenesPorEstado(estadoId) {
  try {
    const response = await axios.get(`${API_URL}/por-estado/${estadoId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes por estado:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getOTByEstado = getOrdenesPorEstado;

/**
 * Obtiene órdenes de trabajo por empresa
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Array>} Lista de órdenes filtradas por empresa
 */
export async function getOrdenesPorEmpresa(empresaId) {
  try {
    const response = await axios.get(`${API_URL}/por-empresa/${empresaId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes por empresa:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getOTByEmpresa = getOrdenesPorEmpresa;

/**
 * Obtiene órdenes de trabajo por tipo de mantenimiento
 * @param {number} tipoMantenimientoId - ID del tipo de mantenimiento
 * @returns {Promise<Array>} Lista de órdenes filtradas por tipo
 */
export async function getOrdenesPorTipo(tipoMantenimientoId) {
  try {
    const response = await axios.get(`${API_URL}/por-tipo/${tipoMantenimientoId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes por tipo:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getOTByTipo = getOrdenesPorTipo;

/**
 * Obtiene órdenes de trabajo por responsable
 * @param {number} responsableId - ID del responsable
 * @returns {Promise<Array>} Lista de órdenes filtradas por responsable
 */
export async function getOrdenesPorResponsable(responsableId) {
  try {
    const response = await axios.get(`${API_URL}/por-responsable/${responsableId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes por responsable:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getOTByResponsable = getOrdenesPorResponsable;

/**
 * Obtiene órdenes de trabajo pendientes
 * @returns {Promise<Array>} Lista de órdenes pendientes
 */
export async function getOrdenesPendientes() {
  try {
    const response = await axios.get(`${API_URL}/pendientes`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes pendientes:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getOTPendientes = getOrdenesPendientes;

/**
 * Cambia el estado de una orden de trabajo
 * @param {number} id - ID de la orden de trabajo
 * @param {number} estadoId - Nuevo estado ID
 * @returns {Promise<Object>} Orden actualizada
 */
export async function cambiarEstadoOrden(id, estadoId) {
  try {
    const response = await axios.patch(`${API_URL}/${id}/estado`, { estadoId }, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al cambiar estado de orden:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const changeOTEstado = cambiarEstadoOrden;

/**
 * Obtiene series de documentos filtradas por empresaId y tipoDocumentoId
 * @param {number} empresaId - ID de la empresa
 * @param {number} tipoDocumentoId - ID del tipo de documento (21 para OT)
 * @returns {Promise<Array>} Lista de series filtradas
 */
export async function getSeriesDoc(empresaId, tipoDocumentoId) {
  const params = {
    ...(empresaId && { empresaId }),
    ...(tipoDocumentoId && { tipoDocumentoId })
  };
  const response = await axios.get(`${API_URL}/series-doc`, { 
    params,
    headers: getAuthHeaders() 
  });
  return response.data;
}
