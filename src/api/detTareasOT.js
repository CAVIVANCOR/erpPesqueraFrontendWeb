/**
 * API para DetTareasOT - Detalle de Tareas de Órdenes de Trabajo
 * Maneja la gestión de tareas específicas asociadas a órdenes de trabajo de mantenimiento.
 * Incluye funciones CRUD, filtros especializados, validaciones y manejo de archivos.
 * 
 * Funcionalidades principales:
 * - CRUD completo de detalles de tareas de OT
 * - Filtros por orden de trabajo, responsable, estado de realización
 * - Gestión de archivos PDF (fotos, cotizaciones)
 * - Validaciones de fechas y coherencia de datos
 * - Manejo profesional de errores y autenticación JWT
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/det-tareas-ot`;

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
 * Obtiene todos los detalles de tareas de OT
 * @returns {Promise<Array>} Lista de detalles de tareas
 */
export const getDetallesTareasOT = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de tareas OT:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de tarea OT por ID
 * @param {number} id - ID del detalle de tarea
 * @returns {Promise<Object>} Detalle de tarea encontrado
 */
export const getDetalleTareaPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener detalle de tarea ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de tarea OT
 * @param {Object} detalleTarea - Datos del detalle de tarea
 * @returns {Promise<Object>} Detalle de tarea creado
 */
export const createDetTareasOT = async (detalleTarea) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detalleTarea,
      otMantenimientoId: Number(detalleTarea.otMantenimientoId),
      responsableId: detalleTarea.responsableId ? Number(detalleTarea.responsableId) : null,
      validaTerminoTareaId: detalleTarea.validaTerminoTareaId ? Number(detalleTarea.validaTerminoTareaId) : null,
      descripcion: detalleTarea.descripcion?.trim() || '',
      observaciones: detalleTarea.observaciones?.trim() || null,
      realizado: Boolean(detalleTarea.realizado),
      adjuntoCotizacionUno: Boolean(detalleTarea.adjuntoCotizacionUno),
      adjuntoCotizacionDos: Boolean(detalleTarea.adjuntoCotizacionDos),
      fechaProgramada: detalleTarea.fechaProgramada ? new Date(detalleTarea.fechaProgramada).toISOString() : null,
      fechaInicio: detalleTarea.fechaInicio ? new Date(detalleTarea.fechaInicio).toISOString() : null,
      fechaFin: detalleTarea.fechaFin ? new Date(detalleTarea.fechaFin).toISOString() : null,
      fechaValidaTerminoTarea: detalleTarea.fechaValidaTerminoTarea ? new Date(detalleTarea.fechaValidaTerminoTarea).toISOString() : null,
      urlFotosAntesPdf: detalleTarea.urlFotosAntesPdf?.trim() || null,
      urlCotizacionUnoPdf: detalleTarea.urlCotizacionUnoPdf?.trim() || null,
      urlCotizacionDosPdf: detalleTarea.urlCotizacionDosPdf?.trim() || null
    };

    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de tarea OT:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de tarea OT existente
 * @param {number} id - ID del detalle de tarea
 * @param {Object} detalleTarea - Datos actualizados
 * @returns {Promise<Object>} Detalle de tarea actualizado
 */
export const updateDetTareasOT = async (id, detalleTarea) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...detalleTarea,
      otMantenimientoId: Number(detalleTarea.otMantenimientoId),
      responsableId: detalleTarea.responsableId ? Number(detalleTarea.responsableId) : null,
      validaTerminoTareaId: detalleTarea.validaTerminoTareaId ? Number(detalleTarea.validaTerminoTareaId) : null,
      descripcion: detalleTarea.descripcion?.trim() || '',
      observaciones: detalleTarea.observaciones?.trim() || null,
      realizado: Boolean(detalleTarea.realizado),
      adjuntoCotizacionUno: Boolean(detalleTarea.adjuntoCotizacionUno),
      adjuntoCotizacionDos: Boolean(detalleTarea.adjuntoCotizacionDos),
      fechaProgramada: detalleTarea.fechaProgramada ? new Date(detalleTarea.fechaProgramada).toISOString() : null,
      fechaInicio: detalleTarea.fechaInicio ? new Date(detalleTarea.fechaInicio).toISOString() : null,
      fechaFin: detalleTarea.fechaFin ? new Date(detalleTarea.fechaFin).toISOString() : null,
      fechaValidaTerminoTarea: detalleTarea.fechaValidaTerminoTarea ? new Date(detalleTarea.fechaValidaTerminoTarea).toISOString() : null,
      urlFotosAntesPdf: detalleTarea.urlFotosAntesPdf?.trim() || null,
      urlCotizacionUnoPdf: detalleTarea.urlCotizacionUnoPdf?.trim() || null,
      urlCotizacionDosPdf: detalleTarea.urlCotizacionDosPdf?.trim() || null
    };

    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar detalle de tarea OT ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un detalle de tarea OT
 * @param {number} id - ID del detalle de tarea a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleTareaOT = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar detalle de tarea OT ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene detalles de tareas por orden de trabajo
 * @param {number} otMantenimientoId - ID de la orden de trabajo
 * @returns {Promise<Array>} Lista de tareas filtradas
 */
