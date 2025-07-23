import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Documentación Tripulantes Faena Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de documentación de tripulantes de faenas de consumo
 */

/**
 * Obtiene todos los detalles de documentación de tripulantes de faenas de consumo
 * @returns {Promise} Lista de detalles de documentación de tripulantes de faenas de consumo
 */
export const getAllDetDocTripulantesFaenaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-doc-tripulantes-faena-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de documentación de tripulantes de faena de consumo
 * @param {Object} detDocTripulantesFaenaConsumoData - Datos del detalle de documentación de tripulantes de faena de consumo
 * @returns {Promise} Detalle de documentación de tripulantes de faena de consumo creado
 */
export const crearDetDocTripulantesFaenaConsumo = async (detDocTripulantesFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-doc-tripulantes-faena-consumo`, detDocTripulantesFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de documentación de tripulantes de faena de consumo existente
 * @param {number} id - ID del detalle de documentación de tripulantes de faena de consumo
 * @param {Object} detDocTripulantesFaenaConsumoData - Datos actualizados
 * @returns {Promise} Detalle de documentación de tripulantes de faena de consumo actualizado
 */
export const actualizarDetDocTripulantesFaenaConsumo = async (id, detDocTripulantesFaenaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-doc-tripulantes-faena-consumo/${id}`, detDocTripulantesFaenaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de documentación de tripulantes de faena de consumo
 * @param {number} id - ID del detalle de documentación de tripulantes de faena de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetDocTripulantesFaenaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-doc-tripulantes-faena-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetDocTripulantesFaenaConsumo = crearDetDocTripulantesFaenaConsumo;
export const updateDetDocTripulantesFaenaConsumo = actualizarDetDocTripulantesFaenaConsumo;
export const eliminarDetDocTripulantesFaenaConsumo = deleteDetDocTripulantesFaenaConsumo;
