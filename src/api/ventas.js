// src/api/ventas.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/ventas`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Descarga el PDF de una pre-factura desde SUNAT vía json.pe
 * @param {number} empresaId - ID de la empresa
 * @param {number} preFacturaId - ID de la pre-factura
 * @param {string} tipoDoc - Código SUNAT del tipo de documento
 * @param {string} serie - Serie del comprobante
 * @param {string} correlativo - Número correlativo
 * @returns {Promise<{success: boolean, pdfUrl?: string, message?: string}>}
 */
export async function descargarPDFParaPreFactura(empresaId, preFacturaId, tipoDoc, serie, correlativo) {
  const response = await axios.post(
    `${API_URL}/descargar-pdf-pre-factura`,
    {
      empresaId,
      preFacturaId,
      tipoDoc,
      serie,
      correlativo
    },
    { headers: getAuthHeaders() }
  );
  return response.data;
}
