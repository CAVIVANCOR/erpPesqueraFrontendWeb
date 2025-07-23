import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Permiso Autorización
 * Proporciona funciones para operaciones CRUD en el módulo de permisos de autorización
 */

/**
 * Obtiene todos los permisos de autorización
 * @returns {Promise} Lista de permisos de autorización
 */
export const getPermisosAutorizacion = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/permiso-autorizacion`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene todos los permisos de autorización (alias)
 * @returns {Promise} Lista de permisos de autorización
 */
export const getAllPermisoAutorizacion = async () => {
  return getPermisosAutorizacion();
};

/**
 * Crea un nuevo permiso de autorización
 * @param {Object} permisoAutorizacionData - Datos del permiso de autorización
 * @returns {Promise} Permiso de autorización creado
 */
export const crearPermisoAutorizacion = async (permisoAutorizacionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/permiso-autorizacion`, permisoAutorizacionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un permiso de autorización existente
 * @param {number} id - ID del permiso de autorización
 * @param {Object} permisoAutorizacionData - Datos actualizados
 * @returns {Promise} Permiso de autorización actualizado
 */
export const actualizarPermisoAutorizacion = async (id, permisoAutorizacionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/permiso-autorizacion/${id}`, permisoAutorizacionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un permiso de autorización
 * @param {number} id - ID del permiso de autorización a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const eliminarPermisoAutorizacion = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/permiso-autorizacion/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createPermisoAutorizacion = crearPermisoAutorizacion;
export const updatePermisoAutorizacion = actualizarPermisoAutorizacion;
export const deletePermisoAutorizacion = eliminarPermisoAutorizacion;
