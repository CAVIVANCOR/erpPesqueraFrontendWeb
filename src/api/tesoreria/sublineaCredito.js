import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

export const getSublineasCredito = async () => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${API_URL}/tesoreria/sublineas-credito`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener sublíneas de crédito:', error);
    throw error;
  }
};

export const getSublineasCreditoActivas = async () => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${API_URL}/tesoreria/sublineas-credito/activas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener sublíneas activas:', error);
    throw error;
  }
};

export const getSublineasCreditoPorLinea = async (lineaCreditoId) => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${API_URL}/tesoreria/sublineas-credito/linea/${lineaCreditoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener sublíneas por línea:', error);
    throw error;
  }
};

export const getSublineaCreditoById = async (id) => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${API_URL}/tesoreria/sublineas-credito/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener sublínea de crédito:', error);
    throw error;
  }
};

export const createSublineaCredito = async (data) => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.post(`${API_URL}/tesoreria/sublineas-credito`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear sublínea de crédito:', error);
    throw error;
  }
};

export const updateSublineaCredito = async (id, data) => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.put(`${API_URL}/tesoreria/sublineas-credito/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar sublínea de crédito:', error);
    throw error;
  }
};

export const deleteSublineaCredito = async (id) => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.delete(`${API_URL}/tesoreria/sublineas-credito/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar sublínea de crédito:', error);
    throw error;
  }
};

export const actualizarMontoUtilizado = async (id) => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.post(`${API_URL}/tesoreria/sublineas-credito/${id}/actualizar-monto`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar monto utilizado:', error);
    throw error;
  }
};