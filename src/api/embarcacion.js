// src/api/embarcacion.js
// Funciones de integración API REST para Embarcacion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pesca/embarcaciones`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getEmbarcaciones() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getEmbarcacionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearEmbarcacion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarEmbarcacion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarEmbarcacion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Sube una foto de embarcación al servidor.
 * @param {number} id - ID de la embarcación.
 * @param {File} archivoFoto - Archivo de la foto a subir.
 * @returns {Promise<object>} - Objeto con la respuesta del servidor.
 */
export const subirFotoEmbarcacion = async (id, archivoFoto) => {
  console.log("subirFotoEmbarcacion", id, archivoFoto);
  const formData = new FormData();
  formData.append('foto', archivoFoto);
  const token = useAuthStore.getState().token;
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/embarcacion-foto/${id}/foto`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};
