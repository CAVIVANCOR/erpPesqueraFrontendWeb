// src/api/tesoreria/tipoRetencionPercepcion.js
import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-retencion-percepcion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos de retención/percepción
 */
export async function getTiposRetencionPercepcion() {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de retención/percepción:', error);
    throw error;
  }
}

/**
 * Obtiene un tipo de retención/percepción por ID
 */
export async function getTipoRetencionPercepcionById(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipo de retención/percepción:', error);
    throw error;
  }
}