import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/accesos-instalacion`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}


/**
 * Obtiene todos los accesos a instalaciones del sistema
 * @returns {Promise<Array>} Lista de accesos a instalaciones
 */
export const getAllAccesoInstalacion = async () => {
  try {
    const res = await axios.get(API_URL, { headers: getAuthHeader() });
    return res.data;
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
    const res = await axios.post(API_URL, accesoData, { headers: getAuthHeader() });
    return res.data;
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
    const res = await axios.put(`${API_URL}/${id}`, accesoData, { headers: getAuthHeader() });
    return res.data;
  } catch (error) {
    console.error('Error al actualizar acceso a instalación:', error);
    throw error;
  }
};

/**
 * Busca una persona por número de documento en accesos previos
 * @param {string} numeroDocumento - Número de documento a buscar
 * @returns {Promise<Object|null>} Datos de la persona si existe, null si no existe
 */
export const buscarPersonaPorDocumento = async (numeroDocumento) => {
  try {
    const res = await axios.get(`${API_URL}/buscar-persona/${numeroDocumento}`, { 
      headers: getAuthHeader() 
    });
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Persona no encontrada
    }
    console.error('Error al buscar persona por documento:', error);
    throw error;
  }
};

/**
 * Obtiene los datos completos de un acceso previo por número de documento
 * Incluye datos de persona, vehículo, equipo, etc.
 * @param {string} numeroDocumento - Número de documento
 * @returns {Promise<Object|null>} Datos completos del último acceso si existe
 */
export const obtenerDatosAccesoPrevio = async (numeroDocumento) => {
  try {
    const res = await axios.get(`${API_URL}/datos-previos/${numeroDocumento}`, { 
      headers: getAuthHeader() 
    });
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No hay accesos previos
    }
    console.error('Error al obtener datos de acceso previo:', error);
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
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar acceso a instalación:', error);
    throw error;
  }
};
