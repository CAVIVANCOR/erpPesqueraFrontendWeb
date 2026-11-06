// src/api/recursosHumanos/planilla.js
// Funciones de integración API REST para Planillas (RRHH)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/planillas`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPlanillas(filtros = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params: filtros });
  return res.data;
}

/** Detalle completo: boletas por trabajador y sus conceptos. */
export async function getPlanillaById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/** Crea la planilla en PENDIENTE y calcula las boletas. */
export async function generarPlanilla(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/** Borra y recalcula las boletas (las correcciones manuales se pierden). */
export async function regenerarPlanilla(id, usuarioId) {
  const res = await axios.post(`${API_URL}/${id}/regenerar`, { usuarioId }, { headers: getAuthHeaders() });
  return res.data;
}

/** Corrige a mano el monto de un concepto de una boleta; el motivo es obligatorio. */
export async function corregirConceptoPlanilla(conceptoId, data) {
  const res = await axios.put(`${API_URL}/conceptos/${conceptoId}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function aprobarPlanillaJefePersonal(id, usuarioId) {
  const res = await axios.post(`${API_URL}/${id}/aprobar-jefe-personal`, { usuarioId }, { headers: getAuthHeaders() });
  return res.data;
}

/** Crea las deudas con el personal y el asiento contable. */
export async function aprobarPlanillaGerencia(id, usuarioId) {
  const res = await axios.post(`${API_URL}/${id}/aprobar-gerencia`, { usuarioId }, { headers: getAuthHeaders() });
  return res.data;
}

/** Elimina las deudas y el asiento de una planilla aprobada por gerencia (solo si no se pagó ninguna deuda). */
export async function revertirAprobacionPlanilla(id, usuarioId) {
  const res = await axios.post(`${API_URL}/${id}/revertir-aprobacion`, { usuarioId }, { headers: getAuthHeaders() });
  return res.data;
}

/** Líneas del archivo mensual de remuneraciones de PLAME (.rem) con su nombre oficial. */
export async function getDatosPlameMensual(empresaId, anio, mes) {
  const res = await axios.get(`${API_URL}/plame`, { params: { empresaId, anio, mes }, headers: getAuthHeaders() });
  return res.data;
}

/** Filas del archivo mensual "Declarar aportes" de AFPnet (consolida todas las planillas del mes de la empresa). */
export async function getDatosAfpnetMensual(empresaId, anio, mes) {
  const res = await axios.get(`${API_URL}/afpnet`, { params: { empresaId, anio, mes }, headers: getAuthHeaders() });
  return res.data;
}

export async function reabrirPlanilla(id, usuarioId) {
  const res = await axios.post(`${API_URL}/${id}/reabrir`, { usuarioId }, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePlanilla(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
