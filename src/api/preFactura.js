/**
 * API para gestión de Pre-Facturas
 * Funciones de integración con endpoints REST para el manejo de pre-facturas en el sistema.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pre-facturas`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las pre-facturas
 * @returns {Promise<Array>} Lista de pre-facturas
 */
export async function getPreFacturas() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getAllPreFactura = getPreFacturas;

/**
 * Obtiene una pre-factura por ID
 * @param {number} id - ID de la pre-factura
 * @returns {Promise<Object>} Pre-factura
 */
export async function getPreFacturaPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-factura por ID:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getPreFacturaById = getPreFacturaPorId;

/**
 * Crea una nueva pre-factura
 * @param {Object} preFacturaData - Datos de la pre-factura
 * @returns {Promise<Object>} Pre-factura creada
 */
export async function crearPreFactura(preFacturaData) {
  try {
    const response = await axios.post(API_URL, preFacturaData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear pre-factura:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const createPreFactura = crearPreFactura;

/**
 * Actualiza una pre-factura existente
 * @param {number} id - ID de la pre-factura
 * @param {Object} preFacturaData - Datos actualizados
 * @returns {Promise<Object>} Pre-factura actualizada
 */
export async function actualizarPreFactura(id, preFacturaData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, preFacturaData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar pre-factura:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const updatePreFactura = actualizarPreFactura;

/**
 * Elimina una pre-factura
 * @param {number} id - ID de la pre-factura a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarPreFactura(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar pre-factura:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const deletePreFactura = eliminarPreFactura;

/**
 * Obtiene pre-facturas por cliente
 * @param {number} clienteId - ID del cliente
 * @returns {Promise<Array>} Lista de pre-facturas del cliente
 */
export async function getPreFacturasPorCliente(clienteId) {
  try {
    const response = await axios.get(`${API_URL}/por-cliente/${clienteId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas por cliente:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getPreFacturasByCliente = getPreFacturasPorCliente;

/**
 * Obtiene pre-facturas por estado
 * @param {string} estado - Estado de la pre-factura
 * @returns {Promise<Array>} Lista de pre-facturas filtradas por estado
 */
export async function getPreFacturasPorEstado(estado) {
  try {
    const response = await axios.get(`${API_URL}/por-estado/${estado}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas por estado:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const getPreFacturasByEstado = getPreFacturasPorEstado;

/**
 * Convierte una pre-factura a factura
 * @param {number} id - ID de la pre-factura
 * @returns {Promise<Object>} Factura generada
 */
export async function convertirPreFacturaAFactura(id) {
  try {
    const response = await axios.post(`${API_URL}/${id}/convertir-factura`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al convertir pre-factura a factura:", error);
    throw error;
  }
}

// Alias en inglés para compatibilidad
export const convertPreFacturaToFactura = convertirPreFacturaAFactura;

/**
 * Obtiene series de documentos filtradas por empresaId y tipoDocumentoId
 * @param {number} empresaId - ID de la empresa
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Array>} Lista de series de documentos
 */
export async function getSeriesDoc(empresaId, tipoDocumentoId) {
  try {
    const params = {
      ...(empresaId && { empresaId }),
      ...(tipoDocumentoId && { tipoDocumentoId })
    };
    const response = await axios.get(`${API_URL}/series-doc`, { 
      params,
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener series de documentos:", error);
    throw error;
  }
}
