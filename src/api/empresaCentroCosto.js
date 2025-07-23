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
 * Obtiene todas las relaciones empresa-centro de costo del sistema
 * @returns {Promise<Array>} Lista de relaciones empresa-centro de costo
 */
export const getAllEmpresaCentroCosto = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/empresa-centro-costo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener relaciones empresa-centro de costo:', error);
    throw error;
  }
};

/**
 * Crea una nueva relación empresa-centro de costo
 * @param {Object} relacionData - Datos de la relación empresa-centro de costo
 * @returns {Promise<Object>} Relación empresa-centro de costo creada
 */
export const crearEmpresaCentroCosto = async (relacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/empresa-centro-costo`, relacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear relación empresa-centro de costo:', error);
    throw error;
  }
};

/**
 * Actualiza una relación empresa-centro de costo existente
 * @param {number} id - ID de la relación empresa-centro de costo
 * @param {Object} relacionData - Datos actualizados de la relación
 * @returns {Promise<Object>} Relación empresa-centro de costo actualizada
 */
export const actualizarEmpresaCentroCosto = async (id, relacionData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/empresa-centro-costo/${id}`, relacionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar relación empresa-centro de costo:', error);
    throw error;
  }
};

/**
 * Elimina una relación empresa-centro de costo
 * @param {number} id - ID de la relación empresa-centro de costo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarEmpresaCentroCosto = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/empresa-centro-costo/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar relación empresa-centro de costo:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getEmpresaCentroCosto = getAllEmpresaCentroCosto;
export const createEmpresaCentroCosto = crearEmpresaCentroCosto;
export const updateEmpresaCentroCosto = actualizarEmpresaCentroCosto;
export const deleteEmpresaCentroCosto = eliminarEmpresaCentroCosto;
