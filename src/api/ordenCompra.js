// src/api/ordenCompra.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/ordenes-compra`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getOrdenesCompra() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getOrdenCompraPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function crearOrdenCompra(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarOrdenCompra(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function eliminarOrdenCompra(id) {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function aprobarOrdenCompra(id) {
  const res = await axios.post(
    `${API_URL}/${id}/aprobar`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function anularOrdenCompra(id) {
  const res = await axios.post(
    `${API_URL}/${id}/anular`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function generarMovimientoAlmacen(id, data) {
  const res = await axios.post(`${API_URL}/${id}/generar-movimiento`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function generarOrdenDesdeRequerimiento(requerimientoCompraId) {
  const res = await axios.post(
    `${API_URL}/generar-desde-requerimiento`,
    { requerimientoCompraId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function regenerarKardexOrdenCompra(id) {
  const res = await axios.post(
    `${API_URL}/${id}/regenerar-kardex`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Generar Cuenta Por Pagar desde Orden de Compra
 * Crea una CxP y actualiza el estado de la OC a FACTURADA (113)
 * 
 * @param {number} id - ID de la orden de compra
 * @returns {Promise<Object>} Resultado con ordenCompra y cuentaPorPagar
 */
export async function generarCuentaPorPagar(id) {
  const res = await axios.post(
    `${API_URL}/${id}/generar-cxp`,
    {},
    { headers: getAuthHeaders() }
  );
  // El backend devuelve { success, mensaje, data: { ordenCompra, cuentaPorPagar } }
  return res.data.data || res.data;
}

/**
 * Reactivar Orden de Compra
 * Devuelve una OrdenCompra APROBADA al estado PENDIENTE
 * Elimina kardex, CuentaPorPagar (sin pagos) y AsientosContables
 * 
 * @param {number} id - ID de la orden de compra
 * @returns {Promise<Object>} Resultado con estadísticas
 */
export async function reactivarDocumentoOrdenCompra(id) {
  try {
    const response = await axios.put(`${API_URL}/${id}/reactivar`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al reactivar orden de compra:", error);
    throw error;
  }
}

/**
 * Eliminar asiento contable de una OrdenCompra
 * @param {number} ordenCompraId - ID de la orden de compra
 * @param {number} asientoId - ID del asiento a eliminar
 * @returns {Promise<Object>} - Confirmación
 */
export async function eliminarAsientoContable(ordenCompraId, asientoId) {
  try {
    const response = await axios.delete(
      `${API_URL}/${ordenCompraId}/asiento/${asientoId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar asiento contable:", error);
    throw error;
  }
}