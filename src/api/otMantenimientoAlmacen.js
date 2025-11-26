import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para Integración OT Mantenimiento con Almacén
 * Proporciona funciones para validación de stock y generación de movimientos
 */

/**
 * Valida stock disponible para los insumos de una tarea
 * @param {number} tareaId - ID de la tarea
 * @param {number} empresaId - ID de la empresa
 * @param {number} almacenId - ID del almacén
 * @returns {Promise} Resultado de validación
 */
export const validarStockTarea = async (tareaId, empresaId, almacenId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(
    `${API_URL}/ot-mantenimiento-almacen/validar-stock/tarea/${tareaId}`,
    {
      params: { empresaId, almacenId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Valida stock disponible para todas las tareas de una OT
 * @param {number} otMantenimientoId - ID de la OT
 * @param {number} empresaId - ID de la empresa
 * @param {number} almacenId - ID del almacén
 * @returns {Promise} Resultado de validación consolidado
 */
export const validarStockOT = async (otMantenimientoId, empresaId, almacenId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(
    `${API_URL}/ot-mantenimiento-almacen/validar-stock/ot/${otMantenimientoId}`,
    {
      params: { empresaId, almacenId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Obtiene stock disponible de un producto específico
 * @param {number} productoId - ID del producto
 * @param {number} empresaId - ID de la empresa
 * @param {number} almacenId - ID del almacén
 * @returns {Promise} Stock disponible
 */
export const obtenerStockProducto = async (productoId, empresaId, almacenId) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(
    `${API_URL}/ot-mantenimiento-almacen/stock/producto/${productoId}`,
    {
      params: { empresaId, almacenId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Genera movimiento de salida de almacén para insumos de una tarea
 * @param {number} tareaId - ID de la tarea
 * @param {Object} data - Datos del movimiento (empresaId, almacenId, conceptoMovAlmacenId)
 * @returns {Promise} Resultado de la operación
 */
export const generarSalidaInsumos = async (tareaId, data) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(
    `${API_URL}/ot-mantenimiento-almacen/generar-salida/tarea/${tareaId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
