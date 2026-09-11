import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}
/**
 * Obtiene todos los detalles de movimientos entrega a rendir del sistema
 * @returns {Promise<Array>} Lista de detalles de movimientos entrega a rendir
 */
export const getAllDetMovsEntregaRendir = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Crea un nuevo detalle de movimientos entrega a rendir
 * @param {Object} detalleData - Datos del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir creado
 */
export const crearDetMovsEntregaRendir = async (detalleData) => {
  try {
    const response = await axios.post(API_URL, detalleData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de movimientos entrega a rendir existente
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @param {Object} detalleData - Datos actualizados del detalle
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir actualizado
 */
export const actualizarDetMovsEntregaRendir = async (id, detalleData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, detalleData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de movimientos entrega a rendir
 * @param {number} id - ID del detalle de movimientos entrega a rendir a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetMovsEntregaRendir = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle de movimientos entrega a rendir:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de movimientos entrega a rendir por ID
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Detalle de movimientos entrega a rendir
 */
export const getDetMovsEntregaRendirPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de movimientos entrega a rendir por ID:', error);
    throw error;
  }
};

/**
 * Obtiene un detalle de movimientos entrega a rendir con gastos asociados
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Detalle con gastos asociados
 */
export const obtenerDetMovsEntregaRendirConGastos = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/con-gastos`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle con gastos asociados:', error);
    throw error;
  }
};


/**
 * Obtiene todas las asignaciones no liquidadas de todos los módulos
 * @returns {Promise<Array>} Lista de asignaciones no liquidadas
 */
export const obtenerTodasAsignacionesNoLiquidadas = async () => {
  try {
    const response = await axios.get(`${API_URL}/asignaciones/no-liquidadas`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener asignaciones no liquidadas:', error);
    throw error;
  }
};

/**
 * Obtiene los valores iniciales para un nuevo detalle de movimiento
 * @param {string} moduloOrigen - Módulo de origen (PESCA_INDUSTRIAL, PESCA_CONSUMO, etc.)
 * @param {number} documentoOrigenId - ID del documento origen (temporadaPescaId)
 * @returns {Promise<Object>} Valores iniciales (enlaceAOtroDetalleGastoId, embarcacionId)
 */
export const obtenerValoresIniciales = async (moduloOrigen, documentoOrigenId) => {
  try {
    const response = await axios.get(`${API_URL}/valores-iniciales`, {
      params: { moduloOrigen, documentoOrigenId },
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener valores iniciales:', error);
    throw error;
  }
};


/**
 * Obtiene el label formateado de un enlace a otro detalle de gasto
 * @param {number} enlaceId - ID del enlace
 * @returns {Promise<string|null>} Label formateado o null
 */
export const obtenerLabelEnlace = async (enlaceId) => {
  try {
    const response = await axios.get(`${API_URL}/${enlaceId}/label-enlace`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener label de enlace:', error);
    return null;
  }
};


/**
 * Liquida una asignación (marca como liquidada y calcula saldo final)
 * @param {number} asignacionId - ID de la asignación a liquidar
 * @returns {Promise<Object>} Asignación liquidada con saldo final calculado
 */
export const liquidarAsignacion = async (asignacionId) => {
  try {
    const response = await axios.post(`${API_URL}/${asignacionId}/liquidar`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al liquidar asignación:', error);
    throw error;
  }
};

/**
 * Obtiene el saldo inicial para una nueva asignación
 * @param {number} empresaId - ID de la empresa
 * @param {number} moduloOrigenId - ID del módulo origen
 * @param {number} documentoOrigenId - ID del documento origen (temporadaPescaId)
 * @param {string} fechaMovimiento - Fecha del movimiento (ISO string)
 * @returns {Promise<number>} Saldo inicial calculado
 */
export const obtenerSaldoInicial = async (empresaId, moduloOrigenId, documentoOrigenId, fechaMovimiento) => {
  try {
    const response = await axios.get(`${API_URL}/saldo-inicial`, {
      params: { empresaId, moduloOrigenId, documentoOrigenId, fechaMovimiento },
      headers: getAuthHeaders()
    });
    return response.data.saldoInicial;
  } catch (error) {
    console.error('Error al obtener saldo inicial:', error);
    throw error;
  }
};

/**
 * Calcula el saldo final de una asignación
 * @param {number} asignacionId - ID de la asignación
 * @returns {Promise<number>} Saldo final calculado
 */
export const calcularSaldoFinal = async (asignacionId) => {
  try {
    const response = await axios.get(`${API_URL}/${asignacionId}/saldo-final`, {
      headers: getAuthHeaders()
    });
    return response.data.saldoFinal;
  } catch (error) {
    console.error('Error al calcular saldo final:', error);
    throw error;
  }
};


export const recalcularSaldosResponsable = async (responsableId) => {
  try {
    const response = await axios.post(
      `${API_URL}/recalcular-saldos/${responsableId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error al recalcular saldos del responsable:', error);
    throw error;
  }
};



/**
 * Asigna un centro de costo a múltiples movimientos de forma masiva
 * @param {number} centroCostoId - ID del centro de costo a asignar
 * @param {Array<number>} movimientosIds - Array de IDs de movimientos a actualizar
 * @returns {Promise<Object>} Resultado de la asignación masiva
 */
export const asignarCentroCostoMasivo = async (centroCostoId, movimientosIds) => {
  try {
    const response = await axios.post(
      `${API_URL}/asignar-centro-costo-masivo`,
      { centroCostoId, movimientosIds },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error al asignar centro de costo masivo:', error);
    throw error;
  }
};

/**
 * Asigna un activo a múltiples movimientos de forma masiva
 * Actualiza el campo activoAfectoId en todos los movimientos seleccionados
 * 
 * @param {number} activoId - ID del activo a asignar
 * @param {Array<number>} movimientosIds - Array de IDs de movimientos a actualizar
 * @returns {Promise<Object>} Resultado de la asignación masiva con cantidad de registros actualizados
 * @throws {Error} Si la petición falla o el servidor retorna error
 * 
 * @example
 * const resultado = await asignarActivoMasivo(5, [1, 2, 3, 4]);
 * // { success: true, count: 4, message: "Activo asignado correctamente" }
 */
export const asignarActivoMasivo = async (activoId, movimientosIds) => {
  try {
    const response = await axios.post(
      `${API_URL}/asignar-activo-masivo`,
      { activoId, movimientosIds },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error al asignar activo masivo:', error);
    throw error;
  }
};

/**
 * Genera documentos financieros automáticamente desde DetMovsEntregaRendir
 * Genera: OrdenCompra → CuentaPorPagar → Pago → 2 Asientos Contables
 * @param {number} id - ID del detalle de movimientos entrega a rendir
 * @returns {Promise<Object>} Resultado de la generación con IDs de documentos creados
 */
export const generarDocumentosFinancieros = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/${id}/generar-documentos-financieros`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error al generar documentos financieros:', error);
    throw error;
  }
};