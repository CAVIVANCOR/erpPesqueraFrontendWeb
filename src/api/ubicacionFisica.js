// src/api/ubicacionFisica.js
// Funciones de integración API REST para UbicacionFisica. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/ubicaciones-fisicas`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getAllUbicacionesFisicas(almacenId = null) {
  const params = almacenId ? { almacenId } : {};
  const res = await axios.get(API_URL, { 
    headers: getAuthHeaders(),
    params 
  });
  return res.data;
}

export const getUbicacionesFisicas = getAllUbicacionesFisicas;

export async function getUbicacionFisicaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearUbicacionFisica(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarUbicacionFisica(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarUbicacionFisica(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
