// src/api/unidadMedida.js
// Funciones de integración API REST para UnidadMedida. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/unidades-medida`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getUnidadesMedida() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene unidades de medida filtradas por esMedidaMetrica = true
 * Para uso en dropdowns de medidas específicas (diámetro, ancho, alto, largo, espesor, ángulo)
 */
export async function getUnidadesMedidaMetricas() {
  const res = await axios.get(`${API_URL}/metricas`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene la unidad de medida por defecto para métricas (nombre="S/UM" y esMedidaMetrica=true)
 * Para establecer valores por defecto en campos de dimensiones
 */
export async function getUnidadMetricaDefault() {
  const res = await axios.get(`${API_URL}/default-metrica`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getUnidadMedidaPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearUnidadMedida(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarUnidadMedida(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarUnidadMedida(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
