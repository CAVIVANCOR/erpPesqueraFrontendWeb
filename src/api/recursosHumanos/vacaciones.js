// src/api/recursosHumanos/vacaciones.js
// Funciones de integración API REST del módulo de vacaciones y suspensiones de labores (RRHH)

import axios from "axios";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/recursos-humanos/vacaciones`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

const get = async (ruta, params = {}) => (await axios.get(`${API_URL}${ruta}`, { headers: getAuthHeaders(), params })).data;
const post = async (ruta, data = {}) => (await axios.post(`${API_URL}${ruta}`, data, { headers: getAuthHeaders() })).data;
const put = async (ruta, data = {}) => (await axios.put(`${API_URL}${ruta}`, data, { headers: getAuthHeaders() })).data;
const del = async (ruta) => (await axios.delete(`${API_URL}${ruta}`, { headers: getAuthHeaders() })).data;

// Tipos de suspensión
export const getTiposSuspension = (filtros) => get("/tipos", filtros);
export const crearTipoSuspension = (data) => post("/tipos", data);
export const actualizarTipoSuspension = (id, data) => put(`/tipos/${id}`, data);
export const eliminarTipoSuspension = (id) => del(`/tipos/${id}`);

// Periodos vacacionales
export const generarPeriodosVacacionales = (data) => post("/periodos/generar", data);
export const actualizarPeriodoVacacional = (id, data) => put(`/periodos/${id}`, data);

// Suspensiones
export const getSuspensiones = (filtros) => get("/suspensiones", filtros);
export const crearSuspension = (data) => post("/suspensiones", data);
export const actualizarSuspension = (id, data) => put(`/suspensiones/${id}`, data);
export const ejecutarSuspension = (id, data) => post(`/suspensiones/${id}/ejecutar`, data);
export const anularSuspension = (id, data) => post(`/suspensiones/${id}/anular`, data);
export const eliminarSuspension = (id) => del(`/suspensiones/${id}`);

// Reportes
export const getSaldosVacaciones = (filtros) => get("/saldos", filtros);
export const getResumenVacaciones = (filtros) => get("/resumen", filtros);
export const getCalendarioVacaciones = (filtros) => get("/calendario", filtros);
export const getProyeccionVacaciones = (filtros) => get("/proyeccion", filtros);
export const getVacacionesPorMes = (filtros) => get("/por-mes", filtros);
