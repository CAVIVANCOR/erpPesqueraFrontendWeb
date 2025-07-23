import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Documentación Embarcación Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de documentación de embarcaciones de pesca de consumo
 */

/**
 * Obtiene todos los detalles de documentación de embarcaciones de pesca de consumo
 * @returns {Promise} Lista de detalles de documentación de embarcaciones de pesca de consumo
 */
export const getAllDetDocEmbarcacionPescaConsumo = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-doc-embarcacion-pesca-consumo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de documentación de embarcación de pesca de consumo
 * @param {Object} detDocEmbarcacionPescaConsumoData - Datos del detalle de documentación de embarcación de pesca de consumo
 * @returns {Promise} Detalle de documentación de embarcación de pesca de consumo creado
 */
export const crearDetDocEmbarcacionPescaConsumo = async (detDocEmbarcacionPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-doc-embarcacion-pesca-consumo`, detDocEmbarcacionPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de documentación de embarcación de pesca de consumo existente
 * @param {number} id - ID del detalle de documentación de embarcación de pesca de consumo
 * @param {Object} detDocEmbarcacionPescaConsumoData - Datos actualizados
 * @returns {Promise} Detalle de documentación de embarcación de pesca de consumo actualizado
 */
export const actualizarDetDocEmbarcacionPescaConsumo = async (id, detDocEmbarcacionPescaConsumoData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-doc-embarcacion-pesca-consumo/${id}`, detDocEmbarcacionPescaConsumoData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de documentación de embarcación de pesca de consumo
 * @param {number} id - ID del detalle de documentación de embarcación de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetDocEmbarcacionPescaConsumo = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-doc-embarcacion-pesca-consumo/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetDocEmbarcacionPescaConsumo = crearDetDocEmbarcacionPescaConsumo;
export const updateDetDocEmbarcacionPescaConsumo = actualizarDetDocEmbarcacionPescaConsumo;
export const eliminarDetDocEmbarcacionPescaConsumo = deleteDetDocEmbarcacionPescaConsumo;
