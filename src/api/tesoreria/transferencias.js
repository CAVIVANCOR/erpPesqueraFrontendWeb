// src/api/tesoreria/transferencias.js
// Funciones de integración API REST para Transferencias Internas

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/transferencias`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Procesar transferencia interna entre dos cuentas corrientes
 */
export async function procesarTransferenciaInterna(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualizar URL del voucher consolidado
 */
export async function actualizarUrlVoucherConsolidado(movimientoId, urlPdf) {
  const res = await axios.patch(`${API_URL}/${movimientoId}/voucher-consolidado`, 
    { urlPdf }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Actualizar URL del voucher individual
 */
export async function actualizarUrlVoucherIndividual(movimientoId, urlPdf) {
  const res = await axios.patch(`${API_URL}/movimiento/${movimientoId}/voucher-individual`, 
    { urlVoucherIndividual: urlPdf }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Actualizar URL del voucher bancario
 */
export async function actualizarUrlVoucherBancario(movimientoId, urlPdf) {
  const res = await axios.patch(`${API_URL}/movimiento/${movimientoId}/voucher-bancario`, 
    { urlPdf }, 
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Subir archivo de voucher bancario
 */
export async function subirVoucherBancario(file, movimientoId) {
  const formData = new FormData();
  formData.append('voucher', file);
  formData.append('movimientoId', movimientoId);

  const res = await axios.post(`${API_URL}/upload-voucher`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
