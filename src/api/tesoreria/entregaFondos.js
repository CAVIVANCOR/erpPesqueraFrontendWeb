import api from "../axios";

/**
 * Atender una asignación (Entrega de Fondos)
 * @param {Object} datos - Datos de la entrega
 * @returns {Promise} Respuesta del servidor
 */
export const atenderAsignacion = async (datos) => {
  const response = await api.post("/tesoreria/atender-asignacion", datos);
  return response.data;
};