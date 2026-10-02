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

/**
 * Guardar la URL del voucher de la operación en la asignación atendida
 * @param {number|string} detMovsEntregaRendirId
 * @param {string} urlPdf
 */
export const actualizarUrlComprobanteAsignacion = async (detMovsEntregaRendirId, urlPdf) => {
  const response = await api.patch(
    `/tesoreria/atender-asignacion/${detMovsEntregaRendirId}/url-comprobante`,
    { urlPdf }
  );
  return response.data;
};
