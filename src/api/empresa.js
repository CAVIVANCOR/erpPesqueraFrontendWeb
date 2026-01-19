// src/api/empresa.js
// API centralizada para gestión de empresas en el ERP Megui.
// Todas las funciones devuelven promesas y usan autenticación JWT desde useAuthStore.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/empresas`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todas las empresas.
 * @returns {Promise<Array>} Lista de empresas
 */
/**
 * Obtiene todas las empresas.
 * @returns {Promise<Array>} Lista de empresas
 */
/**
 * Obtiene todas las empresas y las mapea para uso en combos PrimeReact.
 * El campo visible es 'razonSocial' (nombre legal), igual que en AreaFisicaForm.
 * Si no existe 'razonSocial', usa 'nombre'.
 * Esto garantiza coherencia y compatibilidad visual en todos los formularios del ERP Megui.
 */
export const getAllEmpresas = async () => {
  const res = await axios.get(API_URL, { headers: getAuthHeader() });
  // Soporta tanto { empresas: [...] } como un array directo
  const lista = Array.isArray(res.data) ? res.data : (res.data.empresas || []);
  // Devuelve los datos exactamente como vienen del backend, sin alias ni mapeos adicionales
  return lista;
};

export const getEmpresas = getAllEmpresas;

/**
 * Obtiene una empresa por ID.
 * @param {number|string} id - ID de la empresa
 * @returns {Promise<Object>} Empresa encontrada
 */
export const getEmpresaPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Crea una nueva empresa.
 * @param {Object} data - Datos de la empresa
 * @returns {Promise<Object>} Empresa creada
 */
export const crearEmpresa = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza una empresa existente.
 * @param {number|string} id - ID de la empresa
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Empresa actualizada
 */
export const actualizarEmpresa = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Elimina una empresa por ID.
 * @param {number|string} id - ID de la empresa
 * @returns {Promise<void>} 
 */
export const eliminarEmpresa = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};

/**
 * Propaga los márgenes de utilidad de la empresa a todos sus productos.
 * @param {number|string} id - ID de la empresa
 * @returns {Promise<Object>} Resultado de la propagación con cantidad de productos actualizados
 */
export const propagarMargenes = async (id) => {
  const res = await axios.post(`${API_URL}/${id}/propagar-margenes`, {}, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Sube el logo de una empresa al backend.
 * @param {number|string} empresaId - ID de la empresa
 * @param {File} file - Archivo de imagen a subir
 * @returns {Promise<Object>} Respuesta del backend con nombre y URL del logo
 */
export const subirLogoEmpresa = async (empresaId, file) => {
  const formData = new FormData();
  formData.append('logo', file);
  // Endpoint profesional para upload de logo
  const API_LOGO = `${import.meta.env.VITE_API_URL}/empresas-logo/${empresaId}/logo`;
  const res = await axios.post(API_LOGO, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

/**
 * Obtiene los parámetros de liquidación de pesca de una empresa.
 * @param {number|string} empresaId - ID de la empresa
 * @returns {Promise<Object>} Parámetros de liquidación
 */
export const getParametrosLiquidacion = async (empresaId) => {
  const res = await axios.get(`${API_URL}/${empresaId}/parametros-liquidacion`, { headers: getAuthHeader() });
  return res.data;
};