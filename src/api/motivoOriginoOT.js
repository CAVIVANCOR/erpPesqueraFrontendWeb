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
 * Obtiene todos los motivos que originan OT del sistema
 * @returns {Promise<Array>} Lista de motivos que originan OT
 */
export const getAllMotivoOriginoOT = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/motivo-origino-ot`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener motivos que originan OT:', error);
    throw error;
  }
};

/**
 * Crea un nuevo motivo que origina OT
 * @param {Object} motivoData - Datos del motivo que origina OT
 * @returns {Promise<Object>} Motivo que origina OT creado
 */
export const crearMotivoOriginoOT = async (motivoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/motivo-origino-ot`, motivoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear motivo que origina OT:', error);
    throw error;
  }
};

/**
 * Actualiza un motivo que origina OT existente
 * @param {number} id - ID del motivo que origina OT
 * @param {Object} motivoData - Datos actualizados del motivo
 * @returns {Promise<Object>} Motivo que origina OT actualizado
 */
export const actualizarMotivoOriginoOT = async (id, motivoData) => {
  try {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/motivo-origino-ot/${id}`, motivoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar motivo que origina OT:', error);
    throw error;
  }
};

/**
 * Elimina un motivo que origina OT
 * @param {number} id - ID del motivo que origina OT a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarMotivoOriginoOT = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/motivo-origino-ot/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar motivo que origina OT:', error);
    throw error;
  }
};

// Aliases en inglés para compatibilidad
export const getMotivoOriginoOT = getAllMotivoOriginoOT;
export const createMotivoOriginoOT = crearMotivoOriginoOT;
export const updateMotivoOriginoOT = actualizarMotivoOriginoOT;
export const deleteMotivoOriginoOT = eliminarMotivoOriginoOT;
