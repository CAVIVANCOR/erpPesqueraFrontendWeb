import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tipos-acceso-instalacion`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * API para gestión de Tipo Acceso Instalación
 * Proporciona funciones para operaciones CRUD en el módulo de tipos de acceso a instalaciones
 */

/**
 * Obtiene todos los tipos de acceso a instalaciones
 * @returns {Promise} Lista de tipos de acceso a instalaciones
 */
export const getAllTipoAccesoInstalacion = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

/**
 * Crea un nuevo tipo de acceso a instalación
 * @param {Object} tipoAccesoInstalacionData - Datos del tipo de acceso a instalación
 * @returns {Promise} Tipo de acceso a instalación creado
 */
export const crearTipoAccesoInstalacion = async (tipoAccesoInstalacionData) => {
  const response = await axios.post(API_URL, tipoAccesoInstalacionData, { headers: getAuthHeader() });
  return response.data;
};

/**
 * Actualiza un tipo de acceso a instalación existente
 * @param {number} id - ID del tipo de acceso a instalación
 * @param {Object} tipoAccesoInstalacionData - Datos actualizados
 * @returns {Promise} Tipo de acceso a instalación actualizado
 */
export const actualizarTipoAccesoInstalacion = async (id, tipoAccesoInstalacionData) => {
  const response = await axios.put(`${API_URL}/${id}`, tipoAccesoInstalacionData, { headers: getAuthHeader() });
  return response.data;
};

/**
 * Elimina un tipo de acceso a instalación
 * @param {number} id - ID del tipo de acceso a instalación a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTipoAccesoInstalacion = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return response.data;
};

