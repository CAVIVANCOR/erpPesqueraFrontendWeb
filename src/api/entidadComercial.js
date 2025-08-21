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
  console.log("proveedores gps");
  const res = await axios.get(`${API_URL}/proveedores-gps`, { headers: getAuthHeaders() });
  console.log("proveedores gps",res.data);
  return res.data;
}
