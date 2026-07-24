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