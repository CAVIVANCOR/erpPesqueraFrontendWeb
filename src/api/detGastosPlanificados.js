// src/api/detGastosPlanificados.js
// Funciones de integración API REST para DetGastosPlanificados. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/gastos-planificados`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getAllGastosPlanificados(filtros = {}) {
  const res = await axios.get(API_URL, { 
    headers: getAuthHeaders(),
    params: filtros 
  });
  return res.data;
}

export const getGastosPlanificados = getAllGastosPlanificados;

export async function getGastoPlanificadoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearGastoPlanificado(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarGastoPlanificado(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarGastoPlanificado(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
