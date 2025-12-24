import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/asientos-contables-interfaz`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los asientos contables interfaz del sistema
 * @returns {Promise<Array>} Lista de asientos contables interfaz
 */
export const getAllAsientoContableInterfaz = async () => {
  try {
    const response = await axios.get(API_URL, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al obtener asientos contables interfaz:', error);
    throw error;
  }
};

/**
 * Crea un nuevo asiento contable interfaz
 * @param {Object} asientoData - Datos del asiento contable interfaz
 * @returns {Promise<Object>} Asiento contable interfaz creado
 */
export const crearAsientoContableInterfaz = async (asientoData) => {
  try {
    const response = await axios.post(API_URL, asientoData, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al crear asiento contable interfaz:', error);
    throw error;
  }
};

/**
 * Actualiza un asiento contable interfaz existente
 * @param {number} id - ID del asiento contable interfaz
 * @param {Object} asientoData - Datos actualizados del asiento
 * @returns {Promise<Object>} Asiento contable interfaz actualizado
 */
export const actualizarAsientoContableInterfaz = async (id, asientoData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, asientoData, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al actualizar asiento contable interfaz:', error);
    throw error;
  }
};

/**
 * Elimina un asiento contable interfaz
 * @param {number} id - ID del asiento contable interfaz a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAsientoContableInterfaz = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al eliminar asiento contable interfaz:', error);
    throw error;
  }
};

/**
 * Envía un asiento contable a contabilidad
 * @param {number} id - ID del asiento contable a enviar
 * @param {number} enviadoPorId - ID del personal que envía
 * @returns {Promise<Object>} Asiento contable enviado
 */
export const enviarAsientoContable = async (id, enviadoPorId) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/enviar`, { enviadoPorId }, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al enviar asiento contable:', error);
    throw error;
  }
};

/**
 * Registra un error en el envío de un asiento contable
 * @param {number} id - ID del asiento contable
 * @param {string} mensajeError - Mensaje de error
 * @returns {Promise<Object>} Asiento contable actualizado
 */
export const registrarErrorAsientoContable = async (id, mensajeError) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/registrar-error`, { mensajeError }, {headers: getAuthHeader()});
    return response.data;
  } catch (error) {
    console.error('Error al registrar error de asiento contable:', error);
    throw error;
  }
};
