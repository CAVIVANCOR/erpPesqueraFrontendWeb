// c:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\api\movimientoCaja.js
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/movimientos-caja`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los movimientos de caja del sistema
 * @returns {Promise<Array>} Lista de movimientos de caja
 */
export const getAllMovimientoCaja = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener movimientos de caja:', error);
    throw error;
  }
};

/**
 * Crea un nuevo movimiento de caja
 * @param {Object} movimientoData - Datos del movimiento de caja
 * @returns {Promise<Object>} Movimiento de caja creado
 */
export const crearMovimientoCaja = async (movimientoData) => {
  try {
    const response = await axios.post(`${API_URL}`, movimientoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear movimiento de caja:', error);
    throw error;
  }
};

/**
 * Actualiza un movimiento de caja existente
 * @param {number} id - ID del movimiento de caja
 * @param {Object} movimientoData - Datos actualizados del movimiento
 * @returns {Promise<Object>} Movimiento de caja actualizado
 */
export const actualizarMovimientoCaja = async (id, movimientoData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, movimientoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar movimiento de caja:', error);
    throw error;
  }
};

/**
 * Elimina un movimiento de caja
 * @param {number} id - ID del movimiento de caja a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarMovimientoCaja = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar movimiento de caja:', error);
    throw error;
  }
};

/**
 * Valida un movimiento de caja y actualiza el origen correspondiente
 * @param {number} id - ID del movimiento de caja a validar
 * @returns {Promise<Object>} Movimiento de caja validado
 */
export const validarMovimientoCaja = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/validar`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al validar movimiento de caja:', error);
    throw error;
  }
};

/**
 * Aprueba un movimiento de caja
 * @param {number} id - ID del movimiento de caja a aprobar
 * @param {number} aprobadoPorId - ID del personal que aprueba
 * @returns {Promise<Object>} Movimiento de caja aprobado
 */
export const aprobarMovimientoCaja = async (id, aprobadoPorId) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/aprobar`, { aprobadoPorId }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al aprobar movimiento de caja:', error);
    throw error;
  }
};

/**
 * Rechaza un movimiento de caja
 * @param {number} id - ID del movimiento de caja a rechazar
 * @param {number} rechazadoPorId - ID del personal que rechaza
 * @param {string} motivoRechazo - Motivo del rechazo
 * @returns {Promise<Object>} Movimiento de caja rechazado
 */
export const rechazarMovimientoCaja = async (id, rechazadoPorId, motivoRechazo) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/rechazar`, { 
      rechazadoPorId, 
      motivoRechazo 
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al rechazar movimiento de caja:', error);
    throw error;
  }
};

/**
 * Revierte un movimiento de caja creando un movimiento inverso
 * @param {number} id - ID del movimiento de caja a revertir
 * @param {string} motivoReversion - Motivo de la reversión
 * @param {number} usuarioId - ID del usuario que revierte
 * @returns {Promise<Object>} Movimiento de reversión creado
 */
export const revertirMovimientoCaja = async (id, motivoReversion, usuarioId) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/revertir`, { 
      motivoReversion, 
      usuarioId 
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al revertir movimiento de caja:', error);
    throw error;
  }
};