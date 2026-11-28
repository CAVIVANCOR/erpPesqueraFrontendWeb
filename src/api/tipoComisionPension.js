// src/api/tipoComisionPension.js
// Catálogo de tipos de comisión de pensiones (FLUJO, MIXTA, SIN_COMISION, ...). Usa JWT desde Zustand.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL + "/tipos-comision-pension";

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getTiposComisionPension() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}
