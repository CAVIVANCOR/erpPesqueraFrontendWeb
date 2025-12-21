// src/api/entidadComercial.js
// Funciones de integración API REST para EntidadComercial. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/entidades-comerciales`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getEntidadesComerciales() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getEntidadComercialPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearEntidadComercial(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarEntidadComercial(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarEntidadComercial(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene las agencias de envío (entidades comerciales del tipo "AGENCIA DE ENVIO")
 * @returns {Promise<Array>} Lista de agencias de envío con estructura {id, razonSocial}
 */
export async function getAgenciasEnvio() {
  const res = await axios.get(`${API_URL}/agencias-envio`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene los proveedores GPS (entidades comerciales del tipo "PROVEEDOR EQUIPOS GEOLOCALIZACION")
 * @returns {Promise<Array>} Lista de proveedores GPS con estructura {id, razonSocial}
 */
export async function getProveedoresGps() {
  const res = await axios.get(`${API_URL}/proveedores-gps`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene proveedores filtrados por empresa para dropdowns.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de proveedores activos con estructura para dropdown
 */
export async function getProveedoresPorEmpresa(empresaId) {
  const params = { empresaId, esProveedor: true, estado: true };
  const res = await axios.get(API_URL, { params, headers: getAuthHeaders() });
  return res.data.map(proveedor => ({
    ...proveedor,
    label: proveedor.razonSocial || proveedor.nombreComercial,
    value: Number(proveedor.id)
  }));
}

/**
 * Obtiene clientes filtrados por empresa para dropdowns de descarga de faena.
 * Filtra por: tipoEntidadId=8 (CLIENTE MERCADERIAS), esCliente=true, estado=true
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de clientes activos con estructura para dropdown
 */
export async function getClientesPorEmpresa(empresaId) {
  // Obtener todos los registros de EntidadComercial
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  // Filtrar localmente según los criterios especificados
  const clientesFiltrados = res.data.filter(entidad => 
    Number(entidad.empresaId) === Number(empresaId) &&
    Number(entidad.tipoEntidadId) === 8 && // CLIENTE MERCADERIAS
    entidad.esCliente === true &&
    entidad.estado === true
  );
  
  // Normalizar datos para dropdown
  return clientesFiltrados.map(cliente => ({
    ...cliente,
    label: cliente.razonSocial || cliente.nombreComercial,
    value: Number(cliente.id)
  }));
}

/**
 * Clona una EntidadComercial y sus tablas relacionadas a todas las demás empresas del grupo
 * @param {number} id - ID de la entidad comercial a clonar
 * @returns {Promise<Object>} Resumen de operaciones realizadas
 */
export async function clonarEntidadAEmpresas(id) {
  const res = await axios.post(`${API_URL}/${id}/clonar-a-empresas`, {}, { headers: getAuthHeaders() });
  return res.data;
}
