// src/api/documentoDinamico.js
// Funciones de integración API REST para DocumentoDinamico. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/documentos`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDocumentosPorModelo(modeloNombre) {
  const res = await axios.get(`${API_URL}/${modeloNombre}`, { headers: getAuthHeaders() });
  return res.data;
}