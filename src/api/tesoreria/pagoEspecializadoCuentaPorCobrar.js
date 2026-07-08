// src/api/tesoreria/pagoEspecializadoCuentaPorCobrar.js
// Funciones de integración API REST para Pago Especializado Cuenta Por Cobrar

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pagos-especializados-cxc`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Procesar pago especializado de cuenta por cobrar
 */
export async function procesarPagoEspecializado(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener detalle completo de un pago especializado
 */
export async function obtenerDetallePago(pagoId) {
  const res = await axios.get(`${API_URL}/${pagoId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener todos los pagos de una operación por correlativo
 */
export async function obtenerPagosPorCorrelativo(empresaId, correlativo) {
  const res = await axios.get(`${API_URL}/correlativo/${empresaId}/${correlativo}`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

/**
 * Listar pagos especializados por empresa con filtros opcionales
 */
export async function listarPagosEspecializados(empresaId, filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros.clienteId) params.append('clienteId', filtros.clienteId);
  if (filtros.monedaId) params.append('monedaId', filtros.monedaId);
  
  const queryString = params.toString();
  const url = `${API_URL}/empresa/${empresaId}${queryString ? `?${queryString}` : ''}`;
  
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtener resumen completo de una operación por correlativo
 */
export async function obtenerResumenOperacion(empresaId, correlativo) {
  const res = await axios.get(`${API_URL}/resumen/${empresaId}/${correlativo}`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

/**
 * Actualizar URL del voucher consolidado
 */
export async function actualizarUrlVoucherConsolidado(movimientoIngresoId, urlPdf) {
  const res = await axios.patch(`${API_URL}/voucher-consolidado/${movimientoIngresoId}`, 
    { urlPdf }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Actualizar URL del voucher individual
 */
export async function actualizarUrlVoucherIndividual(movimientoId, urlPdf) {
  const res = await axios.patch(`${API_URL}/voucher-individual/${movimientoId}`, 
    { urlPdf }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}
