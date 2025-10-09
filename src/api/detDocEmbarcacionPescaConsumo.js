// src/api/detDocEmbarcacionPescaConsumo.js
// Funciones de integración API REST para DetDocEmbarcacionPescaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/det-doc-embarcacion-pesca-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDetDocEmbarcacionPescaConsumo(params = {}) {
  const res = await axios.get(API_URL, { 
    headers: getAuthHeaders(),
    params: params  // Permite filtrar por faenaPescaConsumoId u otros parámetros
  });
  return res.data;
}

export async function getDetDocEmbarcacionPescaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearDetDocEmbarcacionPescaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarDetDocEmbarcacionPescaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarDetDocEmbarcacionPescaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function subirDocumentoEmbarcacionConsumo(file) {
  const formData = new FormData();
  formData.append('documentoEmbarcacion', file);
  const API_DOCUMENTO = `${import.meta.env.VITE_API_URL}/det-doc-embarcacion-pesca-consumo/upload`;
  const res = await axios.post(API_DOCUMENTO, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}