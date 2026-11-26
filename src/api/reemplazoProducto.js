import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/reemplazo-producto`;

const getAuthHeader = () => ({ Authorization: `Bearer ${useAuthStore.getState().token}` });

/**
 * Vista previa del reemplazo de un producto por otro (no modifica nada): filas que cambiarían por tabla,
 * movimientos de almacén que se reprocesarían, avisos y bloqueos.
 * @param {{ productoOrigenId: number, productoDestinoId: number, alcance: object }} datos
 *   alcance = { tipo: "GLOBAL" } | { tipo: "DOCUMENTOS", preFacturaIds, ordenCompraIds, rendicionIds }
 */
export const previsualizarReemplazoProducto = async (datos) => {
  const response = await axios.post(`${API_URL}/previsualizar`, datos, { headers: getAuthHeader() });
  return response.data;
};

/** Ejecuta el reemplazo (solo superusuario). Todo o nada. */
export const ejecutarReemplazoProducto = async (datos) => {
  const response = await axios.post(`${API_URL}/ejecutar`, datos, { headers: getAuthHeader() });
  return response.data;
};
