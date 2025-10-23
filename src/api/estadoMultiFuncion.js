// src/api/estadoMultiFuncion.js
// Funciones de integración API REST para EstadoMultiFuncion. Usa JWT desde Zustand.
// Documentado en español técnico.

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/estados-multi-funcion`;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todos los estados multifunción
 * @returns {Promise} Lista de estados multifunción
 */
export async function getEstadosMultiFuncion() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene un estado multifunción por su ID
 * @param {number} id - ID del estado multifunción
 * @returns {Promise} Estado multifunción
 */
export async function getEstadoMultiFuncionPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción por tipo proviene de
 * @param {number} tipoProvieneDeId - ID del tipo proviene de
 * @returns {Promise} Lista de estados multifunción filtrados
 */
export async function getEstadosMultiFuncionPorTipoProvieneDe(tipoProvieneDeId) {
  const res = await axios.get(`${API_URL}?tipoProvieneDeId=${tipoProvieneDeId}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para productos
 * Filtra por TipoProvieneDe con descripción "PRODUCTOS"
 */
export async function getEstadosMultiFuncionParaProductos() {
  const res = await axios.get(`${API_URL}/productos`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para embarcaciones
 * Filtra por TipoProvieneDe con descripción "EMBARCACIONES"
 */
export async function getEstadosMultiFuncionParaEmbarcaciones() {
  const res = await axios.get(`${API_URL}/embarcaciones`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para temporadas de pesca
 * Filtra por TipoProvieneDe con descripción "TEMPORADA PESCA"
 */
export async function getEstadosMultiFuncionParaTemporadaPesca() {
  const res = await axios.get(`${API_URL}/temporada-pesca`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para faenas de pesca
 * Filtra por TipoProvieneDe con descripción "FAENA PESCA"
 */
export async function listarEstadosMultiFuncionFaenaPesca() {
  const res = await axios.get(`${API_URL}/faena-pesca`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para faenas de pesca consumo
 * Filtra por TipoProvieneDe con descripción "FAENA PESCA CONSUMO"
 */
export async function listarEstadosMultiFuncionFaenaPescaConsumo() {
  const res = await axios.get(`${API_URL}/faena-pesca-consumo`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Crea un nuevo estado multifunción
 * @param {Object} data - Datos del estado multifunción
 * @returns {Promise} Estado multifunción creado
 */
export async function crearEstadoMultiFuncion(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Actualiza un estado multifunción existente
 * @param {number} id - ID del estado multifunción
 * @param {Object} data - Datos actualizados
 * @returns {Promise} Estado multifunción actualizado
 */
export async function actualizarEstadoMultiFuncion(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Elimina un estado multifunción
 * @param {number} id - ID del estado multifunción a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export async function eliminarEstadoMultiFuncion(id) {
  const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return res.data;
}

/**
 * Obtiene estados multifunción específicamente para novedad pesca consumo
 * Filtra por TipoProvieneDe con ID = 7 ("NOVEDAD PESCA CONSUMO")
 */
export async function getEstadosMultiFuncionParaNovedadPescaConsumo() {
  const res = await axios.get(`${API_URL}`, { headers: getAuthHeaders() });
  // Filtrar en frontend ya que el backend no maneja el query param correctamente
  const estadosFiltrados = res.data.filter(estado => Number(estado.tipoProvieneDeId) === 7);
  return estadosFiltrados;
}

/**
 * Obtiene estados multifunción filtrados por tipoProvieneDeId
 * Solo retorna los que no están cesados
 * @param {number} tipoProvieneDeId - ID del tipo proviene de
 * @returns {Promise} Lista de estados multifunción filtrados
 */
export async function getEstadosMultiFuncionPorTipoProviene(tipoProvieneDeId) {
  const res = await axios.get(`${API_URL}/por-tipo-proviene`, {
    params: { tipoProvieneDeId },
    headers: getAuthHeaders()
  });
  return res.data;
}