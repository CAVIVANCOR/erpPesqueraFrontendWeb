/**
 * API profesional para AccesoInstalacionDetalle - ERP Megui
 * 
 * Gestiona los detalles de accesos a instalaciones del sistema.
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

const API_URL = `${import.meta.env.VITE_API_URL}/accesos-instalacion-detalle`;


/**
 * Obtiene el token de autenticación desde el store de Zustand
 * Implementa la regla ERP Megui de acceso centralizado al token JWT
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
/**
 * Obtiene todos los detalles de accesos a instalaciones
 * @returns {Promise<Array>} Lista de detalles de accesos con datos normalizados
 */
export const obtenerDetallesAccesoInstalacion = async () => {
  try {
    const response = await axios.get(API_URL, {headers: getAuthHeader()});
    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      accesoInstalacionId: Number(detalle.accesoInstalacionId),
      tipoEquipoId: detalle.tipoEquipoId ? Number(detalle.tipoEquipoId) : null,
      tipoMovimientoId: detalle.tipoMovimientoId ? Number(detalle.tipoMovimientoId) : null,
      personalId: detalle.personalId ? Number(detalle.personalId) : null
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles de accesos a instalaciones:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de acceso a instalación por ID
 * @param {number} id - ID del detalle de acceso
 * @returns {Promise<Object>} Detalle de acceso con datos normalizados
 */
export const obtenerDetalleAccesoInstalacionPorId = async (id) => {
  try {
    const params = id ? { id } : {};
    const response = await axios.get(API_URL,{params, headers: getAuthHeader()});

    // Normalización de datos según regla ERP Megui
    const detalleNormalizado = {
      ...response.data,
      id: Number(response.data.id),
      accesoInstalacionId: Number(response.data.accesoInstalacionId),
      tipoEquipoId: response.data.tipoEquipoId ? Number(response.data.tipoEquipoId) : null,
      tipoMovimientoId: response.data.tipoMovimientoId ? Number(response.data.tipoMovimientoId) : null,
      personalId: response.data.personalId ? Number(response.data.personalId) : null
    };

    return detalleNormalizado;
  } catch (error) {
    console.error('Error al obtener detalle de acceso a instalación por ID:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de acceso a instalación
 * @param {Object} datosDetalle - Datos del detalle de acceso
 * @returns {Promise<Object>} Detalle de acceso creado
 */
export const crearDetalleAccesoInstalacion = async (datosDetalle) => {
  try {
    // Normalización de datos antes del envío según modelo Prisma AccesoInstalacionDetalle
    const datosNormalizados = {
      accesoInstalacionId: Number(datosDetalle.accesoInstalacionId),
      fechaHora: datosDetalle.fechaHora,
      tipoMovimientoId: Number(datosDetalle.tipoMovimientoId),
      areaDestinoVisitaId: datosDetalle.areaDestinoVisitaId ? Number(datosDetalle.areaDestinoVisitaId) : null,
      observaciones: datosDetalle.observaciones?.trim() || null
    };
    const response = await axios.post(API_URL, datosNormalizados, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de acceso a instalación:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de acceso a instalación existente
 * @param {number} id - ID del detalle de acceso
 * @param {Object} datosDetalle - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de acceso actualizado
 */
export const actualizarDetalleAccesoInstalacion = async (id, datosDetalle) => {
  try {
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...datosDetalle,
      accesoInstalacionId: Number(datosDetalle.accesoInstalacionId),
      tipoEquipoId: datosDetalle.tipoEquipoId ? Number(datosDetalle.tipoEquipoId) : null,
      tipoMovimientoId: datosDetalle.tipoMovimientoId ? Number(datosDetalle.tipoMovimientoId) : null,
      personalId: datosDetalle.personalId ? Number(datosDetalle.personalId) : null,
      numeroEquipo: datosDetalle.numeroEquipo?.trim() || null,
      observaciones: datosDetalle.observaciones?.trim() || null
    };
    const response = await axios.put(API_URL, datosNormalizados, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de acceso a instalación:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de acceso a instalación
 * @param {number} id - ID del detalle de acceso a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleAccesoInstalacion = async (id) => {
  try {
    const params = id ? { id } : {};
    const response = await axios.delete(API_URL,  { headers: getAuthHeader(), params });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de acceso a instalación:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de accesos filtrados por acceso a instalación
 * @param {number} accesoInstalacionId - ID del acceso a instalación
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const obtenerDetallesPorAccesoInstalacion = async (accesoInstalacionId) => {
  try {
    const params = accesoInstalacionId ? { accesoInstalacionId } : {};
    const response = await axios.get(API_URL, { headers: getAuthHeader(), params });
    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      accesoInstalacionId: Number(detalle.accesoInstalacionId),
      tipoEquipoId: detalle.tipoEquipoId ? Number(detalle.tipoEquipoId) : null,
      tipoMovimientoId: detalle.tipoMovimientoId ? Number(detalle.tipoMovimientoId) : null,
      personalId: detalle.personalId ? Number(detalle.personalId) : null
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles por acceso a instalación:', error);
    throw error;
  }
};

/**
 * Obtiene detalles de accesos filtrados por tipo de equipo
 * @param {number} tipoEquipoId - ID del tipo de equipo
 * @returns {Promise<Array>} Lista de detalles filtrados
 */
export const obtenerDetallesPorTipoEquipo = async (tipoEquipoId) => {
  try {
    const params = tipoEquipoId ? { tipoEquipoId } : {};
    const response = await axios.get(API_URL, { headers: getAuthHeader(), params });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(detalle => ({
      ...detalle,
      id: Number(detalle.id),
      accesoInstalacionId: Number(detalle.accesoInstalacionId),
      tipoEquipoId: Number(detalle.tipoEquipoId),
      tipoMovimientoId: detalle.tipoMovimientoId ? Number(detalle.tipoMovimientoId) : null,
      personalId: detalle.personalId ? Number(detalle.personalId) : null
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener detalles por tipo de equipo:', error);
    throw error;
  }
};

/**
 * Valida si un número de equipo ya existe para un tipo específico
 * @param {string} numeroEquipo - Número del equipo
 * @param {number} tipoEquipoId - ID del tipo de equipo
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si el número está disponible
 */
export const validarNumeroEquipoUnico = async (numeroEquipo, tipoEquipoId, excludeId = null) => {
  try {
    const params = new URLSearchParams({
      numeroEquipo: numeroEquipo.trim(),
      tipoEquipoId: tipoEquipoId.toString()
    });
    if (excludeId) {
      params.append('excludeId', excludeId.toString());
    }
    const response = await axios.get(API_URL, {headers: getAuthHeader(), params});
    return response.data.disponible;
  } catch (error) {
    console.error('Error al validar número de equipo único:', error);
    throw error;
  }
};
