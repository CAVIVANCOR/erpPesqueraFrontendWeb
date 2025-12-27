import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contabilidad/enums`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * Obtiene todos los enums del módulo de contabilidad
 */
export const getEnumsContabilidad = async () => {
  const response = await axios.get(API_URL, getAuthHeaders());
  return response.data;
};
