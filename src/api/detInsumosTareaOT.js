import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Insumos Tarea OT
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de insumos de tareas de órdenes de trabajo
 */

/**
 * Obtiene todos los detalles de insumos de tareas OT
 * @returns {Promise} Lista de detalles de insumos de tareas OT
 */
export const getAllDetInsumosTareaOT = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-insumos-tarea-ot`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de insumos de tarea OT
 * @param {Object} detInsumosTareaOTData - Datos del detalle de insumos de tarea OT
 * @returns {Promise} Detalle de insumos de tarea OT creado
 */
export const crearDetInsumosTareaOT = async (detInsumosTareaOTData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-insumos-tarea-ot`, detInsumosTareaOTData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de insumos de tarea OT existente
 * @param {number} id - ID del detalle de insumos de tarea OT
 * @param {Object} detInsumosTareaOTData - Datos actualizados
 * @returns {Promise} Detalle de insumos de tarea OT actualizado
 */
export const actualizarDetInsumosTareaOT = async (id, detInsumosTareaOTData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-insumos-tarea-ot/${id}`, detInsumosTareaOTData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de insumos de tarea OT
 * @param {number} id - ID del detalle de insumos de tarea OT a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetInsumosTareaOT = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-insumos-tarea-ot/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetInsumosTareaOT = crearDetInsumosTareaOT;
export const updateDetInsumosTareaOT = actualizarDetInsumosTareaOT;
export const eliminarDetInsumosTareaOT = deleteDetInsumosTareaOT;
