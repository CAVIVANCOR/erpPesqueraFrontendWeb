import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/configuraciones-cuenta-contable`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todas las configuraciones de cuentas contables
 * @returns {Promise<Array>} Lista de configuraciones
 */
export const getAllConfiguracionCuentaContable = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    throw error;
  }
};

/**
 * Obtiene una configuración por su ID
 * @param {number} id - ID de la configuración
 * @returns {Promise<Object>} Configuración encontrada
 */
export const getConfiguracionCuentaContableById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración para una combinación específica
 * @param {number} empresaId - ID de la empresa
 * @param {number} tipoMovimientoId - ID del tipo de movimiento
 * @param {number} tipoReferenciaId - ID del tipo de referencia (opcional)
 * @returns {Promise<Object>} Configuración encontrada
 */
export const getConfiguracionEspecifica = async (empresaId, tipoMovimientoId, tipoReferenciaId = null) => {
  try {
    const params = { empresaId, tipoMovimientoId };
    if (tipoReferenciaId) params.tipoReferenciaId = tipoReferenciaId;

    const response = await axios.get(`${API_URL}/obtener-configuracion`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener configuración específica:', error);
    throw error;
  }
};

/**
 * Crea una nueva configuración
 * @param {Object} configData - Datos de la configuración
 * @returns {Promise<Object>} Configuración creada
 */
export const crearConfiguracionCuentaContable = async (configData) => {
  try {
    const response = await axios.post(`${API_URL}`, configData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear configuración:', error);
    throw error;
  }
};

/**
 * Actualiza una configuración existente
 * @param {number} id - ID de la configuración
 * @param {Object} configData - Datos actualizados
 * @returns {Promise<Object>} Configuración actualizada
 */
export const actualizarConfiguracionCuentaContable = async (id, configData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, configData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    throw error;
  }
};

/**
 * Elimina una configuración
 * @param {number} id - ID de la configuración a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarConfiguracionCuentaContable = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar configuración:', error);
    throw error;
  }
};
