import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Tipo Acceso Instalación
 * Proporciona funciones para operaciones CRUD en el módulo de tipos de acceso a instalaciones
 */

/**
 * Obtiene todos los tipos de acceso a instalaciones
 * @returns {Promise} Lista de tipos de acceso a instalaciones
 */
export const getAllTipoAccesoInstalacion = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/tipo-acceso-instalacion`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo tipo de acceso a instalación
 * @param {Object} tipoAccesoInstalacionData - Datos del tipo de acceso a instalación
 * @returns {Promise} Tipo de acceso a instalación creado
 */
export const crearTipoAccesoInstalacion = async (tipoAccesoInstalacionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/tipo-acceso-instalacion`, tipoAccesoInstalacionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un tipo de acceso a instalación existente
 * @param {number} id - ID del tipo de acceso a instalación
 * @param {Object} tipoAccesoInstalacionData - Datos actualizados
 * @returns {Promise} Tipo de acceso a instalación actualizado
 */
export const actualizarTipoAccesoInstalacion = async (id, tipoAccesoInstalacionData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/tipo-acceso-instalacion/${id}`, tipoAccesoInstalacionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un tipo de acceso a instalación
 * @param {number} id - ID del tipo de acceso a instalación a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteTipoAccesoInstalacion = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/tipo-acceso-instalacion/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createTipoAccesoInstalacion = crearTipoAccesoInstalacion;
export const updateTipoAccesoInstalacion = actualizarTipoAccesoInstalacion;
export const eliminarTipoAccesoInstalacion = deleteTipoAccesoInstalacion;
