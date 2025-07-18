import axios from "axios";
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Instancia centralizada de Axios para la API backend.
 */
const apiBackend = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Interceptor global para capturar errores 401 y ejecutar logout y redirección
 */
apiBackend.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export default apiBackend;

