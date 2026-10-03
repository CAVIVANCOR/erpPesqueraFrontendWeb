import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/atender-asignacion`;

// La instancia compartida de ../axios no agrega el token a las peticiones y su interceptor
// cierra la sesión ante cualquier 401: se usa el mismo patrón del resto de APIs de Tesorería.
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Atender una asignación (Entrega de Fondos)
 * @param {Object} datos - Datos de la entrega
 * @returns {Promise} Respuesta del servidor
 */
export const atenderAsignacion = async (datos) => {
  const response = await axios.post(API_URL, datos, { headers: getAuthHeaders() });
  return response.data;
};
