// src/api/recursosHumanos/plantillaFormatoExterno.js
// Funciones de integración API REST para Plantillas de Formato Externo (PLAME, AFPnet) (RRHH Fase 1)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/plantillas-formato-externo`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getPlantillasFormatoExterno(filtros = {}) {
  const res = await axios.get(API_URL, { headers: getAuthHeaders(), params: filtros });
  return res.data;
}

/** Plantilla ACTIVA vigente a una fecha para un código de formato. */
export async function getPlantillaFormatoExternoVigente(codigo, fecha) {
  const res = await axios.get(`${API_URL}/vigente`, { headers: getAuthHeaders(), params: { codigo, fecha } });
  return res.data;
}

export async function getPlantillaFormatoExternoById(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function createPlantillaFormatoExterno(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function updatePlantillaFormatoExterno(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function deletePlantillaFormatoExterno(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}
