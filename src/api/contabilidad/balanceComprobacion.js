import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getBalanceComprobacion(params) {
  const res = await axios.get(`${API_URL}/contabilidad/balance-comprobacion`, {
    headers: getAuthHeaders(),
    params
  });
  return res.data;
}

export async function exportarSUNATBalance(params) {
  const res = await axios.get(`${API_URL}/contabilidad/balance-comprobacion/export/sunat-08`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}

export const exportarSUNATBalanceGeneral = async (params) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key]);
    }
  });
  
  const response = await fetch(`${API_URL}/contabilidad/balance-comprobacion/exportar-sunat-316?${queryParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al exportar Balance General SUNAT');
  }

  return await response.blob();
};

export const exportarSUNATEstadoGyP = async (params) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key]);
    }
  });
  
  const response = await fetch(`${API_URL}/contabilidad/balance-comprobacion/exportar-sunat-320?${queryParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al exportar Estado de G&P SUNAT');
  }

  return await response.blob();
};