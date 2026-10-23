// src/api/tesoreria/gastosBancarios.js
// Registro especializado de Gastos Bancarios (comisiones, ITF, portes...)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/tesoreria/gastos-bancarios`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/** Conceptos disponibles: [{ codigo, etiqueta, cuenta }] */
export async function getConceptosGastoBancario() {
  const res = await axios.get(`${API_URL}/conceptos`, { headers: getAuthHeaders() });
  return res.data.data;
}

/** Operación de Tesorería: registra uno o varios gastos bancarios (egresos con su asiento) */
export async function registrarGastosBancarios(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}
