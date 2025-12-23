// src/api/notificacion.js
// Funciones de integración API REST para Notificaciones. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/notificaciones`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las notificaciones del usuario autenticado
 * @param {Object} filtros - Filtros opcionales { leida, tipo, limit, offset }
 */
export async function getNotificaciones(filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.leida !== undefined) {
    params.append('leida', filtros.leida);
  }
  if (filtros.tipo) {
    params.append('tipo', filtros.tipo);
  }
  if (filtros.limit) {
    params.append('limit', filtros.limit);
  }
  if (filtros.offset) {
    params.append('offset', filtros.offset);
  }

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Cuenta las notificaciones no leídas del usuario
 */
export async function contarNoLeidas() {
  const res = await axios.get(`${API_URL}/no-leidas/count`, { 
    headers: getAuthHeaders() 
  });
  return res.data.count;
}

/**
 * Marca una notificación como leída
 * @param {string|number} id - ID de la notificación
 */
export async function marcarComoLeida(id) {
  const res = await axios.put(`${API_URL}/${id}/leida`, {}, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function marcarTodasComoLeidas() {
  const res = await axios.put(`${API_URL}/marcar-todas-leidas`, {}, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

/**
 * Elimina una notificación
 * @param {string|number} id - ID de la notificación
 */
export async function eliminarNotificacion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}
