/**
 * API para DetRepuestosContratistaOT - Detalle de Repuestos de Contratistas en OT
 * Maneja la gestión de repuestos asociados a contratistas en órdenes de trabajo de mantenimiento.
 * Incluye funciones CRUD, filtros especializados y validaciones de negocio.
 * 
 * Funcionalidades principales:
 * - CRUD completo de detalles de repuestos
 * - Filtros por contratista OT, producto, orden de compra
 * - Validaciones de unicidad y coherencia de datos
 * - Manejo profesional de errores y autenticación JWT
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from "../shared/stores/useAuthStore";

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/repuestos-contratista-ot`;

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
 * Obtiene todos los detalles de repuestos
 * @returns {Promise<Array>} Lista de detalles de repuestos
 */
export const getDetallesRepuestos = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de repuestos:', error);
    throw error;
  }
};



/**
 * Obtiene un detalle de repuesto por ID
 * @param {number} id - ID del detalle de repuesto
 * @returns {Promise<Object>} Detalle de repuesto encontrado
 */
export const getDetalleRepuestoPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle de repuesto ${id}:`, error);
    throw error;
  }
};



/**
 * Crea un nuevo detalle de repuesto
 * @param {Object} detalleRepuesto - Datos del detalle de repuesto
 * @returns {Promise<Object>} Detalle de repuesto creado
 */
export const createDetRepuestoContratistaOT = async (detalleRepuesto) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detalleRepuesto,
      detContratistaOTId: Number(detalleRepuesto.detContratistaOTId),
      numeroLinea: Number(detalleRepuesto.numeroLinea),
      productoId: Number(detalleRepuesto.productoId),
      descripcion: detalleRepuesto.descripcion?.trim() || '',
      cantidad: Number(detalleRepuesto.cantidad) || 0,
      precioUnitario: Number(detalleRepuesto.precioUnitario) || 0,
      total: Number(detalleRepuesto.total) || 0,
      monedaId: Number(detalleRepuesto.monedaId),
      incluidoEnPresupuesto: Boolean(detalleRepuesto.incluidoEnPresupuesto),
      ordenCompraId: detalleRepuesto.ordenCompraId ? Number(detalleRepuesto.ordenCompraId) : null
    };
    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de repuesto:', error);
    throw error;
  }
};



/**
 * Actualiza un detalle de repuesto existente
 * @param {number} id - ID del detalle de repuesto
 * @param {Object} detalleRepuesto - Datos actualizados
 * @returns {Promise<Object>} Detalle de repuesto actualizado
 */
export const updateDetRepuestoContratistaOT = async (id, detalleRepuesto) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detalleRepuesto,
      detContratistaOTId: Number(detalleRepuesto.detContratistaOTId),
      numeroLinea: Number(detalleRepuesto.numeroLinea),
      productoId: Number(detalleRepuesto.productoId),
      descripcion: detalleRepuesto.descripcion?.trim() || '',
      cantidad: Number(detalleRepuesto.cantidad) || 0,
      precioUnitario: Number(detalleRepuesto.precioUnitario) || 0,
      total: Number(detalleRepuesto.total) || 0,
      monedaId: Number(detalleRepuesto.monedaId),
      incluidoEnPresupuesto: Boolean(detalleRepuesto.incluidoEnPresupuesto),
      ordenCompraId: detalleRepuesto.ordenCompraId ? Number(detalleRepuesto.ordenCompraId) : null
    };
    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle de repuesto ${id}:`, error);
    throw error;
  }
};



/**
 * Elimina un detalle de repuesto
 * @param {number} id - ID del detalle de repuesto a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleRepuesto = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle de repuesto ${id}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de repuestos por contratista OT
 * @param {number} detContratistaOTId - ID del detalle de contratista OT
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorContratistaOT = async (detContratistaOTId) => {
  try {
    const response = await axios.get(`${API_URL}/contratista-ot/${detContratistaOTId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por contratista OT ${detContratistaOTId}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de repuestos por producto
 * @param {number} productoId - ID del producto
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorProducto = async (productoId) => {
  try {
    const response = await axios.get(`${API_URL}/producto/${productoId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por producto ${productoId}:`, error);
    throw error;
  }
};



/**
 * Valida si existe duplicado de repuesto en el mismo contratista OT
 * @param {number} detContratistaOTId - ID del detalle de contratista OT
 * @param {number} numeroLinea - Número de línea
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si existe duplicado
 */
export const validarDuplicado = async (detContratistaOTId, numeroLinea, excludeId = null) => {
  try {
    const params = { detContratistaOTId, numeroLinea };
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