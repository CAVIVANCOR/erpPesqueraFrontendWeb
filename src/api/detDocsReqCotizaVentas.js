/**
 * API para DetDocsReqCotizaVentas - Detalle de Documentos Requeridos para Cotizaciones de Ventas
 * Maneja la gestión de documentos específicos requeridos para procesar cotizaciones de ventas.
 * Incluye funciones CRUD, filtros especializados y validaciones de negocio.
 * 
 * Funcionalidades principales:
 * - CRUD completo de detalles de documentos requeridos
 * - Filtros por cotización, tipo documento, estado de entrega
 * - Validaciones de documentos obligatorios y opcionales
 * - Gestión de fechas de vencimiento y entrega
 * - Manejo profesional de errores y autenticación JWT
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/det-docs-req-cotiza-ventas`;

/**
 * Configuración de headers con autenticación JWT
 * Obtiene el token desde el store global de autenticación
 */
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Obtiene todos los detalles de documentos requeridos
 * @returns {Promise<Array>} Lista de detalles de documentos
 */
export const getDetallesDocsReqCotizaVentas = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de documentos requeridos:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de documento requerido por ID
 * @param {number} id - ID del detalle de documento
 * @returns {Promise<Object>} Detalle de documento encontrado
 */
export const getDetalleDocReqPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle de documento requerido ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de documento requerido
 * @param {Object} detalleDoc - Datos del detalle de documento
 * @returns {Promise<Object>} Detalle de documento creado
 */
export const crearDetalleDocReqCotizaVentas = async (detalleDoc) => {
  try {
    // Enviar datos sin agregar campos inexistentes
    // Solo normalizar fechas si existen
    const datosLimpios = {
      ...detalleDoc,
      fechaEmision: detalleDoc.fechaEmision ? new Date(detalleDoc.fechaEmision).toISOString() : null,
      fechaVencimiento: detalleDoc.fechaVencimiento ? new Date(detalleDoc.fechaVencimiento).toISOString() : null,
      fechaVerificacion: detalleDoc.fechaVerificacion ? new Date(detalleDoc.fechaVerificacion).toISOString() : null,
    };

    const response = await axios.post(API_URL, datosLimpios, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de documento requerido:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de documento requerido existente
 * @param {number} id - ID del detalle de documento
 * @param {Object} detalleDoc - Datos actualizados
 * @returns {Promise<Object>} Detalle de documento actualizado
 */
export const actualizarDetalleDocReqCotizaVentas = async (id, detalleDoc) => {
  try {
    // Enviar datos sin agregar campos inexistentes
    // Solo normalizar fechas si existen
    const datosLimpios = {
      ...detalleDoc,
      fechaEmision: detalleDoc.fechaEmision ? new Date(detalleDoc.fechaEmision).toISOString() : null,
      fechaVencimiento: detalleDoc.fechaVencimiento ? new Date(detalleDoc.fechaVencimiento).toISOString() : null,
      fechaVerificacion: detalleDoc.fechaVerificacion ? new Date(detalleDoc.fechaVerificacion).toISOString() : null,
    };

    const response = await axios.put(`${API_URL}/${id}`, datosLimpios, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle de documento requerido ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un detalle de documento requerido
 * @param {number} id - ID del detalle de documento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleDocReqCotizaVentas = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle de documento requerido ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene documentos requeridos por cotización de venta
 * @param {number} cotizacionVentaId - ID de la cotización de venta
 * @returns {Promise<Array>} Lista de documentos filtrados
 */
export const getDocumentosPorCotizacion = async (cotizacionVentaId) => {
  try {
    const response = await axios.get(`${API_URL}/cotizacion/${cotizacionVentaId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener documentos por cotización ${cotizacionVentaId}:`, error);
    throw error;
  }
};

/**
 * Obtiene documentos por tipo específico
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Array>} Lista de documentos filtrados
 */
export const getDocumentosPorTipo = async (tipoDocumentoId) => {
  try {
    const response = await axios.get(`${API_URL}/tipo-documento/${tipoDocumentoId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener documentos por tipo ${tipoDocumentoId}:`, error);
    throw error;
  }
};

/**
 * Obtiene documentos por estado de entrega
 * @param {boolean} entregado - Estado de entrega (true/false)
 * @returns {Promise<Array>} Lista de documentos filtrados
 */
export const getDocumentosPorEstadoEntrega = async (entregado) => {
  try {
    const response = await axios.get(`${API_URL}/estado-entrega/${entregado}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener documentos por estado de entrega ${entregado}:`, error);
    throw error;
  }
};

/**
 * Obtiene documentos obligatorios pendientes
 * @returns {Promise<Array>} Lista de documentos obligatorios no entregados
 */
export const getDocumentosObligatoriosPendientes = async () => {
  try {
    const response = await axios.get(`${API_URL}/obligatorios-pendientes`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener documentos obligatorios pendientes:', error);
    throw error;
  }
};

/**
 * Marca un documento como entregado
 * @param {number} id - ID del detalle de documento
 * @param {string} urlArchivo - URL del archivo entregado
 * @param {string} observaciones - Observaciones de la entrega
 * @returns {Promise<Object>} Documento actualizado
 */
export const marcarDocumentoEntregado = async (id, urlArchivo = '', observaciones = '') => {
  try {
    const datosActualizacion = {
      entregado: true,
      fechaEntrega: new Date().toISOString(),
      urlArchivo: urlArchivo.trim(),
      observaciones: observaciones.trim()
    };
    const response = await axios.patch(`${API_URL}/${id}/entregar`, datosActualizacion, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al marcar documento ${id} como entregado:`, error);
    throw error;
  }
};

/**
 * Valida un documento entregado
 * @param {number} id - ID del detalle de documento
 * @param {number} validadorId - ID del validador
 * @param {string} observaciones - Observaciones de validación
 * @returns {Promise<Object>} Documento validado
 */
export const validarDocumento = async (id, validadorId, observaciones = '') => {
  try {
    const datosValidacion = {
      validado: true,
      fechaValidacion: new Date().toISOString(),
      validadoPorId: Number(validadorId),
      observaciones: observaciones.trim()
    };
    const response = await axios.patch(`${API_URL}/${id}/validar`, datosValidacion, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al validar documento ${id}:`, error);
    throw error;
  }
};

/**
 * Sube archivo para un documento
 * @param {number} id - ID del detalle de documento
 * @param {File} archivo - Archivo a subir
 * @returns {Promise<Object>} URL del archivo subido
 */
export const subirArchivoDocumento = async (id, archivo) => {
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await axios.post(`${API_URL}/${id}/archivo`, formData, {
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error al subir archivo para documento ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de documentos requeridos
 * @returns {Promise<Object>} Estadísticas de documentos
 */
export const getEstadisticasDocumentos = async () => {
  try {
    const response = await axios.get(`${API_URL}/estadisticas`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de documentos:', error);
    throw error;
  }
};

/**
 * Obtiene documentos próximos a vencer
 * @param {number} diasAnticipacion - Días de anticipación para alertas
 * @returns {Promise<Array>} Lista de documentos próximos a vencer
 */
export const getDocumentosProximosVencer = async (diasAnticipacion = 7) => {
  try {
    const response = await axios.get(`${API_URL}/proximos-vencer`, {
      ...getAuthHeaders(),
      params: { diasAnticipacion }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener documentos próximos a vencer:', error);
    throw error;
  }
};
