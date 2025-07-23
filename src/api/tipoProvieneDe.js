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
 * Obtiene todos los tipos "proviene de" del sistema
 * @returns {Promise<Array>} Lista de tipos "proviene de"
 */
export const getTiposProvieneDe = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/tipo-proviene-de`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos proviene de:', error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo "proviene de"
 * @param {Object} tipoData - Datos del tipo "proviene de"
 * @returns {Promise<Object>} Tipo "proviene de" creado
 */
export const crearTipoProvieneDe = async (tipoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/tipo-proviene-de`, tipoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear tipo proviene de:', error);
    throw error;
  }
};

/**
 * Actualiza un tipo "proviene de" existente
 * @param {number} id - ID del tipo "proviene de"
 * @param {Object} tipoData - Datos actualizados del tipo
 * @returns {Promise<Object>} Tipo "proviene de" actualizado
 */
export const actualizarTipoProvieneDe = async (id, tipoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/tipo-proviene-de/${id}`, tipoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar tipo proviene de:', error);
    throw error;
  }
};

/**
 * Elimina un tipo "proviene de"
 * @param {number} id - ID del tipo "proviene de" a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarTipoProvieneDe = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/tipo-proviene-de/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar tipo proviene de:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getAllTipoProvieneDe = getTiposProvieneDe;
export const createTipoProvieneDe = crearTipoProvieneDe;
export const updateTipoProvieneDe = actualizarTipoProvieneDe;
export const deleteTipoProvieneDe = eliminarTipoProvieneDe;
