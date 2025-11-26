// src/api/contratoServicio.js
// Funciones de integración API REST para ContratoServicio. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/contratos-servicio`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getContratosServicio() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllContratosServicio() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getContratoServicioPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getContratosPorCliente(clienteId) {
  const res = await axios.get(`${API_URL}/cliente/${clienteId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getContratosPorEmpresa(empresaId) {
  const res = await axios.get(`${API_URL}/empresa/${empresaId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getContratosVigentes(clienteId) {
  const res = await axios.get(`${API_URL}/vigentes/${clienteId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function crearContratoServicio(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarContratoServicio(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarContratoServicio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function deleteContratoServicio(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Sube un PDF del contrato de servicio
 */
export async function uploadContratoPdf(contratoServicioId, file) {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('contratoServicioId', contratoServicioId);

  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/contrato-servicio-pdf/upload-contrato`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
}

/**
 * Obtiene la URL del PDF del contrato
 */
export function getContratoPdfUrl(filename) {
  if (!filename) return null;
  const baseFilename = filename.split('/').pop();
  return `${import.meta.env.VITE_API_URL}/contrato-servicio-pdf/archivo-contrato/${baseFilename}`;
}

/**
 * Elimina el PDF del contrato
 */
export async function deleteContratoPdf(contratoServicioId) {
  const res = await axios.delete(
    `${import.meta.env.VITE_API_URL}/contrato-servicio-pdf/${contratoServicioId}/contrato`,
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Obtiene series de documentos filtradas por empresaId y tipoDocumentoId
 */
export async function getSeriesDoc(empresaId, tipoDocumentoId) {
  const params = {
    ...(empresaId && { empresaId }),
    ...(tipoDocumentoId && { tipoDocumentoId })
  };
  const res = await axios.get(`${API_URL}/series-doc`, { 
    params,
    headers: getAuthHeaders() 
  });
  return res.data;
}
