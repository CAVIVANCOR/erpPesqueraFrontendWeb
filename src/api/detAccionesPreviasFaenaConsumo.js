import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Acciones Previas Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de acciones previas de faenas de consumo
 */

/**
 * Obtiene todos los detalles de acciones previas de faenas de consumo
 * @returns {Promise} Lista de detalles de acciones previas de faenas de consumo
 */
export const getAllDetAccionesPreviasFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-acciones-previas-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de acciones previas de faena de consumo
 * @param {Object} detAccionesPreviasFaenaConsumoData - Datos del detalle de acciones previas de faena de consumo
 * @returns {Promise} Detalle de acciones previas de faena de consumo creado
 */
export const crearDetAccionesPreviasFaenaConsumo = async (detAccionesPreviasFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-acciones-previas-faena-consumo`, detAccionesPreviasFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de acciones previas de faena de consumo existente
 * @param {number} id - ID del detalle de acciones previas de faena de consumo
 * @param {Object} detAccionesPreviasFaenaConsumoData - Datos actualizados
 * @returns {Promise} Detalle de acciones previas de faena de consumo actualizado
 */
export const actualizarDetAccionesPreviasFaenaConsumo = async (id, detAccionesPreviasFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-acciones-previas-faena-consumo/${id}`, detAccionesPreviasFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de acciones previas de faena de consumo
 * @param {number} id - ID del detalle de acciones previas de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetAccionesPreviasFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-acciones-previas-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetAccionesPreviasFaenaConsumo = crearDetAccionesPreviasFaenaConsumo;
export const updateDetAccionesPreviasFaenaConsumo = actualizarDetAccionesPreviasFaenaConsumo;
export const eliminarDetAccionesPreviasFaenaConsumo = deleteDetAccionesPreviasFaenaConsumo;
