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
 * Obtiene todos los accesos a instalaciones del sistema
 * @returns {Promise<Array>} Lista de accesos a instalaciones
 */
export const getAllAccesoInstalacion = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/acceso-instalacion`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener accesos a instalaciones:', error);
    throw error;
  }
};

/**
 * Crea un nuevo acceso a instalación
 * @param {Object} accesoData - Datos del acceso a instalación
 * @returns {Promise<Object>} Acceso a instalación creado
 */
export const crearAccesoInstalacion = async (accesoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/acceso-instalacion`, accesoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear acceso a instalación:', error);
    throw error;
  }
};

/**
 * Actualiza un acceso a instalación existente
 * @param {number} id - ID del acceso a instalación
 * @param {Object} accesoData - Datos actualizados del acceso
 * @returns {Promise<Object>} Acceso a instalación actualizado
 */
export const actualizarAccesoInstalacion = async (id, accesoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/acceso-instalacion/${id}`, accesoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar acceso a instalación:', error);
    throw error;
  }
};

/**
 * Elimina un acceso a instalación
 * @param {number} id - ID del acceso a instalación a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAccesoInstalacion = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/acceso-instalacion/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar acceso a instalación:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getAccesoInstalacion = getAllAccesoInstalacion;
export const createAccesoInstalacion = crearAccesoInstalacion;
export const updateAccesoInstalacion = actualizarAccesoInstalacion;
export const deleteAccesoInstalacion = eliminarAccesoInstalacion;
