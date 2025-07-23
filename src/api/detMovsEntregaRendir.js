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
 * Obtiene todos los detalles de movimientos entrega a rendir del sistema
 * @returns {Promise<Array>} Lista de detalles de movimientos entrega a rendir
 */
export const getAllDetMovsEntregaRendir = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/det-movs-entrega-rendir`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de movimientos entrega a rendir
 * @param {Object} detalleData - Datos del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir creado
 */
export const crearDetMovsEntregaRendir = async (detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/det-movs-entrega-rendir`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de movimientos entrega a rendir existente
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir actualizado
 */
export const actualizarDetMovsEntregaRendir = async (id, detalleData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/det-movs-entrega-rendir/${id}`, detalleData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de movimientos entrega a rendir
 * @param {number} id - ID del detalle de movimientos entrega a rendir a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetMovsEntregaRendir = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/det-movs-entrega-rendir/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getDetMovsEntregaRendir = getAllDetMovsEntregaRendir;
export const createDetMovsEntregaRendir = crearDetMovsEntregaRendir;
export const updateDetMovsEntregaRendir = actualizarDetMovsEntregaRendir;
export const deleteDetMovsEntregaRendir = eliminarDetMovsEntregaRendir;
