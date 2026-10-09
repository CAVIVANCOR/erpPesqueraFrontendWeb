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
