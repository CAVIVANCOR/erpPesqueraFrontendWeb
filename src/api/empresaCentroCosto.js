import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/empresas-centro-costo`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todas las relaciones empresa-centro de costo del sistema
 * @returns {Promise<Array>} Lista de relaciones empresa-centro de costo
 */
export const getAllEmpresaCentroCosto = async () => {
  try {
    const res = await axios.get(API_URL, { headers: getAuthHeader() });
    return res.data;
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
    const response = await axios.post(API_URL, relacionData, {
      headers: getAuthHeader()
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
    const response = await axios.put(`${API_URL}/${id}`, relacionData, {
      headers: getAuthHeader()
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
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
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
