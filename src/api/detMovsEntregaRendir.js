import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}
/**
 * Obtiene todos los detalles de movimientos entrega a rendir del sistema
 * @returns {Promise<Array>} Lista de detalles de movimientos entrega a rendir
 */
export const getAllDetMovsEntregaRendir = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de movimientos entrega a rendir
 * @param {Object} detalleData - Datos del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir creado
 */
export const crearDetMovsEntregaRendir = async (detalleData) => {
  try {
    const response = await axios.post(API_URL, detalleData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de movimientos entrega a rendir existente
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir actualizado
 */
export const actualizarDetMovsEntregaRendir = async (id, detalleData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, detalleData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de movimientos entrega a rendir
 * @param {number} id - ID del detalle de movimientos entrega a rendir a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetMovsEntregaRendir = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de movimientos entrega a rendir con gastos asociados
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Detalle con gastos asociados
 */
export const obtenerDetMovsEntregaRendirConGastos = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/con-gastos`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle con gastos asociados:', error);
    throw error;
  }
};


/**
 * Obtiene todas las asignaciones no liquidadas de todos los módulos
 * @returns {Promise<Array>} Lista de asignaciones no liquidadas
 */
export const obtenerTodasAsignacionesNoLiquidadas = async () => {
  try {
    const response = await axios.get(`${API_URL}/asignaciones/no-liquidadas`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener asignaciones no liquidadas:', error);
    throw error;
  }
};

/**
 * Obtiene los valores iniciales para un nuevo detalle de movimiento
 * @param {string} moduloOrigen - Módulo de origen (PESCA_INDUSTRIAL, PESCA_CONSUMO, etc.)
 * @param {number} entregaARendirId - ID de la entrega a rendir
 * @returns {Promise<Object>} Valores iniciales (enlaceAOtroDetalleGastoId, embarcacionId)
 */
export const obtenerValoresIniciales = async (moduloOrigen, entregaARendirId) => {
  try {
    const response = await axios.get(`${API_URL}/valores-iniciales`, {
      params: { moduloOrigen, entregaARendirId },
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener valores iniciales:', error);
    throw error;
  }
};