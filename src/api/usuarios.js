// src/api/usuarios.js
// Módulo centralizado para gestión de usuarios vía API REST en el ERP Megui.
// Cumple SRP y permite desacoplar la lógica HTTP del UI.
// Todas las funciones devuelven promesas y manejan errores para integración profesional.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore'; // Importación profesional del store de autenticación

// Usa la variable de entorno VITE_API_URL definida en .env para compatibilidad multiplataforma
const API_URL = `${import.meta.env.VITE_API_URL}/usuarios`;

// Función auxiliar para obtener el header de autorización con el token JWT actual
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Obtiene todos los usuarios del sistema.
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getUsuarios = async (params) => {
  const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
  console.log("Llamada a getUsuarios",res.data);
  return res.data;
};

/**
 * Crea un nuevo usuario.
 * @param {Object} data Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export const crearUsuario = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Actualiza un usuario existente.
 * @param {number|string} id ID del usuario
 * @param {Object} data Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
export const actualizarUsuario = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Elimina un usuario por ID.
 * @param {number|string} id ID del usuario
 * @returns {Promise<void>}
 */
export const eliminarUsuario = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};