export const getTareasPorOrdenTrabajo = async (otMantenimientoId) => {
  try {
    const response = await axios.get(`${API_URL}/orden-trabajo/${otMantenimientoId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tareas por orden de trabajo ${otMantenimientoId}:`, error);
    throw error;
  }
};

/**
 * Obtiene tareas por responsable
 * @param {number} responsableId - ID del responsable
 * @returns {Promise<Array>} Lista de tareas filtradas
 */
export const getTareasPorResponsable = async (responsableId) => {
  try {
    const response = await axios.get(`${API_URL}/responsable/${responsableId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tareas por responsable ${responsableId}:`, error);
    throw error;
  }
};

/**
 * Obtiene tareas por estado de realización
 * @param {boolean} realizado - Estado de realización (true/false)
 * @returns {Promise<Array>} Lista de tareas filtradas
 */
export const getTareasPorEstado = async (realizado) => {
  try {
    const response = await axios.get(`${API_URL}/estado/${realizado}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tareas por estado ${realizado}:`, error);
    throw error;
  }
};

/**
 * Obtiene tareas pendientes (no realizadas)
 * @returns {Promise<Array>} Lista de tareas pendientes
 */
export const getTareasPendientes = async () => {
  try {
    const response = await axios.get(`${API_URL}/pendientes`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener tareas pendientes:', error);
    throw error;
  }
};

/**
 * Marca una tarea como realizada
 * @param {number} id - ID de la tarea
 * @param {string} observaciones - Observaciones de finalización
 * @returns {Promise<Object>} Tarea actualizada
 */
export const marcarTareaRealizada = async (id, observaciones = '') => {
  try {
    const datosActualizacion = {
      realizado: true,
      fechaFin: new Date().toISOString(),
      observaciones: observaciones.trim()
    };

    const response = await axios.patch(`${API_URL}/${id}/realizar`, datosActualizacion, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al marcar tarea ${id} como realizada:`, error);
    throw error;
  }
};

/**
 * Valida el término de una tarea
 * @param {number} id - ID de la tarea
 * @param {number} validadorId - ID del validador
 * @param {string} observaciones - Observaciones de validación
 * @returns {Promise<Object>} Tarea validada
 */
export const validarTerminoTarea = async (id, validadorId, observaciones = '') => {
  try {
    const datosValidacion = {
      validaTerminoTareaId: Number(validadorId),
      fechaValidaTerminoTarea: new Date().toISOString(),
      observaciones: observaciones.trim()
    };

    const response = await axios.patch(`${API_URL}/${id}/validar`, datosValidacion, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al validar tarea ${id}:`, error);
    throw error;
  }
};

/**
 * Sube archivo PDF para fotos antes
 * @param {number} id - ID de la tarea
 * @param {File} archivo - Archivo PDF a subir
 * @returns {Promise<Object>} URL del archivo subido
 */
export const subirFotosAntes = async (id, archivo) => {
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await axios.post(`${API_URL}/${id}/fotos-antes`, formData, {
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error al subir fotos antes para tarea ${id}:`, error);
    throw error;
  }
};

/**
 * Sube archivo PDF para cotización
 * @param {number} id - ID de la tarea
 * @param {File} archivo - Archivo PDF a subir
 * @param {number} numeroCotizacion - Número de cotización (1 o 2)
 * @returns {Promise<Object>} URL del archivo subido
 */
export const subirCotizacion = async (id, archivo, numeroCotizacion) => {
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('numeroCotizacion', numeroCotizacion);

    const response = await axios.post(`${API_URL}/${id}/cotizacion`, formData, {
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error al subir cotización ${numeroCotizacion} para tarea ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de tareas
 * @returns {Promise<Object>} Estadísticas de tareas
 */
export const getEstadisticasTareas = async () => {
  try {
    const response = await axios.get(`${API_URL}/estadisticas`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de tareas:', error);
    throw error;
  }
};

/**
 * Valida coherencia de fechas de una tarea
 * @param {Object} fechas - Objeto con fechas a validar
 * @returns {Promise<Object>} Resultado de validación
 */
export const validarFechasTarea = async (fechas) => {
  try {
    const response = await axios.post(`${API_URL}/validar-fechas`, fechas, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al validar fechas:', error);
    throw error;
  }
};
