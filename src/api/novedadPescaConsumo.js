import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/novedades-pesca-consumo`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * API para gestión de Novedad Pesca Consumo
 * Proporciona funciones para operaciones CRUD en el módulo de novedades de pesca de consumo
 */

/**
 * Obtiene todas las novedades de pesca de consumo
 * @returns {Promise} Lista de novedades de pesca de consumo
 */
export const getAllNovedadPescaConsumo = async () => {
  const response = await axios.get(API_URL, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Obtiene una novedad de pesca de consumo por ID
 * @param {number} id - ID de la novedad de pesca de consumo
 * @returns {Promise} Novedad de pesca de consumo
 */
export const getNovedadPescaConsumoPorId = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Crea una nueva novedad de pesca de consumo
 * @param {Object} novedadPescaConsumoData - Datos de la novedad de pesca de consumo
 * @returns {Promise} Novedad de pesca de consumo creada
 */
export const crearNovedadPescaConsumo = async (novedadPescaConsumoData) => {
  const response = await axios.post(API_URL, novedadPescaConsumoData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Actualiza una novedad de pesca de consumo existente
 * @param {number} id - ID de la novedad de pesca de consumo
 * @param {Object} novedadPescaConsumoData - Datos actualizados
 * @returns {Promise} Novedad de pesca de consumo actualizada
 */
export const actualizarNovedadPescaConsumo = async (id, novedadPescaConsumoData) => {
  const response = await axios.put(`${API_URL}/${id}`, novedadPescaConsumoData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Elimina una novedad de pesca de consumo
 * @param {number} id - ID de la novedad de pesca de consumo a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteNovedadPescaConsumo = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Sube documento PDF de resolución para novedad de pesca consumo
 * @param {File} file - Archivo PDF a subir
 * @returns {Promise} Respuesta con URL del documento subido
 */
export async function subirDocumentoNovedad(file) {
  const formData = new FormData();
  formData.append('resolucionPdf', file);
  const API_RESOLUCION = `${API_URL}/resolucion/upload`;
  const token = useAuthStore.getState().token;
  const res = await axios.post(API_RESOLUCION, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

/**
 * Inicia una novedad de pesca consumo
 * @param {number} novedadId - ID de la novedad a iniciar
 * @returns {Promise} Respuesta de la operación
 */
export async function iniciarNovedadPescaConsumo(novedadId) {
  const res = await axios.post(`${API_URL}/${novedadId}/iniciar`, {}, { 
    headers: getAuthHeader() 
  });
  return res.data;
}