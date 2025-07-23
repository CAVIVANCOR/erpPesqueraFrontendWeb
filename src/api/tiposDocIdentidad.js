/**
 * API para TiposDocIdentidad - Tipos de Documentos de Identidad
 * Maneja la gestión de tipos de documentos de identidad según modelo Prisma.
 * Campos: id, codigo, codSunat, nombre, cesado, createdAt, updatedAt
 * 
 * Funcionalidades principales:
 * - CRUD completo de tipos de documentos de identidad
 * - Filtros por estado cesado, código SUNAT
 * - Validaciones de unicidad de código y nombre
 * - Manejo profesional de errores y autenticación JWT
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/tipos-doc-identidad`;

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
 * Obtiene todos los tipos de documentos de identidad
 * @returns {Promise<Array>} Lista de tipos de documentos de identidad
 */
export const getTiposDocIdentidad = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    console.log('Tipos de documentos de identidad obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de documentos de identidad:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de documento de identidad por ID
 * @param {number} id - ID del tipo de documento
 * @returns {Promise<Object>} Tipo de documento encontrado
 */
export const getTipoDocIdentidadPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    console.log(`Tipo de documento de identidad ${id} obtenido:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tipo de documento de identidad ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de documento de identidad
 * @param {Object} tipoDoc - Datos del tipo de documento
 * @returns {Promise<Object>} Tipo de documento creado
 */
export const crearTipoDocIdentidad = async (tipoDoc) => {
  try {
    // Normalización de datos antes del envío según modelo Prisma
    const datosNormalizados = {
      codigo: tipoDoc.codigo?.trim().toUpperCase() || '',
      codSunat: tipoDoc.codSunat?.trim() || '',
      nombre: tipoDoc.nombre?.trim() || '',
      cesado: Boolean(tipoDoc.cesado)
    };

    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    console.log('Tipo de documento de identidad creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al crear tipo de documento de identidad:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de documento de identidad existente
 * @param {number} id - ID del tipo de documento
 * @param {Object} tipoDoc - Datos actualizados
 * @returns {Promise<Object>} Tipo de documento actualizado
 */
export const actualizarTipoDocIdentidad = async (id, tipoDoc) => {
  try {
    // Normalización de datos antes del envío según modelo Prisma
    const datosNormalizados = {
      codigo: tipoDoc.codigo?.trim().toUpperCase() || '',
      codSunat: tipoDoc.codSunat?.trim() || '',
      nombre: tipoDoc.nombre?.trim() || '',
      cesado: Boolean(tipoDoc.cesado)
    };

    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    console.log(`Tipo de documento de identidad ${id} actualizado:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar tipo de documento de identidad ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un tipo de documento de identidad
 * @param {number} id - ID del tipo de documento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarTipoDocIdentidad = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    console.log(`Tipo de documento de identidad ${id} eliminado`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar tipo de documento de identidad ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene tipos de documentos activos
 * @returns {Promise<Array>} Lista de tipos de documentos activos
 */
export const getTiposDocIdentidadActivos = async () => {
  try {
    const response = await axios.get(`${API_URL}/activos`, getAuthHeaders());
    console.log('Tipos de documentos de identidad activos obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de documentos activos:', error);
    throw error;
  }
};

/**
 * Obtiene tipos de documentos por país de origen
 * @param {number} paisId - ID del país
 * @returns {Promise<Array>} Lista de tipos de documentos filtrados
 */
export const getTiposDocPorPais = async (paisId) => {
  try {
    const response = await axios.get(`${API_URL}/pais/${paisId}`, getAuthHeaders());
    console.log(`Tipos de documentos para país ${paisId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tipos de documentos por país ${paisId}:`, error);
    throw error;
  }
};

/**
 * Obtiene tipos de documentos que permiten menores de edad
 * @returns {Promise<Array>} Lista de tipos de documentos para menores
 */
export const getTiposDocParaMenores = async () => {
  try {
    const response = await axios.get(`${API_URL}/menores`, getAuthHeaders());
    console.log('Tipos de documentos para menores obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de documentos para menores:', error);
    throw error;
  }
};

/**
 * Valida si un código de tipo de documento es único
 * @param {string} codigo - Código a validar
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si el código es único
 */
export const validarCodigoUnico = async (codigo, excludeId = null) => {
  try {
    const params = { codigo: codigo.trim().toUpperCase() };
    if (excludeId) params.excludeId = excludeId;

    const response = await axios.get(`${API_URL}/validar-codigo`, {
      ...getAuthHeaders(),
      params
    });
    
    console.log('Validación de código único:', response.data);
    return response.data.esUnico;
  } catch (error) {
    console.error('Error al validar código único:', error);
    throw error;
  }
};

/**
 * Valida si un nombre de tipo de documento es único
 * @param {string} nombre - Nombre a validar
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si el nombre es único
 */
export const validarNombreUnico = async (nombre, excludeId = null) => {
  try {
    const params = { nombre: nombre.trim() };
    if (excludeId) params.excludeId = excludeId;

    const response = await axios.get(`${API_URL}/validar-nombre`, {
      ...getAuthHeaders(),
      params
    });
    
    console.log('Validación de nombre único:', response.data);
    return response.data.esUnico;
  } catch (error) {
    console.error('Error al validar nombre único:', error);
    throw error;
  }
};

/**
 * Valida un número de documento según el tipo
 * @param {number} tipoDocId - ID del tipo de documento
 * @param {string} numeroDocumento - Número de documento a validar
 * @returns {Promise<Object>} Resultado de validación
 */
export const validarNumeroDocumento = async (tipoDocId, numeroDocumento) => {
  try {
    const datosValidacion = {
      tipoDocId: Number(tipoDocId),
      numeroDocumento: numeroDocumento.trim()
    };

    const response = await axios.post(`${API_URL}/validar-numero`, datosValidacion, getAuthHeaders());
    console.log('Validación de número de documento:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al validar número de documento:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de uso de tipos de documentos
 * @returns {Promise<Object>} Estadísticas de uso
 */
export const getEstadisticasUso = async () => {
  try {
    const response = await axios.get(`${API_URL}/estadisticas`, getAuthHeaders());
    console.log('Estadísticas de uso obtenidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de uso:', error);
    throw error;
  }
};

/**
 * Activa o desactiva un tipo de documento
 * @param {number} id - ID del tipo de documento
 * @param {boolean} activo - Estado activo/inactivo
 * @returns {Promise<Object>} Tipo de documento actualizado
 */
export const cambiarEstadoTipoDoc = async (id, activo) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/estado`, { activo: Boolean(activo) }, getAuthHeaders());
    console.log(`Estado del tipo de documento ${id} cambiado a ${activo}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar estado del tipo de documento ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene tipos de documentos con configuración específica
 * @param {Object} filtros - Filtros de configuración
 * @returns {Promise<Array>} Lista de tipos de documentos filtrados
 */
export const getTiposDocPorConfiguracion = async (filtros = {}) => {
  try {
    const response = await axios.get(`${API_URL}/configuracion`, {
      ...getAuthHeaders(),
      params: filtros
    });
    
    console.log('Tipos de documentos por configuración obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de documentos por configuración:', error);
    throw error;
  }
};
