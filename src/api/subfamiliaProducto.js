/**
 * API para gestión de Subfamilias de Producto
 * Implementa todas las operaciones CRUD con manejo de errores y autenticación JWT.
 * Endpoints: GET /api/subfamilias-producto, POST /api/subfamilias-producto, PUT /api/subfamilias-producto/:id, DELETE /api/subfamilias-producto/:id
 * Patrón aplicado: Axios con interceptores, manejo de errores HTTP, normalización de datos.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/subfamilias-producto`;

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
 * Obtiene todas las subfamilias de producto
 * @returns {Promise<Array>} Lista de subfamilias de producto con relación a familia
 */
export const getSubfamiliasProducto = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al obtener subfamilias de producto:", error);
    throw error;
  }
};

/**
 * Obtiene una subfamilia de producto por ID
 * @param {number} id - ID de la subfamilia de producto
 * @returns {Promise<Object>} Datos de la subfamilia de producto
 */
export const getSubfamiliaProductoPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener subfamilia de producto ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva subfamilia de producto
 * @param {Object} subfamiliaProducto - Datos de la subfamilia de producto
 * @param {string} subfamiliaProducto.nombre - Nombre de la subfamilia de producto (máximo 80 caracteres)
 * @param {number} subfamiliaProducto.familiaId - ID de la familia de producto
 * @returns {Promise<Object>} Subfamilia de producto creada
 */
export const crearSubfamiliaProducto = async (subfamiliaProducto) => {
  try {
    // Normalización de datos según reglas ERP Megui
    const datosNormalizados = {
      nombre: subfamiliaProducto.nombre?.toUpperCase().trim(),
      familiaId: Number(subfamiliaProducto.familiaId),
    };

    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al crear subfamilia de producto:", error);
    throw error;
  }
};

/**
 * Actualiza una subfamilia de producto existente
 * @param {number} id - ID de la subfamilia de producto
 * @param {Object} subfamiliaProducto - Datos actualizados de la subfamilia de producto
 * @param {string} subfamiliaProducto.nombre - Nombre de la subfamilia de producto (máximo 80 caracteres)
 * @param {number} subfamiliaProducto.familiaId - ID de la familia de producto
 * @returns {Promise<Object>} Subfamilia de producto actualizada
 */
export const actualizarSubfamiliaProducto = async (id, subfamiliaProducto) => {
  try {
    // Normalización de datos según reglas ERP Megui
    const datosNormalizados = {
      nombre: subfamiliaProducto.nombre?.toUpperCase().trim(),
      familiaId: Number(subfamiliaProducto.familiaId),
    };

    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar subfamilia de producto ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una subfamilia de producto
 * @param {number} id - ID de la subfamilia de producto a eliminar
 * @returns {Promise<void>}
 */
export const eliminarSubfamiliaProducto = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  } catch (error) {
    console.error(`Error al eliminar subfamilia de producto ${id}:`, error);
    throw error;
  }
};
