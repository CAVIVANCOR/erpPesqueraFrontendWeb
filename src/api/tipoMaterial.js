/**
 * API para gestión de Tipos de Material
 * Implementa todas las operaciones CRUD con manejo de errores y autenticación JWT.
 * Endpoints: GET /api/tipos-material, POST /api/tipos-material, PUT /api/tipos-material/:id, DELETE /api/tipos-material/:id
 * Patrón aplicado: Axios con interceptores, manejo de errores HTTP, normalización de datos.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/tipos-material`;

/**
 * Configuración de headers con autenticación JWT
 * Obtiene el token desde el store global de autenticación
 */
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Obtiene todos los tipos de material
 * @returns {Promise<Array>} Lista de tipos de material
 */
export const getTiposMaterial = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de material:", error);
    throw error;
  }
};

/**
 * Obtiene un tipo de material por ID
 * @param {number} id - ID del tipo de material
 * @returns {Promise<Object>} Datos del tipo de material
 */
export const getTipoMaterialPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener tipo de material ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de material
 * @param {Object} tipoMaterial - Datos del tipo de material
 * @param {string} tipoMaterial.nombre - Nombre del tipo de material (máximo 80 caracteres)
 * @returns {Promise<Object>} Tipo de material creado
 */
export const crearTipoMaterial = async (tipoMaterial) => {
  try {
    const response = await axios.post(API_URL, tipoMaterial, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al crear tipo de material:", error);
    throw error;
  }
};

/**
 * Actualiza un tipo de material existente
 * @param {number} id - ID del tipo de material
 * @param {Object} tipoMaterial - Datos actualizados del tipo de material
 * @param {string} tipoMaterial.nombre - Nombre del tipo de material (máximo 80 caracteres)
 * @returns {Promise<Object>} Tipo de material actualizado
 */
export const actualizarTipoMaterial = async (id, tipoMaterial) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, tipoMaterial, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar tipo de material ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un tipo de material
 * @param {number} id - ID del tipo de material a eliminar
 * @returns {Promise<void>}
 */
export const eliminarTipoMaterial = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  } catch (error) {
    console.error(`Error al eliminar tipo de material ${id}:`, error);
    throw error;
  }
};
