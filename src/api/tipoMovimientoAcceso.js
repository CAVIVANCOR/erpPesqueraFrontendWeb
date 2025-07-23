/**
 * API profesional para TipoMovimientoAcceso - ERP Megui
 * 
 * Gestiona los tipos de movimientos de acceso del sistema.
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
 * Obtiene todos los tipos de movimientos de acceso
 * @returns {Promise<Array>} Lista de tipos de movimientos con datos normalizados
 */
export const obtenerTiposMovimientoAcceso = async () => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/tipo-movimiento-acceso`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(tipo => ({
      ...tipo,
      id: Number(tipo.id),
      codigo: tipo.codigo?.trim().toUpperCase() || '',
      nombre: tipo.nombre?.trim() || '',
      activo: Boolean(tipo.activo)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener tipos de movimientos de acceso:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de movimiento de acceso por ID
 * @param {number} id - ID del tipo de movimiento
 * @returns {Promise<Object>} Tipo de movimiento con datos normalizados
 */
export const obtenerTipoMovimientoAccesoPorId = async (id) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/tipo-movimiento-acceso/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const tipoNormalizado = {
      ...response.data,
      id: Number(response.data.id),
      codigo: response.data.codigo?.trim().toUpperCase() || '',
      nombre: response.data.nombre?.trim() || '',
      activo: Boolean(response.data.activo)
    };

    return tipoNormalizado;
  } catch (error) {
    console.error('Error al obtener tipo de movimiento de acceso por ID:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de movimiento de acceso
 * @param {Object} datosTipo - Datos del tipo de movimiento
 * @returns {Promise<Object>} Tipo de movimiento creado
 */
export const crearTipoMovimientoAcceso = async (datosTipo) => {
  try {
    const token = obtenerTokenAuth();
    
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...datosTipo,
      codigo: datosTipo.codigo?.trim().toUpperCase() || '',
      nombre: datosTipo.nombre?.trim() || '',
      descripcion: datosTipo.descripcion?.trim() || null,
      activo: Boolean(datosTipo.activo)
    };

    const response = await axios.post(`${API_URL}/tipo-movimiento-acceso`, datosNormalizados, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al crear tipo de movimiento de acceso:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de movimiento de acceso existente
 * @param {number} id - ID del tipo de movimiento
 * @param {Object} datosTipo - Datos actualizados del tipo
 * @returns {Promise<Object>} Tipo de movimiento actualizado
 */
export const actualizarTipoMovimientoAcceso = async (id, datosTipo) => {
  try {
    const token = obtenerTokenAuth();
    
    // Normalización de datos antes del envío
    const datosNormalizados = {
      ...datosTipo,
      codigo: datosTipo.codigo?.trim().toUpperCase() || '',
      nombre: datosTipo.nombre?.trim() || '',
      descripcion: datosTipo.descripcion?.trim() || null,
      activo: Boolean(datosTipo.activo)
    };

    const response = await axios.put(`${API_URL}/tipo-movimiento-acceso/${id}`, datosNormalizados, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al actualizar tipo de movimiento de acceso:', error);
    throw error;
  }
};

/**
 * Elimina un tipo de movimiento de acceso
 * @param {number} id - ID del tipo de movimiento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarTipoMovimientoAcceso = async (id) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.delete(`${API_URL}/tipo-movimiento-acceso/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al eliminar tipo de movimiento de acceso:', error);
    throw error;
  }
};

/**
 * Obtiene tipos de movimientos de acceso activos
 * @returns {Promise<Array>} Lista de tipos activos
 */
export const obtenerTiposMovimientoAccesoActivos = async () => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/tipo-movimiento-acceso/activos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(tipo => ({
      ...tipo,
      id: Number(tipo.id),
      codigo: tipo.codigo?.trim().toUpperCase() || '',
      nombre: tipo.nombre?.trim() || '',
      activo: Boolean(tipo.activo)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener tipos de movimientos de acceso activos:', error);
    throw error;
  }
};

/**
 * Obtiene tipos de movimientos filtrados por tipo (ingreso/salida)
 * @param {string} tipoMovimiento - Tipo de movimiento ('ingreso' o 'salida')
 * @returns {Promise<Array>} Lista de tipos filtrados
 */
export const obtenerTiposPorTipoMovimiento = async (tipoMovimiento) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.get(`${API_URL}/tipo-movimiento-acceso/por-tipo/${tipoMovimiento}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Normalización de datos según regla ERP Megui
    const datosNormalizados = response.data.map(tipo => ({
      ...tipo,
      id: Number(tipo.id),
      codigo: tipo.codigo?.trim().toUpperCase() || '',
      nombre: tipo.nombre?.trim() || '',
      activo: Boolean(tipo.activo)
    }));

    return datosNormalizados;
  } catch (error) {
    console.error('Error al obtener tipos por tipo de movimiento:', error);
    throw error;
  }
};

/**
 * Valida si un código de tipo de movimiento ya existe
 * @param {string} codigo - Código del tipo de movimiento
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si el código está disponible
 */
export const validarCodigoUnico = async (codigo, excludeId = null) => {
  try {
    const token = obtenerTokenAuth();
    const params = new URLSearchParams({
      codigo: codigo.trim().toUpperCase()
    });
    
    if (excludeId) {
      params.append('excludeId', excludeId.toString());
    }

    const response = await axios.get(`${API_URL}/tipo-movimiento-acceso/validar-codigo?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.disponible;
  } catch (error) {
    console.error('Error al validar código único:', error);
    throw error;
  }
};

/**
 * Valida si un nombre de tipo de movimiento ya existe
 * @param {string} nombre - Nombre del tipo de movimiento
 * @param {number} excludeId - ID a excluir de la validación (para edición)
 * @returns {Promise<boolean>} true si el nombre está disponible
 */
export const validarNombreUnico = async (nombre, excludeId = null) => {
  try {
    const token = obtenerTokenAuth();
    const params = new URLSearchParams({
      nombre: nombre.trim()
    });
    
    if (excludeId) {
      params.append('excludeId', excludeId.toString());
    }

    const response = await axios.get(`${API_URL}/tipo-movimiento-acceso/validar-nombre?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.disponible;
  } catch (error) {
    console.error('Error al validar nombre único:', error);
    throw error;
  }
};

/**
 * Cambia el estado activo/inactivo de un tipo de movimiento
 * @param {number} id - ID del tipo de movimiento
 * @param {boolean} activo - Nuevo estado activo
 * @returns {Promise<Object>} Tipo de movimiento actualizado
 */
export const cambiarEstadoTipoMovimiento = async (id, activo) => {
  try {
    const token = obtenerTokenAuth();
    const response = await axios.patch(`${API_URL}/tipo-movimiento-acceso/${id}/estado`, 
      { activo: Boolean(activo) }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado del tipo de movimiento:', error);
    throw error;
  }
};
