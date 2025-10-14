import axios from './axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/centros-almacen`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getCentrosAlmacen = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

export const getCentroAlmacenById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const crearCentroAlmacen = async (data) => {
  const response = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return response.data;
};

export const actualizarCentroAlmacen = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return response.data;
};

export const eliminarCentroAlmacen = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return response.data;
};