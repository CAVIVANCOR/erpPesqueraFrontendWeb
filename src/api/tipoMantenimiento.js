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
 * Obtiene todos los tipos de mantenimiento del sistema
 * @returns {Promise<Array>} Lista de tipos de mantenimiento
 */
export const getAllTipoMantenimiento = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/tipo-mantenimiento`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de mantenimiento:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de mantenimiento
 * @param {Object} tipoMantenimientoData - Datos del tipo de mantenimiento
 * @returns {Promise<Object>} Tipo de mantenimiento creado
 */
export const crearTipoMantenimiento = async (tipoMantenimientoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/tipo-mantenimiento`, tipoMantenimientoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear tipo de mantenimiento:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo de mantenimiento existente
 * @param {number} id - ID del tipo de mantenimiento
 * @param {Object} tipoMantenimientoData - Datos actualizados del tipo de mantenimiento
 * @returns {Promise<Object>} Tipo de mantenimiento actualizado
 */
export const actualizarTipoMantenimiento = async (id, tipoMantenimientoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/tipo-mantenimiento/${id}`, tipoMantenimientoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar tipo de mantenimiento:', error);
    throw error;
  }
};

/**
 * Elimina un tipo de mantenimiento
 * @param {number} id - ID del tipo de mantenimiento a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarTipoMantenimiento = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/tipo-mantenimiento/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar tipo de mantenimiento:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getTipoMantenimiento = getAllTipoMantenimiento;
export const createTipoMantenimiento = crearTipoMantenimiento;
export const updateTipoMantenimiento = actualizarTipoMantenimiento;
export const deleteTipoMantenimiento = eliminarTipoMantenimiento;
