import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Forma Transacción
 * Proporciona funciones para operaciones CRUD en el módulo de formas de transacción
 */

/**
 * Obtiene todas las formas de transacción
 * @returns {Promise} Lista de formas de transacción
 */
export const getAllFormaTransaccion = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/forma-transaccion`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva forma de transacción
 * @param {Object} formaTransaccionData - Datos de la forma de transacción
 * @returns {Promise} Forma de transacción creada
 */
export const crearFormaTransaccion = async (formaTransaccionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/forma-transaccion`, formaTransaccionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una forma de transacción existente
 * @param {number} id - ID de la forma de transacción
 * @param {Object} formaTransaccionData - Datos actualizados
 * @returns {Promise} Forma de transacción actualizada
 */
export const actualizarFormaTransaccion = async (id, formaTransaccionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/forma-transaccion/${id}`, formaTransaccionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una forma de transacción
 * @param {number} id - ID de la forma de transacción a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteFormaTransaccion = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/forma-transaccion/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createFormaTransaccion = crearFormaTransaccion;
export const updateFormaTransaccion = actualizarFormaTransaccion;
export const eliminarFormaTransaccion = deleteFormaTransaccion;
