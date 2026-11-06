// src/api/recursosHumanos/plame4ta.js
// Archivos PLAME de prestadores de servicios con rentas de 4ta categoría (recibos por honorarios)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/plame-4ta`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/** Recibos por honorarios pagados en el mes (por defecto solo los que tienen retención). */
export async function getRecibosPlame4ta(empresaId, anio, mes, soloConRetencion = true) {
  const res = await axios.get(`${API_URL}/recibos`, { params: { empresaId, anio, mes, soloConRetencion }, headers: getAuthHeaders() });
  return res.data;
}

/** Líneas de los archivos .ps4 y .4ta de los recibos marcados. */
export async function getArchivosPlame4ta(empresaId, anio, mes, cuentaPorPagarIds) {
  const res = await axios.get(`${API_URL}/archivos`, {
    params: { empresaId, anio, mes, cuentaPorPagarIds: cuentaPorPagarIds.join(",") },
    headers: getAuthHeaders(),
  });
  return res.data;
}
