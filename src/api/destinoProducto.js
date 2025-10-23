import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/destinos-producto`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export const getAllDestinoProducto = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

export const crearDestinoProducto = async (destinoProductoData) => {
  const response = await axios.post(API_URL, destinoProductoData, { headers: getAuthHeaders() });
  return response.data;
};

export const actualizarDestinoProducto = async (id, destinoProductoData) => {
  const response = await axios.put(`${API_URL}/${id}`, destinoProductoData, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteDestinoProducto = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};