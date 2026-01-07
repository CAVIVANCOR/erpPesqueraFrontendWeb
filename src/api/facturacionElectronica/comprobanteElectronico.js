// src/api/facturacionElectronica/comprobanteElectronico.js
// Funciones de integración API REST para Comprobante Electrónico. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/facturacion-electronica/comprobante-electronico`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los comprobantes electrónicos
 * @returns {Promise<Array>} Lista de comprobantes
 */
export async function getComprobanteElectronico() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un comprobante electrónico por ID
 * @param {number} id - ID del comprobante
 * @returns {Promise<Object>} Comprobante electrónico
 */
export async function getComprobanteElectronicoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo comprobante electrónico
 * @param {Object} data - Datos del comprobante
 * @returns {Promise<Object>} Comprobante creado
 */
export async function createComprobanteElectronico(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un comprobante electrónico
 * @param {number} id - ID del comprobante
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} Comprobante actualizado
 */
export async function updateComprobanteElectronico(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un comprobante electrónico
 * @param {number} id - ID del comprobante
 * @returns {Promise<Object>} Confirmación
 */
export async function deleteComprobanteElectronico(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Envía un comprobante electrónico a SUNAT vía Nubefact
 * @param {number} id - ID del comprobante
 * @returns {Promise<Object>} Respuesta de SUNAT
 */
export async function enviarComprobanteASunat(id) {
  const res = await axios.post(`${API_URL}/${id}/enviar-sunat`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Consulta el estado de un comprobante en SUNAT
 * @param {number} id - ID del comprobante
 * @returns {Promise<Object>} Estado en SUNAT
 */
export async function consultarComprobanteEnSunat(id) {
  const res = await axios.get(`${API_URL}/${id}/consultar-sunat`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Anula un comprobante electrónico en SUNAT
 * @param {number} id - ID del comprobante
 * @param {string} motivo - Motivo de anulación
 * @returns {Promise<Object>} Respuesta de anulación
 */
export async function anularComprobante(id, motivo) {
  const res = await axios.post(`${API_URL}/${id}/anular`, { motivo }, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Consulta el estado de anulación de un comprobante
 * @param {number} id - ID del comprobante
 * @returns {Promise<Object>} Estado de anulación
 */
export async function consultarAnulacion(id) {
  const res = await axios.get(`${API_URL}/${id}/consultar-anulacion`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene comprobantes por empresa
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Array>} Lista de comprobantes
 */
export async function getComprobantesByEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene comprobantes por PreFactura
 * @param {number} preFacturaId - ID de la PreFactura
 * @returns {Promise<Array>} Lista de comprobantes
 */
export async function getComprobantesByPreFactura(preFacturaId) {
  const res = await axios.get(`${API_URL}/pre-factura/${preFacturaId}`, { headers: getAuthHeaders() });
  return res.data;
}

// Alias para compatibilidad
export const getAllComprobanteElectronico = getComprobanteElectronico;