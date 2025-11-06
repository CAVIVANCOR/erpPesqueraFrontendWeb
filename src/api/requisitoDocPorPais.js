/**
 * API para gestión de Requisitos de Documentos por País
 * Funciones de integración con endpoints REST para requisitos específicos por país y tipo de producto.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/requisito-doc-por-pais`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los requisitos de documentos por país
 * @returns {Promise<Array>} Lista de requisitos
 */
export async function getRequisitosDocPorPais() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener requisitos de documentos por país:", error);
    throw error;
  }
}

/**
 * Obtiene un requisito por ID
 * @param {number} id - ID del requisito
 * @returns {Promise<Object>} Requisito
 */
export async function getRequisitoDocPorPaisPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener requisito por ID:", error);
    throw error;
  }
}

/**
 * Obtiene requisitos por país
 * @param {number} paisId - ID del país
 * @returns {Promise<Array>} Lista de requisitos del país
 */
export async function getRequisitosDocPorPaisPorPais(paisId) {
  try {
    const response = await axios.get(`${API_URL}/por-pais/${paisId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener requisitos por país:", error);
    throw error;
  }
}

/**
 * Obtiene requisitos por documento
 * @param {number} docRequeridaVentasId - ID del documento requerido
 * @returns {Promise<Array>} Lista de requisitos del documento
 */
export async function getRequisitosDocPorPaisPorDocumento(docRequeridaVentasId) {
  try {
    const response = await axios.get(`${API_URL}/por-documento/${docRequeridaVentasId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener requisitos por documento:", error);
    throw error;
  }
}

/**
 * Crea un nuevo requisito de documento por país
 * @param {Object} data - Datos del requisito
 * @returns {Promise<Object>} Requisito creado
 */
export async function crearRequisitoDocPorPais(data) {
  try {
    const response = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear requisito de documento por país:", error);
    throw error;
  }
}

/**
 * Actualiza un requisito existente
 * @param {number} id - ID del requisito
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Requisito actualizado
 */
export async function actualizarRequisitoDocPorPais(id, data) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar requisito de documento por país:", error);
    throw error;
  }
}

/**
 * Elimina un requisito
 * @param {number} id - ID del requisito a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarRequisitoDocPorPais(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar requisito de documento por país:", error);
    throw error;
  }
}