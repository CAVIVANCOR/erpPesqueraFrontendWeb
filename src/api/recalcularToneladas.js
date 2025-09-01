import axios from 'axios';
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtiene el token JWT profesionalmente desde Zustand
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * API para recalcular toneladas por registro específico
 */

/**
 * Recalcula toneladas de una cala específica
 * @param {string|number} calaId - ID de la cala
 * @param {string|number} faenaPescaId - ID de la faena
 * @param {string|number} TemporadaPescaId - ID de la temporada
 */
export const recalcularToneladasCala = async (calaId, faenaPescaId, TemporadaPescaId) => {
  try {
    const response = await axios.post(
      `${API_URL}/recalcular-toneladas/cala/${calaId}`,
      { faenaPescaId, TemporadaPescaId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error recalculando toneladas de cala:', error);
    throw error;
  }
};

/**
 * Recalcula toneladas de una faena específica
 * @param {string|number} faenaId - ID de la faena
 */
export const recalcularToneladasFaena = async (faenaId) => {
  try {
    const response = await axios.post(
      `${API_URL}/recalcular-toneladas/faena/${faenaId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error recalculando toneladas de faena:', error);
    throw error;
  }
};

/**
 * Recalcula toneladas de una temporada específica
 * @param {string|number} temporadaId - ID de la temporada
 */
export const recalcularToneladasTemporada = async (temporadaId) => {
  try {
    const response = await axios.post(
      `${API_URL}/recalcular-toneladas/temporada/${temporadaId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error recalculando toneladas de temporada:', error);
    throw error;
  }
};

/**
 * Recalcula en cascada desde una cala hacia arriba en la jerarquía
 * @param {string|number} calaId - ID de la cala
 */
export const recalcularCascadaDesdeCala = async (calaId) => {
  try {
    const response = await axios.post(
      `${API_URL}/recalcular-toneladas/cascada-cala/${calaId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error en recálculo cascada desde cala:', error);
    throw error;
  }
};

/**
 * Recalcula en cascada desde una faena hacia arriba en la jerarquía
 * @param {string|number} faenaId - ID de la faena
 */
export const recalcularCascadaDesdeFaena = async (faenaId) => {
  try {
    const response = await axios.post(
      `${API_URL}/recalcular-toneladas/cascada-faena/${faenaId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error en recálculo cascada desde faena:', error);
    throw error;
  }
};
