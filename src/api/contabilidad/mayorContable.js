import axios from 'axios';
import { useAuthStore } from '../../shared/stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getLineasMayorContable(params) {
  const res = await axios.get(`${API_URL}/contabilidad/mayor-contable`, {
    headers: getAuthHeaders(),
    params
  });
  return res.data;
}

export async function exportarSUNAT61(params) {
  const res = await axios.get(`${API_URL}/contabilidad/mayor-contable/export/sunat-61`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}

export async function exportarExcel(params) {
  const res = await axios.get(`${API_URL}/contabilidad/mayor-contable/export/excel`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}

export async function exportarPDF(params) {
  const res = await axios.get(`${API_URL}/contabilidad/mayor-contable/export/pdf`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}