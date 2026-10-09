/**
 * API para DetContratistasOT - Detalle de Contratistas en Órdenes de Trabajo
 * Maneja la gestión de contratistas específicos asociados a órdenes de trabajo de mantenimiento.
 * Incluye funciones CRUD, filtros especializados y validaciones de negocio.
 * 
 * Funcionalidades principales:
 * - CRUD completo de detalles de contratistas
 * - Filtros por orden de trabajo, contratista, estado
 * - Validaciones de unicidad y coherencia de datos
 * - Manejo profesional de errores y autenticación JWT
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from "../shared/stores/useAuthStore";

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/contratistas-ot`;

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
 * Obtiene todos los detalles de contratistas
 * @returns {Promise<Array>} Lista de detalles de contratistas
 */
export const getDetallesContratistas = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de contratistas:', error);
    throw error;
  }
};



/**
 * Obtiene un detalle de contratista por ID
 * @param {number} id - ID del detalle de contratista
 * @returns {Promise<Object>} Detalle de contratista encontrado
 */
export const getDetalleContratistaPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle de contratista ${id}:`, error);
    throw error;
  }
};



/**
 * Crea un nuevo detalle de contratista
 * @param {Object} detalleContratista - Datos del detalle de contratista
 * @returns {Promise<Object>} Detalle de contratista creado
 */
export const createDetContratistaOT = async (detalleContratista) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detalleContratista,
      otMantenimientoId: Number(detalleContratista.otMantenimientoId),
      numeroLinea: Number(detalleContratista.numeroLinea),
      contratistaId: Number(detalleContratista.contratistaId),
      activoId: detalleContratista.activoId ? Number(detalleContratista.activoId) : null,
      servicioDescripcion: detalleContratista.servicioDescripcion?.trim() || '',
      montoPactado: Number(detalleContratista.montoPactado) || 0,
      montoPagado: Number(detalleContratista.montoPagado) || 0,
      saldo: Number(detalleContratista.saldo) || 0,
      monedaId: Number(detalleContratista.monedaId),
      estadoId: Number(detalleContratista.estadoId),
      urlDocumentoContratista: detalleContratista.urlDocumentoContratista?.trim() || null,
      urlFotosProductos: detalleContratista.urlFotosProductos?.trim() || null,
      urlFotosAntes: detalleContratista.urlFotosAntes?.trim() || null,
      urlFotosDespues: detalleContratista.urlFotosDespues?.trim() || null
    };
    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de contratista:', error);
    throw error;
  }
};



/**
 * Actualiza un detalle de contratista existente
 * @param {number} id - ID del detalle de contratista
 * @param {Object} detalleContratista - Datos actualizados
 * @returns {Promise<Object>} Detalle de contratista actualizado
 */
export const updateDetContratistaOT = async (id, detalleContratista) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detalleContratista,
      otMantenimientoId: Number(detalleContratista.otMantenimientoId),
      numeroLinea: Number(detalleContratista.numeroLinea),
      contratistaId: Number(detalleContratista.contratistaId),
      activoId: detalleContratista.activoId ? Number(detalleContratista.activoId) : null,
      servicioDescripcion: detalleContratista.servicioDescripcion?.trim() || '',
      montoPactado: Number(detalleContratista.montoPactado) || 0,
      montoPagado: Number(detalleContratista.montoPagado) || 0,
      saldo: Number(detalleContratista.saldo) || 0,
      monedaId: Number(detalleContratista.monedaId),
      estadoId: Number(detalleContratista.estadoId),
      urlDocumentoContratista: detalleContratista.urlDocumentoContratista?.trim() || null,
      urlFotosProductos: detalleContratista.urlFotosProductos?.trim() || null,
      urlFotosAntes: detalleContratista.urlFotosAntes?.trim() || null,
      urlFotosDespues: detalleContratista.urlFotosDespues?.trim() || null
    };
    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle de contratista ${id}:`, error);
    throw error;
  }
};



/**
 * Elimina un detalle de contratista
 * @param {number} id - ID del detalle de contratista a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleContratista = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle de contratista ${id}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de contratistas por orden de trabajo
 * @param {number} otMantenimientoId - ID de la orden de trabajo
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorOrdenTrabajo = async (otMantenimientoId) => {
  try {
    const response = await axios.get(`${API_URL}/orden-trabajo/${otMantenimientoId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por orden de trabajo ${otMantenimientoId}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de contratistas por contratista específico
 * @param {number} contratistaId - ID del contratista
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorContratista = async (contratistaId) => {
  try {
    const response = await axios.get(`${API_URL}/contratista/${contratistaId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por contratista ${contratistaId}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de contratistas por estado
 * @param {number} estadoId - ID del estado
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorEstado = async (estadoId) => {
  try {
    const response = await axios.get(`${API_URL}/estado/${estadoId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por estado ${estadoId}:`, error);
    throw error;
  }
};



/**
 * Valida si existe duplicado de contratista en la misma orden de trabajo
 * @param {number} otMantenimientoId - ID de la orden de trabajo
 * @param {number} numeroLinea - Número de línea
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si existe duplicado
 */
export const validarDuplicado = async (otMantenimientoId, numeroLinea, excludeId = null) => {
  try {
    const params = { otMantenimientoId, numeroLinea };
    if (excludeId) params.excludeId = excludeId;

    const response = await axios.get(`${API_URL}/validar-duplicado`, {
      ...getAuthHeaders(),
      params
    });
    return response.data.existeDuplicado;
  } catch (error) {
    console.error('Error al validar duplicado:', error);
    throw error;
  }
};



/**
 * Lista los documentos de compra (OrdenCompra) generados desde un presupuesto
 * @param {number} presupuestoId - ID del presupuesto (DetContratistasOT)
 * @returns {Promise<Array>} Lista de documentos generados
 */
export const getDocumentosCompraPorPresupuesto = async (presupuestoId) => {
  try {
    const response = await axios.get(`${API_URL}/${presupuestoId}/documentos-compra`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener documentos de compra del presupuesto ${presupuestoId}:`, error);
    throw error;
  }
};



/**
 * Busca productos equivalentes en la empresa seleccionada para los ítems del presupuesto
 * (coincidencia por Producto.descripcionArmada)
 * @param {number} presupuestoId - ID del presupuesto (DetContratistasOT)
 * @param {number} empresaId - ID de la empresa que facturará el documento
 * @returns {Promise<Object>} Ítems del presupuesto con sus productos equivalentes
 */
export const getProductosEquivalentes = async (presupuestoId, empresaId) => {
  try {
    const response = await axios.get(`${API_URL}/${presupuestoId}/productos-equivalentes`, {
      ...getAuthHeaders(),
      params: { empresaId }
    });
    return response.data;
  } catch (error) {
    console.error('Error al buscar productos equivalentes:', error);
    throw error;
  }
};



/**
 * Genera un documento de compra (OrdenCompra + CxP + asientos) desde un presupuesto
 * @param {number} presupuestoId - ID del presupuesto (DetContratistasOT)
 * @param {Object} datos - Datos del documento a generar (modo, empresa, proveedor, ítems, etc.)
 * @returns {Promise<Object>} Resultado con la OC generada
 */
export const generarDocumentoCompra = async (presupuestoId, datos) => {
  try {
    const response = await axios.post(`${API_URL}/${presupuestoId}/generar-documento-compra`, datos, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al generar documento de compra:', error);
    throw error;
  }
};