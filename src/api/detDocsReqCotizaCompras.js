/**
 * API profesional para DetDocsReqCotizaCompras - ERP Megui
 * 
 * Gestiona los documentos requeridos para cotizaciones de compras del sistema.
 * Implementa el patrón estándar ERP Megui con:
 * - Autenticación JWT desde Zustand
 * - Funciones exportadas en español
 * - Manejo profesional de errores
 * - Documentación técnica en español
 * - Normalización de datos según reglas ERP Megui
 * - Endpoints RESTful consistentes
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * Implementa la regla ERP Megui de acceso centralizado al token JWT
 * @returns {string} Token JWT para autenticación
 */
const obtenerTokenAuth = () => {
  const { token } = useAuthStore.getState();
  return token;
};

/**
 * Obtiene todos los detalles de documentos requeridos para cotizaciones de compras
 * @returns {Promise<Array>} Lista de documentos con datos normalizados
 */
export const obtenerDetallesDocsReqCotizaCompras = async () => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      cotizacionCompraId: Number(detalle.cotizacionCompraId),
      tipoDocumentoId: Number(detalle.tipoDocumentoId),
      validadoPorId: detalle.validadoPorId ? Number(detalle.validadoPorId) : null,
      obligatorio: Boolean(detalle.obligatorio),
      entregado: Boolean(detalle.entregado),
      validado: Boolean(detalle.validado)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles de documentos requeridos para compras:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de documento requerido por ID
 * @param {number} id - ID del detalle de documento
 * @returns {Promise<Object>} Detalle de documento con datos normalizados
 */
