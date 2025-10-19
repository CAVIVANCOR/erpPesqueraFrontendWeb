// src/api/saldosDetProductoCliente.js
// Funciones de integración API REST para SaldosDetProductoCliente. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/saldos-det-producto-cliente`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getSaldosDetProductoCliente(params = {}) {
  const res = await axios.get(API_URL, { 
    headers: getAuthHeaders(),
    params: params // Permite filtrar por empresaId, clienteId, esCustodia, etc.
  });
  return res.data;
}

/**
 * Obtiene saldos detallados con filtros específicos
 * @param {Object} filtros - Filtros de búsqueda
 * @param {number} [filtros.empresaId] - ID de la empresa
 * @param {number} [filtros.almacenId] - ID del almacén
 * @param {number} [filtros.clienteId] - ID del cliente
 * @param {boolean} [filtros.esCustodia] - Si es mercadería en custodia
 * @param {boolean} [filtros.soloConSaldo] - Solo productos con saldo > 0
 * @param {number} [filtros.productoId] - ID del producto
 * @param {number} [filtros.familiaId] - ID de la familia
 * @param {number} [filtros.subfamiliaId] - ID de la subfamilia
 * @param {number} [filtros.marcaId] - ID de la marca
 * @param {number} [filtros.procedenciaId] - ID de procedencia (país)
 * @param {number} [filtros.tipoAlmacenamientoId] - ID del tipo de almacenamiento
 * @param {number} [filtros.tipoMaterialId] - ID del tipo de material
 * @param {number} [filtros.unidadMedidaId] - ID de la unidad de medida
 * @param {number} [filtros.especieId] - ID de la especie
 * @returns {Promise<Array>} Lista de saldos detallados
 */
export async function getSaldosDetProductoClienteConFiltros(filtros = {}) {
  const params = new URLSearchParams();
  
  // Agregar filtros si existen
  Object.keys(filtros).forEach(key => {
    if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
      params.append(key, filtros[key]);
    }
  });
  
  const url = `${API_URL}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

export async function getSaldosDetProductoClientePorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearSaldosDetProductoCliente(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarSaldosDetProductoCliente(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarSaldosDetProductoCliente(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
