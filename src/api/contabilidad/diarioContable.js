import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getLineasDiarioContable(params) {
  const res = await axios.get(`${API_URL}/contabilidad/diario-contable`, {
    headers: getAuthHeaders(),
    params
  });
  return res.data;
}

export async function exportarSUNAT51(params) {
  const res = await axios.get(`${API_URL}/contabilidad/diario-contable/exportar/sunat-51`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}

export async function exportarExcel(params) {
  const res = await axios.get(`${API_URL}/contabilidad/diario-contable/exportar/excel`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}

export async function exportarPDF(params) {
  const res = await axios.get(`${API_URL}/contabilidad/diario-contable/exportar/pdf`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}