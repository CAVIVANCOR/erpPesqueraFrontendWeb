// src/api/descargaFaenaConsumo.js
// Funciones de integración API REST para DescargaFaenaConsumo. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/descarga-faena-consumo`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getDescargasFaenaConsumo() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getDescargaFaenaConsumoPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearDescargaFaenaConsumo(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarDescargaFaenaConsumo(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarDescargaFaenaConsumo(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function subirComprobanteWincha(file) {
  const formData = new FormData();
  formData.append('comprobanteWincha', file);
  const API_COMPROBANTE = `${import.meta.env.VITE_API_URL}/descarga-faena-consumo-wincha/upload`;
  const res = await axios.post(API_COMPROBANTE, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function subirValeAbastecimiento(file) {
  const formData = new FormData();
  formData.append('valeAbastecimiento', file);
  const API_VALE = `${import.meta.env.VITE_API_URL}/descarga-faena-consumo-vale/upload`;
  const res = await axios.post(API_VALE, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function subirInformeDescarga(file) {
  const formData = new FormData();
  formData.append('informeDescarga', file);
  const API_INFORME = `${import.meta.env.VITE_API_URL}/descarga-faena-consumo-informe/upload`;
  const res = await axios.post(API_INFORME, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// Agregar esta función en descargaFaenaConsumo.js
export async function getDescargaPorFaena(faenaPescaConsumoId) {
  const res = await axios.get(`${API_URL}`, { headers: getAuthHeaders() });
  const descargas = res.data;
  // Buscar la descarga de esta faena específica
  const descarga = descargas.find(
    (d) => Number(d.faenaPescaConsumoId) === Number(faenaPescaConsumoId)
  );
  return descarga || null;
}