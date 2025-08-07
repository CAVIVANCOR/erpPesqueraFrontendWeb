/**
 * API para DetPermisoGestionadoOT - Detalle de Permisos Gestionados en Órdenes de Trabajo
 * Maneja la gestión de permisos específicos asociados a órdenes de trabajo de mantenimiento.
 * Incluye funciones CRUD, filtros especializados y validaciones de negocio.
 * 
 * Funcionalidades principales:
 * - CRUD completo de detalles de permisos gestionados
 * - Filtros por orden de trabajo, permiso, estado de gestión
 * - Validaciones de unicidad y coherencia de datos
 * - Manejo profesional de errores y autenticación JWT
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from "../shared/stores/useAuthStore";

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/det-permiso-gestionado-ot`;

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
 * Obtiene todos los detalles de permisos gestionados
 * @returns {Promise<Array>} Lista de detalles de permisos gestionados
 */
export const getDetallesPermisosGestionados = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de permisos gestionados:', error);
    throw error;
  }
};



/**
 * Obtiene un detalle de permiso gestionado por ID
 * @param {number} id - ID del detalle de permiso gestionado
 * @returns {Promise<Object>} Detalle de permiso gestionado encontrado
 */
export const getDetallePermisoGestionadoPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle de permiso gestionado ${id}:`, error);
    throw error;
  }
};



/**
 * Crea un nuevo detalle de permiso gestionado
 * @param {Object} detallePermiso - Datos del detalle de permiso gestionado
 * @returns {Promise<Object>} Detalle de permiso gestionado creado
 */
export const createDetPermisoGestionadoOT = async (detallePermiso) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detallePermiso,
      otMantenimientoId: Number(detallePermiso.otMantenimientoId),
      permisoId: Number(detallePermiso.permisoId),
      gestionado: Boolean(detallePermiso.gestionado),
      fechaGestion: detallePermiso.fechaGestion ? new Date(detallePermiso.fechaGestion).toISOString() : null,
      observaciones: detallePermiso.observaciones?.trim() || null
    };
    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de permiso gestionado:', error);
    throw error;
  }
};



/**
 * Actualiza un detalle de permiso gestionado existente
 * @param {number} id - ID del detalle de permiso gestionado
 * @param {Object} detallePermiso - Datos actualizados
 * @returns {Promise<Object>} Detalle de permiso gestionado actualizado
 */
export const updateDetPermisoGestionadoOT = async (id, detallePermiso) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detallePermiso,
      otMantenimientoId: Number(detallePermiso.otMantenimientoId),
      permisoId: Number(detallePermiso.permisoId),
      gestionado: Boolean(detallePermiso.gestionado),
      fechaGestion: detallePermiso.fechaGestion ? new Date(detallePermiso.fechaGestion).toISOString() : null,
      observaciones: detallePermiso.observaciones?.trim() || null
    };
    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle de permiso gestionado ${id}:`, error);
    throw error;
  }
};



/**
 * Elimina un detalle de permiso gestionado
 * @param {number} id - ID del detalle de permiso gestionado a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetallePermisoGestionado = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle de permiso gestionado ${id}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de permisos gestionados por orden de trabajo
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
 * Obtiene detalles de permisos gestionados por permiso específico
 * @param {number} permisoId - ID del permiso
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorPermiso = async (permisoId) => {
  try {
    const response = await axios.get(`${API_URL}/permiso/${permisoId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por permiso ${permisoId}:`, error);
    throw error;
  }
};



/**
 * Obtiene detalles de permisos por estado de gestión
 * @param {boolean} gestionado - Estado de gestión (true/false)
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const getDetallesPorEstadoGestion = async (gestionado) => {
  try {
    const response = await axios.get(`${API_URL}/estado-gestion/${gestionado}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalles por estado de gestión ${gestionado}:`, error);
    throw error;
  }
};



/**
 * Marca un detalle de permiso como gestionado
 * @param {number} id - ID del detalle de permiso
 * @param {string} observaciones - Observaciones de la gestión
 * @returns {Promise<Object>} Detalle actualizado
 */
export const marcarComoGestionado = async (id, observaciones = '') => {
  try {
    const datosActualizacion = {
      gestionado: true,
      fechaGestion: new Date().toISOString(),
      observaciones: observaciones.trim()
    };

    const response = await axios.patch(`${API_URL}/${id}/gestionar`, datosActualizacion, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al marcar detalle ${id} como gestionado:`, error);
    throw error;
  }
};



/**
 * Obtiene estadísticas de permisos gestionados
 * @returns {Promise<Object>} Estadísticas de gestión
 */
export const getEstadisticasGestion = async () => {
  try {
    const response = await axios.get(`${API_URL}/estadisticas`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de gestión:', error);
    throw error;
  }
};



/**
 * Valida si existe duplicado de permiso en la misma orden de trabajo
 * @param {number} otMantenimientoId - ID de la orden de trabajo
 * @param {number} permisoId - ID del permiso
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si existe duplicado
 */
export const validarDuplicado = async (otMantenimientoId, permisoId, excludeId = null) => {
  try {
    const params = { otMantenimientoId, permisoId };
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


