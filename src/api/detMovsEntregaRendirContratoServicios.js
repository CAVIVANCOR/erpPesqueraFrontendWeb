import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para gestión de Detalle Movimientos Entrega Rendir Contratos de Servicios
 * Proporciona funciones para operaciones CRUD en el módulo de detalles de movimientos de entregas a rendir de contratos de servicios
 */

/**
 * Obtiene todos los detalles de movimientos de entregas a rendir de contratos de servicios
 * @returns {Promise} Lista de detalles de movimientos
 */
export const getAllDetMovsEntregaRendirContratoServicios = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-contrato-servicios`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene un detalle de movimiento por ID
 * @param {number} id - ID del detalle de movimiento
 * @returns {Promise} Detalle de movimiento
 */
export const getDetMovsEntregaRendirContratoServiciosById = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-contrato-servicios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene movimientos por ID de entrega
 * @param {number} entregaId - ID de la entrega a rendir
 * @returns {Promise} Lista de movimientos
 */
export const getDetMovsPorEntrega = async (entregaId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/det-movs-entrega-rendir-contrato-servicios/entrega/${entregaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Crea un nuevo detalle de movimiento de entrega a rendir de contrato de servicio
 * @param {Object} detMovsData - Datos del detalle de movimiento
 * @returns {Promise} Detalle de movimiento creado
 */
export const crearDetMovsEntregaRendirContratoServicios = async (detMovsData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/det-movs-entrega-rendir-contrato-servicios`, detMovsData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Actualiza un detalle de movimiento de entrega a rendir de contrato de servicio existente
 * @param {number} id - ID del detalle de movimiento
 * @param {Object} detMovsData - Datos actualizados
 * @returns {Promise} Detalle de movimiento actualizado
 */
export const actualizarDetMovsEntregaRendirContratoServicios = async (id, detMovsData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/det-movs-entrega-rendir-contrato-servicios/${id}`, detMovsData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Elimina un detalle de movimiento de entrega a rendir de contrato de servicio
 * @param {number} id - ID del detalle de movimiento a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const deleteDetMovsEntregaRendirContratoServicios = async (id) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/det-movs-entrega-rendir-contrato-servicios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aliases en inglés para compatibilidad
export const createDetMovsEntregaRendirContratoServicios = crearDetMovsEntregaRendirContratoServicios;
export const updateDetMovsEntregaRendirContratoServicios = actualizarDetMovsEntregaRendirContratoServicios;
export const eliminarDetMovsEntregaRendirContratoServicios = deleteDetMovsEntregaRendirContratoServicios;
