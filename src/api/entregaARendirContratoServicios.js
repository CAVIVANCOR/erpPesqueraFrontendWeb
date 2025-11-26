import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Entrega a Rendir Contratos de Servicios
 * Proporciona funciones para operaciones CRUD en el módulo de entregas a rendir de contratos de servicios
 */

/**
 * Obtiene todas las entregas a rendir de contratos de servicios
 * @returns {Promise} Lista de entregas a rendir de contratos de servicios
 */
export const getAllEntregaARendirContratoServicios = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-contrato-servicios`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene una entrega a rendir por ID
 * @param {number} id - ID de la entrega a rendir
 * @returns {Promise} Entrega a rendir
 */
export const getEntregaARendirContratoServiciosById = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-contrato-servicios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene una entrega a rendir por ID de contrato
 * @param {number} contratoServicioId - ID del contrato de servicio
 * @returns {Promise} Entrega a rendir
 */
export const getEntregaARendirPorContrato = async (contratoServicioId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/entregas-rendir-contrato-servicios/contrato/${contratoServicioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea una nueva entrega a rendir de contrato de servicio
 * @param {Object} entregaARendirData - Datos de la entrega a rendir
 * @returns {Promise} Entrega a rendir creada
 */
export const crearEntregaARendirContratoServicios = async (entregaARendirData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/entregas-rendir-contrato-servicios`, entregaARendirData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza una entrega a rendir de contrato de servicio existente
 * @param {number} id - ID de la entrega a rendir
 * @param {Object} entregaARendirData - Datos actualizados
 * @returns {Promise} Entrega a rendir actualizada
 */
export const actualizarEntregaARendirContratoServicios = async (id, entregaARendirData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/entregas-rendir-contrato-servicios/${id}`, entregaARendirData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina una entrega a rendir de contrato de servicio
 * @param {number} id - ID de la entrega a rendir a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteEntregaARendirContratoServicios = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/entregas-rendir-contrato-servicios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createEntregaARendirContratoServicios = crearEntregaARendirContratoServicios;
export const updateEntregaARendirContratoServicios = actualizarEntregaARendirContratoServicios;
export const eliminarEntregaARendirContratoServicios = deleteEntregaARendirContratoServicios;
