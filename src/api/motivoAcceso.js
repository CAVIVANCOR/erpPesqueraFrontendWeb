import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Motivo Acceso
 * Proporciona funciones para operaciones CRUD en el módulo de motivos de acceso
 */

/**
 * Obtiene todos los motivos de acceso
 * @returns {Promise} Lista de motivos de acceso
 */
export const getAllMotivoAcceso = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/motivo-acceso`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo motivo de acceso
 * @param {Object} motivoAccesoData - Datos del motivo de acceso
 * @returns {Promise} Motivo de acceso creado
 */
export const crearMotivoAcceso = async (motivoAccesoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/motivo-acceso`, motivoAccesoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un motivo de acceso existente
 * @param {number} id - ID del motivo de acceso
 * @param {Object} motivoAccesoData - Datos actualizados
 * @returns {Promise} Motivo de acceso actualizado
 */
export const actualizarMotivoAcceso = async (id, motivoAccesoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/motivo-acceso/${id}`, motivoAccesoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un motivo de acceso
 * @param {number} id - ID del motivo de acceso a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteMotivoAcceso = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/motivo-acceso/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createMotivoAcceso = crearMotivoAcceso;
export const updateMotivoAcceso = actualizarMotivoAcceso;
export const eliminarMotivoAcceso = deleteMotivoAcceso;
