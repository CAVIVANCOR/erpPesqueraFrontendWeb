import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-persona`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * API para gestión de Tipo Persona
 * Proporciona funciones para operaciones CRUD en el módulo de tipos de persona
 */

/**
 * Obtiene todos los tipos de persona
 * @returns {Promise} Lista de tipos de persona
 */
export const getAllTipoPersona = async () => {
  const response = await axios.get(API_URL, {headers: getAuthHeader()});
  return response.data;
};

/**
 * Crea un nuevo tipo de persona
 * @param {Object} tipoPersonaData - Datos del tipo de persona
 * @returns {Promise} Tipo de persona creado
 */
export const crearTipoPersona = async (tipoPersonaData) => {
  const response = await axios.post(API_URL, tipoPersonaData, {headers: getAuthHeader()});
  return response.data;
};

/**
 * Actualiza un tipo de persona existente
 * @param {number} id - ID del tipo de persona
 * @param {Object} tipoPersonaData - Datos actualizados
 * @returns {Promise} Tipo de persona actualizado
 */
export const actualizarTipoPersona = async (id, tipoPersonaData) => {
  const response = await axios.put(`${API_URL}/${id}`, tipoPersonaData, {headers: getAuthHeader()});
  return response.data;
};

/**
 * Elimina un tipo de persona
 * @param {number} id - ID del tipo de persona a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTipoPersona = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {headers: getAuthHeader()});
  return response.data;
};
