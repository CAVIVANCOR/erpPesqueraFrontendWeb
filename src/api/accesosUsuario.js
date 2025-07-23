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
 * Obtiene todos los accesos de usuario del sistema
 * @returns {Promise<Array>} Lista de accesos de usuario
 */
export const getAllAccesosUsuario = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/accesos-usuario`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener accesos de usuario:', error);
    throw error;
  }
};

/**
 * Crea un nuevo acceso de usuario
 * @param {Object} accesoData - Datos del acceso de usuario
 * @returns {Promise<Object>} Acceso de usuario creado
 */
export const crearAccesosUsuario = async (accesoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/accesos-usuario`, accesoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear acceso de usuario:', error);
    throw error;
  }
};

/**
 * Actualiza un acceso de usuario existente
 * @param {number} id - ID del acceso de usuario
 * @param {Object} accesoData - Datos actualizados del acceso
 * @returns {Promise<Object>} Acceso de usuario actualizado
 */
export const actualizarAccesosUsuario = async (id, accesoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/accesos-usuario/${id}`, accesoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar acceso de usuario:', error);
    throw error;
  }
};

/**
 * Elimina un acceso de usuario
 * @param {number} id - ID del acceso de usuario a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAccesosUsuario = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/accesos-usuario/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar acceso de usuario:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getAccesosUsuario = getAllAccesosUsuario;
export const createAccesosUsuario = crearAccesosUsuario;
export const updateAccesosUsuario = actualizarAccesosUsuario;
export const deleteAccesosUsuario = eliminarAccesosUsuario;
