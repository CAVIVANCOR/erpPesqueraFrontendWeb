import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/acciones-previas-faena`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las acciones previas de faena del sistema
 * @returns {Promise<Array>} Lista de acciones previas de faena
 */
export const getAllAccionesPreviasFaena = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener acciones previas de faena:", error);
    throw error;
  }
};

/**
 * Crea una nueva acción previa de faena
 * @param {Object} accionData - Datos de la acción previa de faena
 * @returns {Promise<Object>} Acción previa de faena creada
 */
export const crearAccionesPreviasFaena = async (accionData) => {
  try {
    const response = await axios.post(`${API_URL}`, accionData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear acción previa de faena:", error);
    throw error;
  }
};

/**
 * Actualiza una acción previa de faena existente
 * @param {number} id - ID de la acción previa de faena
 * @param {Object} accionData - Datos actualizados de la acción
 * @returns {Promise<Object>} Acción previa de faena actualizada
 */
export const actualizarAccionesPreviasFaena = async (id, accionData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, accionData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar acción previa de faena:", error);
    throw error;
  }
};

/**
 * Elimina una acción previa de faena
 * @param {number} id - ID de la acción previa de faena a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarAccionesPreviasFaena = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar acción previa de faena:", error);
    throw error;
  }
};
