/**
 * API para tareas automáticas de tesorería
 */

import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tareas-automaticas`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Procesar cuotas vencidas manualmente
 */
export async function procesarCuotasVencidas() {
  const res = await axios.post(`${API_URL}/procesar-cuotas-vencidas`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Ejecutar todas las tareas automáticas
 */
export async function ejecutarTareasAutomaticas() {
  const res = await axios.post(`${API_URL}/ejecutar-todas`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
}