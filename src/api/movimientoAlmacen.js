// src/api/movimientoAlmacen.js
// Funciones de integración API REST para MovimientoAlmacen. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/movimientos-almacen`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getMovimientosAlmacen() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getMovimientoAlmacenPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearMovimientoAlmacen(data) {

  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarMovimientoAlmacen(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarMovimientoAlmacen(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Cierra un movimiento de almacén y genera kardex y saldos.
 */
export async function cerrarMovimientoAlmacen(id) {
  const res = await axios.post(`${API_URL}/${id}/cerrar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Anula un movimiento de almacén (requiere supervisor autorizado).
 */
export async function anularMovimientoAlmacen(id, empresaId) {
  const res = await axios.post(`${API_URL}/${id}/anular`, { empresaId }, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Reactiva un documento de almacén (cambia estado a PENDIENTE).
 */
export async function reactivarDocumentoAlmacen(id) {
  const res = await axios.post(`${API_URL}/${id}/reactivar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Consulta el stock disponible de un producto.
 */
export async function consultarStockDisponible(empresaId, almacenId, productoId, clienteId, esCustodia) {
  const params = {
    empresaId,
    almacenId,
    productoId,
    ...(clienteId && { clienteId }),
    ...(esCustodia !== undefined && { esCustodia })
  };
  const res = await axios.get(`${API_URL}/stock/consultar`, { 
    params,
    headers: getAuthHeaders() 
  });
  return res.data;
}

/**
 * Obtiene series de documentos filtradas por empresaId, tipoDocumentoId y tipoAlmacenId.
 */
export async function getSeriesDoc(empresaId, tipoDocumentoId, tipoAlmacenId) {
  const params = {
    ...(empresaId && { empresaId }),
    ...(tipoDocumentoId && { tipoDocumentoId }),
    ...(tipoAlmacenId && { tipoAlmacenId })
  };
  const res = await axios.get(`${API_URL}/series-doc`, { 
    params,
    headers: getAuthHeaders() 
  });
  return res.data;
}

/**
 * Crea un detalle de movimiento de almacén
 */
export async function crearDetalleMovimiento(data) {
  const DETALLE_URL = `${import.meta.env.VITE_API_URL}/detalles-movimiento-almacen`;
  const res = await axios.post(DETALLE_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un detalle de movimiento de almacén
 */
export async function actualizarDetalleMovimiento(id, data) {
  const DETALLE_URL = `${import.meta.env.VITE_API_URL}/detalles-movimiento-almacen`;
  const res = await axios.put(`${DETALLE_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un detalle de movimiento de almacén
 */
export async function eliminarDetalleMovimiento(id) {
  const DETALLE_URL = `${import.meta.env.VITE_API_URL}/detalles-movimiento-almacen`;
  const res = await axios.delete(`${DETALLE_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
