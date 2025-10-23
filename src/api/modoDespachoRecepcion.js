import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/modo-despacho-recepcion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los modos de despacho y recepción
 * @returns {Promise} Lista de modos de despacho y recepción
 */
export const getAllModoDespachoRecepcion = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Crea un nuevo modo de despacho y recepción
 * @param {Object} modoDespachoRecepcionData - Datos del modo de despacho y recepción
 * @returns {Promise} Modo de despacho y recepción creado
 */
export const crearModoDespachoRecepcion = async (modoDespachoRecepcionData) => {
  const response = await axios.post(API_URL, modoDespachoRecepcionData, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Actualiza un modo de despacho y recepción existente
 * @param {number} id - ID del modo de despacho y recepción
 * @param {Object} modoDespachoRecepcionData - Datos actualizados
 * @returns {Promise} Modo de despacho y recepción actualizado
 */
export const actualizarModoDespachoRecepcion = async (id, modoDespachoRecepcionData) => {
  const response = await axios.put(`${API_URL}/${id}`, modoDespachoRecepcionData, { headers: getAuthHeaders() });
  return response.data;
};

/**
 * Elimina un modo de despacho y recepción
 * @param {number} id - ID del modo de despacho y recepción a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteModoDespachoRecepcion = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};