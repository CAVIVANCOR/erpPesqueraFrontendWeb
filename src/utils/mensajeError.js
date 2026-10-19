/**
 * Mensaje de error para mostrar al usuario (toast).
 *
 * Regla del sistema: el usuario siempre debe saber qué falló y qué corregir. Por eso se usa el mensaje
 * específico que devuelve el servidor (mensaje / message / error) y solo si no existe se cae a un texto
 * que indica la acción que falló y, cuando se conoce, el código de respuesta o la falta de conexión.
 *
 * @param {Error} error - Error capturado (normalmente de axios)
 * @param {string} accionFallida - Qué se estaba haciendo, p. ej. "No se pudo guardar el personal"
 * @returns {string}
 */
export const mensajeDeError = (error, accionFallida = "No se pudo completar la operación") => {
  const datos = error?.response?.data;
  const delServidor = datos?.mensaje || datos?.message || datos?.error;
  if (delServidor) return String(delServidor);
  if (error?.response) return `${accionFallida} (el servidor respondió con error ${error.response.status}).`;
  if (error?.request) return `${accionFallida}. No hay conexión con el servidor; verifique su red e intente nuevamente.`;
  return error?.message ? `${accionFallida}: ${error.message}` : accionFallida;
};

export default mensajeDeError;