export const obtenerDetalleDocReqCotizaCompraPorId = async (id) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const detalleNormalizado = {
      ...response.data,
      id: Number(response.data.id),
      cotizacionCompraId: Number(response.data.cotizacionCompraId),
      tipoDocumentoId: Number(response.data.tipoDocumentoId),
      validadoPorId: response.data.validadoPorId ? Number(response.data.validadoPorId) : null,
      obligatorio: Boolean(response.data.obligatorio),
      entregado: Boolean(response.data.entregado),
      validado: Boolean(response.data.validado)
    };

    return detalleNormalizado;
  } catch (error) {
    console.error('Error al obtener detalle de documento requerido por ID:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de documento requerido para cotización de compra
 * @param {Object} datosDetalle - Datos del detalle de documento
 * @returns {Promise<Object>} Detalle de documento creado
 */
export const crearDetalleDocReqCotizaCompra = async (datosDetalle) => {
  try {
    const token = obtenerTokenAuth();
    
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...datosDetalle,
      cotizacionCompraId: Number(datosDetalle.cotizacionCompraId),
      tipoDocumentoId: Number(datosDetalle.tipoDocumentoId),
      obligatorio: Boolean(datosDetalle.obligatorio),
      numeroDocumento: datosDetalle.numeroDocumento?.trim() || null,
      fechaVencimiento: datosDetalle.fechaVencimiento ? new Date(datosDetalle.fechaVencimiento).toISOString() : null,
      fechaEntrega: datosDetalle.fechaEntrega ? new Date(datosDetalle.fechaEntrega).toISOString() : null,
      fechaValidacion: datosDetalle.fechaValidacion ? new Date(datosDetalle.fechaValidacion).toISOString() : null,
      observaciones: datosDetalle.observaciones?.trim() || null,
      urlArchivo: datosDetalle.urlArchivo?.trim() || null,
      validadoPorId: datosDetalle.validadoPorId ? Number(datosDetalle.validadoPorId) : null,
      entregado: Boolean(datosDetalle.entregado),
      validado: Boolean(datosDetalle.validado)
    };

    const response = await axios.post(`${API_URL}/det-docs-req-cotiza-compras`, datosNormalizados, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de documento requerido para compra:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de documento requerido existente
 * @param {number} id - ID del detalle de documento
 * @param {Object} datosDetalle - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de documento actualizado
 */
export const actualizarDetalleDocReqCotizaCompra = async (id, datosDetalle) => {
  try {
    const token = obtenerTokenAuth();
    
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...datosDetalle,
      cotizacionCompraId: Number(datosDetalle.cotizacionCompraId),
      tipoDocumentoId: Number(datosDetalle.tipoDocumentoId),
      obligatorio: Boolean(datosDetalle.obligatorio),
      numeroDocumento: datosDetalle.numeroDocumento?.trim() || null,
      fechaVencimiento: datosDetalle.fechaVencimiento ? new Date(datosDetalle.fechaVencimiento).toISOString() : null,
      fechaEntrega: datosDetalle.fechaEntrega ? new Date(datosDetalle.fechaEntrega).toISOString() : null,
      fechaValidacion: datosDetalle.fechaValidacion ? new Date(datosDetalle.fechaValidacion).toISOString() : null,
      observaciones: datosDetalle.observaciones?.trim() || null,
      urlArchivo: datosDetalle.urlArchivo?.trim() || null,
      validadoPorId: datosDetalle.validadoPorId ? Number(datosDetalle.validadoPorId) : null,
      entregado: Boolean(datosDetalle.entregado),
      validado: Boolean(datosDetalle.validado)
    };

    const response = await axios.put(`${API_URL}/det-docs-req-cotiza-compras/${id}`, datosNormalizados, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de documento requerido para compra:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de documento requerido
 * @param {number} id - ID del detalle de documento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleDocReqCotizaCompra = async (id) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.delete(`${API_URL}/det-docs-req-cotiza-compras/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de documento requerido para compra:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de documentos filtrados por cotización de compra
 * @param {number} cotizacionCompraId - ID de la cotización de compra
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const obtenerDetallesPorCotizacionCompra = async (cotizacionCompraId) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras/por-cotizacion/${cotizacionCompraId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      cotizacionCompraId: Number(detalle.cotizacionCompraId),
      tipoDocumentoId: Number(detalle.tipoDocumentoId),
      validadoPorId: detalle.validadoPorId ? Number(detalle.validadoPorId) : null,
      obligatorio: Boolean(detalle.obligatorio),
      entregado: Boolean(detalle.entregado),
      validado: Boolean(detalle.validado)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles por cotización de compra:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de documentos filtrados por tipo de documento
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const obtenerDetallesPorTipoDocumento = async (tipoDocumentoId) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras/por-tipo-documento/${tipoDocumentoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      cotizacionCompraId: Number(detalle.cotizacionCompraId),
      tipoDocumentoId: Number(detalle.tipoDocumentoId),
      validadoPorId: detalle.validadoPorId ? Number(detalle.validadoPorId) : null,
      obligatorio: Boolean(detalle.obligatorio),
      entregado: Boolean(detalle.entregado),
      validado: Boolean(detalle.validado)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles por tipo de documento:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de documentos filtrados por estado de entrega
 * @param {boolean} entregado - Estado de entrega
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const obtenerDetallesPorEstadoEntrega = async (entregado) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras/por-estado-entrega/${entregado}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      cotizacionCompraId: Number(detalle.cotizacionCompraId),
      tipoDocumentoId: Number(detalle.tipoDocumentoId),
      validadoPorId: detalle.validadoPorId ? Number(detalle.validadoPorId) : null,
      obligatorio: Boolean(detalle.obligatorio),
      entregado: Boolean(detalle.entregado),
      validado: Boolean(detalle.validado)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles por estado de entrega:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de documentos filtrados por estado de validación
 * @param {boolean} validado - Estado de validación
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const obtenerDetallesPorEstadoValidacion = async (validado) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras/por-estado-validacion/${validado}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      cotizacionCompraId: Number(detalle.cotizacionCompraId),
      tipoDocumentoId: Number(detalle.tipoDocumentoId),
      validadoPorId: detalle.validadoPorId ? Number(detalle.validadoPorId) : null,
      obligatorio: Boolean(detalle.obligatorio),
      entregado: Boolean(detalle.entregado),
      validado: Boolean(detalle.validado)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles por estado de validación:', error);
    throw error;
  }
};

/**
 * Valida si un documento es obligatorio para una cotización específica
 * @param {number} cotizacionCompraId - ID de la cotización de compra
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<boolean>} true si el documento es obligatorio
 */
export const validarDocumentoObligatorio = async (cotizacionCompraId, tipoDocumentoId) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/det-docs-req-cotiza-compras/validar-obligatorio/${cotizacionCompraId}/${tipoDocumentoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.obligatorio;
  } catch (error) {
    console.error('Error al validar documento obligatorio:', error);
    throw error;
  }
};
