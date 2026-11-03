import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/reporte-movimiento-fondos`;

const getAuthHeader = () => ({ Authorization: `Bearer ${useAuthStore.getState().token}` });

/**
 * Datos de apoyo contable del reporte Movimiento de Fondos:
 * contrapartidas y asiento de cada movimiento, cuenta contable de cada cuenta y saldos reales.
 * @param {Array<number|string>} ids - IDs de los movimientos de caja del reporte
 */
export const getDatosReporteMovimientoFondos = async (ids) => {
  const response = await axios.post(`${API_URL}/datos`, { ids }, { headers: getAuthHeader() });
  return response.data;
};

/**
 * Saldos de TODAS las cuentas bancarias / cajas activas de todas las empresas en el rango (incluye las que no
 * tuvieron movimientos). Las fechas se envían como ISO de la fecha local (inicio y fin de día), igual que el resto del sistema.
 * @param {Date} desde - inicio del rango (00:00 local)
 * @param {Date} hasta - fin del rango (23:59:59.999 local)
 */
export const getCuentasParaSaldos = async (desde, hasta) => {
  const response = await axios.post(
    `${API_URL}/cuentas-saldos`,
    { desde: desde.toISOString(), hasta: hasta.toISOString() },
    { headers: getAuthHeader() }
  );
  return response.data;
};
