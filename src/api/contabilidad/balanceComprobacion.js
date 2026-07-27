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
    params,
    paramsSerializer: {
      serialize: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value);
          }
        });
        const serialized = searchParams.toString();
        return serialized;
      }
    }
  });
  return res.data;
}