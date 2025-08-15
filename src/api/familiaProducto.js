/**
 * API para gestión de Familias de Producto
 * Implementa todas las operaciones CRUD con manejo de errores y autenticación JWT.
 * Endpoints: GET /api/familias-producto, POST /api/familias-producto, PUT /api/familias-producto/:id, DELETE /api/familias-producto/:id
 * Patrón aplicado: Axios con interceptores, manejo de errores HTTP, normalización de datos.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

// URL base de la API desde variables de entorno
const API_URL = `${import.meta.env.VITE_API_URL}/familias-producto`;

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
 * Obtiene todas las familias de producto
 * @returns {Promise<Array>} Lista de familias de producto
 */
export const getFamiliasProducto = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al obtener familias de producto:", error);
    throw error;
  }
};

/**
 * Obtiene una familia de producto por ID
 * @param {number} id - ID de la familia de producto
 * @returns {Promise<Object>} Datos de la familia de producto
 */
export const getFamiliaProductoPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener familia de producto ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva familia de producto
 * @param {Object} familiaProducto - Datos de la familia de producto
 * @param {string} familiaProducto.nombre - Nombre de la familia de producto (máximo 80 caracteres)
 * @returns {Promise<Object>} Familia de producto creada
 */
export const crearFamiliaProducto = async (familiaProducto) => {
  try {
    // Normalización de datos según reglas ERP Megui
    const datosNormalizados = {
      nombre: familiaProducto.nombre?.toUpperCase().trim(),
    };

    const response = await axios.post(API_URL, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al crear familia de producto:", error);
    throw error;
  }
};

/**
 * Actualiza una familia de producto existente
 * @param {number} id - ID de la familia de producto
 * @param {Object} familiaProducto - Datos actualizados de la familia de producto
 * @param {string} familiaProducto.nombre - Nombre de la familia de producto (máximo 80 caracteres)
 * @returns {Promise<Object>} Familia de producto actualizada
 */
export const actualizarFamiliaProducto = async (id, familiaProducto) => {
  try {
    // Normalización de datos según reglas ERP Megui
    const datosNormalizados = {
      nombre: familiaProducto.nombre?.toUpperCase().trim(),
    };

    const response = await axios.put(`${API_URL}/${id}`, datosNormalizados, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar familia de producto ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una familia de producto
 * @param {number} id - ID de la familia de producto a eliminar
 * @returns {Promise<void>}
 */
export const eliminarFamiliaProducto = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  } catch (error) {
    console.error(`Error al eliminar familia de producto ${id}:`, error);
    throw error;
  }
};
