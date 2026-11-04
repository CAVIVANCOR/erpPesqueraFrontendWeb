import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/reporte-estado-cuenta-proveedores-mantenimiento`;

const getAuthHeader = () => ({ Authorization: `Bearer ${useAuthStore.getState().token}` });

/**
 * Estado de cuenta de los proveedores de servicios y repuestos de Mantenimiento, a la fecha:
 * por empresa > proveedor > presupuesto de la OT, con lo presupuestado, cada documento de compra (facturado),
 * sus pagos desde caja y el saldo, con subtotales por proveedor y moneda.
 * @param {number|string} [empresaId] - limita a las OT de una empresa (opcional)
 */
export const getEstadoCuentaProveedoresMantenimiento = async (empresaId = null) => {
  const response = await axios.post(API_URL, { empresaId: empresaId || undefined }, { headers: getAuthHeader() });
  return response.data;
};
