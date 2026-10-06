// src/api/tesoreria/operacionPrestamo.js
// Funciones de integración API REST para las operaciones de caja del préstamo bancario:
// pago de cuotas (egreso) y desembolso (ingreso)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/operaciones-prestamo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Pago de una o varias cuotas de un mismo préstamo con un solo egreso
 */
export async function pagarCuotasPrestamo(data) {
  const res = await axios.post(`${API_URL}/pagar-cuotas`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Copia voucher consolidado y comprobante del pago indicado a los demás pagos de la operación
 */
export async function sincronizarAdjuntosPagoCuotaPrestamo(pagoId) {
  const res = await axios.put(`${API_URL}/pagos/${pagoId}/sincronizar-adjuntos`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Desembolso del préstamo: ingreso del dinero a la cuenta de la empresa
 */
export async function desembolsarPrestamo(data) {
  const res = await axios.post(`${API_URL}/desembolsar`, data, { headers: getAuthHeaders() });
  return res.data;
}
