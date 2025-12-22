// src/api/participanteReunion.js
// Funciones de integración API REST para ParticipanteReunion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/participantes-reunion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getParticipantesPorVideoconferencia(videoconferenciaId) {
  const res = await axios.get(`${API_URL}/videoconferencia/${videoconferenciaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getParticipanteReunionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearParticipanteReunion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarParticipanteReunion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarParticipanteReunion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Confirma asistencia de un participante
 */
export async function confirmarParticipanteReunion(id) {
  const res = await axios.post(`${API_URL}/${id}/confirmar`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Registra ingreso de un participante a la reunión
 */
export async function registrarIngresoParticipante(id) {
  const res = await axios.post(`${API_URL}/${id}/registrar-ingreso`, {}, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Registra salida de un participante de la reunión
 */
export async function registrarSalidaParticipante(id) {
  const res = await axios.post(`${API_URL}/${id}/registrar-salida`, {}, { headers: getAuthHeaders() });
  return res.data;
}
