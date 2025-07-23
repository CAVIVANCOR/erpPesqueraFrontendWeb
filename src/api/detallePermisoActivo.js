import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
const getAuthToken = () => {
  const { token } = useAuthStore.getState();
  return token;
};

/**
 * Obtiene todos los detalles de permisos de activos del sistema
 * @returns {Promise<Array>} Lista de detalles de permisos de activos
 */
export const getDetallesPermisoActivo = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/detalle-permiso-activo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de permisos de activos:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de permiso de activo
 * @param {Object} detalleData - Datos del detalle de permiso de activo
 * @returns {Promise<Object>} Detalle de permiso de activo creado
 */
export const crearDetallePermisoActivo = async (detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/detalle-permiso-activo`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de permiso de activo:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de permiso de activo existente
 * @param {number} id - ID del detalle de permiso de activo
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de permiso de activo actualizado
 */
export const actualizarDetallePermisoActivo = async (id, detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/detalle-permiso-activo/${id}`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de permiso de activo:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de permiso de activo
 * @param {number} id - ID del detalle de permiso de activo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetallePermisoActivo = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/detalle-permiso-activo/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de permiso de activo:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getAllDetallePermisoActivo = getDetallesPermisoActivo;
export const createDetallePermisoActivo = crearDetallePermisoActivo;
export const updateDetallePermisoActivo = actualizarDetallePermisoActivo;
export const deleteDetallePermisoActivo = eliminarDetallePermisoActivo;
