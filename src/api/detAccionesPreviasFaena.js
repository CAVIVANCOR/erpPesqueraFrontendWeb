import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';


const API_URL = `${import.meta.env.VITE_API_URL}/pesca/detalles-acciones-previas-faena`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los detalles de acciones previas de faena del sistema
 * @returns {Promise<Array>} Lista de detalles de acciones previas de faena
 */
export const getAllDetAccionesPreviasFaena = async (detAccionesPreviasId) => {
  try {
    const params = detAccionesPreviasId ? { detAccionesPreviasId } : {};
    const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
    return res.data;
  } catch (error) {
    console.error('Error al obtener detalles de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de acciones previas de faena
 * @param {Object} detalleData - Datos del detalle de acciones previas de faena
 * @returns {Promise<Object>} Detalle de acciones previas de faena creado
 */
export const crearDetAccionesPreviasFaena = async (detalleData) => {
  try {
    const response = await axios.post(`${API_URL}`, detalleData, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de acciones previas de faena existente
 * @param {number} id - ID del detalle de acciones previas de faena
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de acciones previas de faena actualizado
 */
export const actualizarDetAccionesPreviasFaena = async (id, detalleData) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, detalleData, { headers: getAuthHeader() });
    return res.data;
  } catch (error) {
    console.error('Error al actualizar detalle de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de acciones previas de faena
 * @param {number} id - ID del detalle de acciones previas de faena a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetAccionesPreviasFaena = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de acciones previas de faena:', error);
    throw error;
  }
};

/**
 * Obtiene los detalles de acciones previas de faena por temporada
 * @param {number} temporadaId - ID de la temporada de pesca
 * @returns {Promise<Array>} Lista de detalles de acciones previas de faena para la temporada
 */
export const obtenerDetAccionesPreviasFaenaPorTemporada = async (temporadaId) => {
  try {
    const response = await axios.get(`${API_URL}/temporada/${temporadaId}`, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de acciones previas de faena por temporada:', error);
    throw error;
  }
};
