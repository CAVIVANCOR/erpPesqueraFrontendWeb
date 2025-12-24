import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/saldos-cuenta-corriente`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los saldos de cuentas corrientes
 * @returns {Promise<Array>} Lista de saldos
 */
export const getAllSaldoCuentaCorriente = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener saldos:', error);
    throw error;
  }
};

/**
 * Obtiene un saldo por su ID
 * @param {number} id - ID del saldo
 * @returns {Promise<Object>} Saldo encontrado
 */
export const getSaldoCuentaCorrienteById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener saldo:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de saldos de una cuenta corriente
 * @param {number} cuentaCorrienteId - ID de la cuenta corriente
 * @param {Date} fechaInicio - Fecha de inicio (opcional)
 * @param {Date} fechaFin - Fecha de fin (opcional)
 * @returns {Promise<Array>} Historial de saldos
 */
export const getHistorialSaldos = async (cuentaCorrienteId, fechaInicio = null, fechaFin = null) => {
  try {
    const params = { cuentaCorrienteId };
    if (fechaInicio) params.fechaInicio = fechaInicio.toISOString();
    if (fechaFin) params.fechaFin = fechaFin.toISOString();

    const response = await axios.get(`${API_URL}/historial`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de saldos:', error);
    throw error;
  }
};

/**
 * Calcula el saldo actual de una cuenta corriente
 * @param {number} cuentaCorrienteId - ID de la cuenta corriente
 * @returns {Promise<Object>} Objeto con saldo actual
 */
export const calcularSaldoActual = async (cuentaCorrienteId) => {
  try {
    const response = await axios.get(`${API_URL}/saldo-actual`, {
      headers: getAuthHeader(),
      params: { cuentaCorrienteId }
    });
    return response.data;
  } catch (error) {
    console.error('Error al calcular saldo actual:', error);
    throw error;
  }
};

/**
 * Crea un nuevo saldo
 * @param {Object} saldoData - Datos del saldo
 * @returns {Promise<Object>} Saldo creado
 */
export const crearSaldoCuentaCorriente = async (saldoData) => {
  try {
    const response = await axios.post(`${API_URL}`, saldoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear saldo:', error);
    throw error;
  }
};

/**
 * Actualiza un saldo existente
 * @param {number} id - ID del saldo
 * @param {Object} saldoData - Datos actualizados
 * @returns {Promise<Object>} Saldo actualizado
 */
export const actualizarSaldoCuentaCorriente = async (id, saldoData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, saldoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar saldo:', error);
    throw error;
  }
};

/**
 * Elimina un saldo
 * @param {number} id - ID del saldo a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarSaldoCuentaCorriente = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar saldo:', error);
    throw error;
  }
};
