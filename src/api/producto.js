// src/api/producto.js
// Funciones de integración API REST para Producto. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/productos`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Sube una foto de producto al servidor.
 * @param {number} id - ID del producto.
 * @param {File} archivoFoto - Archivo de la foto a subir.
 * @returns {Promise<object>} - Objeto con la respuesta del servidor.
 */
export const subirFotoProducto = async (id, archivoFoto) => {
  const formData = new FormData();
  formData.append('foto', archivoFoto);
  const token = useAuthStore.getState().token;
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/producto-foto/${id}/foto`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

/**
 * Obtiene productos con filtros opcionales
 * @param {Object} filtros - Filtros de búsqueda 
 * @param {number|string} [filtros.empresaId] - ID de la empresa
 * @param {number|string} [filtros.clienteId] - ID del cliente
 * @param {number|string} [filtros.familiaId] - ID de la familia
 * @param {number|string} [filtros.subfamiliaId] - ID de la subfamilia
 * @param {number|string} [filtros.tipoAlmacenamientoId] - ID del tipo de almacenamiento
 * @param {number|string} [filtros.unidadMedidaId] - ID de la unidad de medida
 * @param {string} [filtros.busqueda] - Término de búsqueda general
 * @returns {Promise<Array>} Lista de productos
 */
export async function getProductos(filtros = {}) {
  const params = new URLSearchParams();
  // Convertir a número los IDs que deberían ser numéricos
  const filtrosParseados = {
    ...filtros,
    empresaId: filtros.empresaId ? Number(filtros.empresaId) : undefined,
    clienteId: filtros.clienteId ? Number(filtros.clienteId) : undefined,
    familiaId: filtros.familiaId ? Number(filtros.familiaId) : undefined,
    subfamiliaId: filtros.subfamiliaId ? Number(filtros.subfamiliaId) : undefined,
    tipoAlmacenamientoId: filtros.tipoAlmacenamientoId ? Number(filtros.tipoAlmacenamientoId) : undefined,
    unidadMedidaId: filtros.unidadMedidaId ? Number(filtros.unidadMedidaId) : undefined,
  };

  // Agregar cada filtro si tiene valor
  const filtrosAplicar = [
    'empresaId',
    'clienteId',
    'familiaId',
    'subfamiliaId',
    'tipoAlmacenamientoId',
    'unidadMedidaId',
    'busqueda'
  ];
  filtrosAplicar.forEach(key => {
    if (filtrosParseados[key] !== undefined && 
        filtrosParseados[key] !== null && 
        filtrosParseados[key] !== '') {
      params.append(key, filtrosParseados[key]);
    }
  });
  const url = `${API_URL}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

export async function getProductosPorEntidadYEmpresa(entidadComercialId, empresaId) {
  const res = await axios.get(`${API_URL}/entidad/${entidadComercialId}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getProductoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearProducto(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarProducto(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarProducto(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
