// src/api/contabilidad/documentosOrigen.js
// Funciones de integración API REST para Documentos Origen. Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contabilidad/documentos-origen`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene documentos origen por modelo
 * @param {string} nombreModelo - Nombre del modelo (PreFactura, OrdenCompra, etc.)
 * @param {number} entidadComercialId - ID de la entidad comercial
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Array>} Lista de documentos origen
 */
export async function getDocumentosOrigenPorModelo(nombreModelo, entidadComercialId, empresaId) {
  const res = await axios.get(`${API_URL}/${nombreModelo}`, {
    headers: getAuthHeaders(),
    params: {
      entidadComercialId,
      empresaId,
    },
  });
  return res.data;
}