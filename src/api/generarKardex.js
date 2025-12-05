// src/api/generarKardex.js
// Funciones de integración API REST para Generación de Kardex. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/generar-kardex`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Genera Kardex completo para un MovimientoAlmacen
 */
export async function generarKardex(movimientoAlmacenId) {
  const res = await axios.post(`${API_URL}/${movimientoAlmacenId}`, {}, { headers: getAuthHeaders() });
  return res.data.data; // Retornar solo la data, no el wrapper
}