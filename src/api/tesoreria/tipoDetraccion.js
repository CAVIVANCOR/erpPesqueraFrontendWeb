// src/api/tesoreria/tipoDetraccion.js
import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/tipos-detraccion`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los tipos de detracción
 */
export async function getTiposDetraccion() {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipos de detracción:', error);
    throw error;
  }
}

/**
 * Obtiene un tipo de detracción por ID
 */
export async function getTipoDetraccionById(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener tipo de detracción:', error);
    throw error;
  }
}