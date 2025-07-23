import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Modo Despacho Recepción
 * Proporciona funciones para operaciones CRUD en el módulo de modos de despacho y recepción
 */

/**
 * Obtiene todos los modos de despacho y recepción
 * @returns {Promise} Lista de modos de despacho y recepción
 */
export const getAllModoDespachoRecepcion = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/modo-despacho-recepcion`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo modo de despacho y recepción
 * @param {Object} modoDespachoRecepcionData - Datos del modo de despacho y recepción
 * @returns {Promise} Modo de despacho y recepción creado
 */
export const crearModoDespachoRecepcion = async (modoDespachoRecepcionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/modo-despacho-recepcion`, modoDespachoRecepcionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un modo de despacho y recepción existente
 * @param {number} id - ID del modo de despacho y recepción
 * @param {Object} modoDespachoRecepcionData - Datos actualizados
 * @returns {Promise} Modo de despacho y recepción actualizado
 */
export const actualizarModoDespachoRecepcion = async (id, modoDespachoRecepcionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/modo-despacho-recepcion/${id}`, modoDespachoRecepcionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un modo de despacho y recepción
 * @param {number} id - ID del modo de despacho y recepción a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteModoDespachoRecepcion = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/modo-despacho-recepcion/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createModoDespachoRecepcion = crearModoDespachoRecepcion;
export const updateModoDespachoRecepcion = actualizarModoDespachoRecepcion;
export const eliminarModoDespachoRecepcion = deleteModoDespachoRecepcion;
