import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * API para obtener Faenas de Pesca
 * Proporciona funciones para obtener faenas de pesca utilizadas en otros módulos
 */

/**
 * Obtiene todas las faenas de pesca
 * @returns {Promise} Lista de faenas de pesca
 */
export const getFaenasPesca = async () => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/faena-pesca`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Obtiene todas las faenas de pesca (alias)
 * @returns {Promise} Lista de faenas de pesca
 */
export const getAllFaenasPesca = async () => {
  return getFaenasPesca();
};
