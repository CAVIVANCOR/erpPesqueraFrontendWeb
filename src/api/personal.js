// src/api/personal.js
// API centralizada para gestión de personal en el ERP Megui.
// Todas las funciones devuelven promesas y usan autenticación JWT desde useAuthStore.
import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/personal`;

function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
/**
 * Crea un nuevo registro de personal en el sistema.
 * @param {Object} data - Datos del personal (solo campos válidos para el backend)
 * @returns {Promise<Object>} Personal creado
 *
 * Esta función utiliza autenticación JWT obtenida desde useAuthStore (Zustand),
 * cumpliendo la regla de seguridad y centralización de sesión del ERP Megui.
 *
 * Ejemplo de uso:
 *   await crearPersonal({ nombres, apellidos, ... });
 */
export const crearPersonal = async (data) => {
  const res = await axios.post(API_URL, data, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Sube la foto de una persona al backend y actualiza el campo urlFotoPersona.
 * @param {number|string} id - ID del personal
 * @param {File} archivoFoto - Archivo de imagen (JPG o PNG, máx 2MB)
 * @returns {Promise<Object>} Respuesta del backend con nombre de archivo y URL pública
 *
 * Esta función utiliza autenticación JWT obtenida desde useAuthStore (Zustand),
 * cumpliendo la regla de seguridad y centralización de sesión del ERP Megui.
 *
 * Ejemplo de uso:
 *   await subirFotoPersonal(5, archivo);
 */
export const subirFotoPersonal = async (id, archivoFoto) => {
  const formData = new FormData();
  formData.append('foto', archivoFoto);
  const token = useAuthStore.getState().token;
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/personal-foto/${id}/foto`,
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

/**
 * Actualiza un registro de personal existente en el sistema.
 * @param {number|string} id - ID del personal a actualizar
 * @param {Object} data - Datos a actualizar (solo campos válidos para el backend)
 * @returns {Promise<Object>} Personal actualizado
 *
 * Esta función utiliza autenticación JWT obtenida desde useAuthStore (Zustand),
 * cumpliendo la regla de seguridad y centralización de sesión del ERP Megui.
 *
 * Ejemplo de uso:
 *   await actualizarPersonal(5, { nombres, apellidos, ... });
 */
export const actualizarPersonal = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeader() });
  return res.data;
};



/**
 * Obtiene un personal por su ID.
 * @param {number|string} id - ID del personal
 * @returns {Promise<Object>} Datos del personal
 *
 * Esta función utiliza autenticación JWT obtenida desde useAuthStore (Zustand),
 * cumpliendo la regla de seguridad y centralización de sesión del ERP Megui.
 *
 * Ejemplo de uso:
 *   const personal = await getPersonalPorId(5);
 */
export const getPersonalPorId = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene el personal filtrado por empresaId (si se provee).
 * @param {number} [empresaId] - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de personal
 */
export const getPersonal = async (empresaId) => {
  const params = empresaId ? { empresaId } : {};
  const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
  return res.data;
};

/**
 * Obtiene solo los vendedores (personal con esVendedor=true) filtrados por empresa.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de vendedores con nombres completos
 */
export const getVendedoresPorEmpresa = async (empresaId) => {
  const params = { empresaId, esVendedor: true };
  const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
  return res.data.map(vendedor => ({
    ...vendedor,
    nombreCompleto: `${vendedor.nombres} ${vendedor.apellidos}`.trim()
  }));
};



/**
 * Obtiene personal activo filtrado por empresa para dropdowns.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de personal activo con nombres completos
 */
export const getPersonalActivoPorEmpresa = async (empresaId) => {
  const params = { empresaId, cesado: false };
  const res = await axios.get(API_URL, { params, headers: getAuthHeader() });
  return res.data.map(persona => ({
    ...persona,
    nombreCompleto: `${persona.nombres} ${persona.apellidos}`.trim(),
    label: `${persona.nombres} ${persona.apellidos}`.trim(),
    value: Number(persona.id)
  }));
};

/**
 * Elimina un registro de personal por ID.
 * @param {number|string} id - ID del personal a eliminar
 * @returns {Promise<void>}
 *
 * Esta función utiliza autenticación JWT obtenida desde useAuthStore (Zustand),
 * cumpliendo la regla de seguridad y centralización de sesión del ERP Megui.
 *
 * Ejemplo de uso:
 *   await eliminarPersonal(5);
 */
export const eliminarPersonal = async (id) => {
  await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};


/**
 * Obtiene personal con cargo "BAHIA COMERCIAL" filtrado por empresa.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de personal con cargo BAHIA COMERCIAL
 */
export const getBahiasComerciales = async (empresaId,descripcionCargo) => {
  const res = await axios.get(`${API_URL}/personalxdescripcioncargo/${empresaId}/${descripcionCargo}`, { headers: getAuthHeader() });
  const bahias = res.data.filter(persona => !persona.cesado);
  return bahias;
};

/**
 * Obtiene personal con cargo "MOTORISTA EMBARCACION" filtrado por empresa.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de motoristas activos
 */
export const getMotoristas = async (empresaId,descripcionCargo) => {
  const res = await axios.get(`${API_URL}/personalxdescripcioncargo/${empresaId}/${descripcionCargo}`, { 
    headers: getAuthHeader() 
  });
  // Filtrar por cargo MOTORISTA EMBARCACION (cargoId: 14) y activos
  const motoristas = res.data.filter(persona => !persona.cesado);
  return motoristas;
};

/**
 * Obtiene personal con cargo "PATRON EMBARCACION" filtrado por empresa.
 * @param {number} empresaId - ID de la empresa para filtrar
 * @returns {Promise<Array>} Lista de patrones activos
 */
export const getPatrones = async (empresaId,descripcionCargo) => {
  const res = await axios.get(`${API_URL}/personalxdescripcioncargo/${empresaId}/${descripcionCargo}`, { 
    headers: getAuthHeader() 
  });
  // Filtrar por cargo PATRON EMBARCACION (cargoId: 22) y activos
  const patrones = res.data.filter(persona => !persona.cesado);
  return patrones;
};

/**
 * Obtiene el único personal de Bahía Comercial para una empresa específica
 * Valida que hay exactamente 1 registro activo con paraPescaConsumo=true
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Object>} Personal de Bahía Comercial único
 * @throws {Error} Si no hay exactamente 1 registro
 */
export const getBahiaComercialUnicoPorEmpresa = async (empresaId) => {
  const bahias = await getBahiasComerciales(empresaId, "BAHIA COMERCIAL");
  
  // Filtrar adicional por paraPescaConsumo=true
  const bahiasParaConsumo = bahias.filter(persona => persona.paraPescaConsumo === true);
  
  if (bahiasParaConsumo.length === 0) {
    throw new Error("No se encontró personal de Bahía Comercial activo para pesca consumo en esta empresa");
  }
  
  if (bahiasParaConsumo.length > 1) {
    throw new Error(`Se encontraron ${bahiasParaConsumo.length} personas de Bahía Comercial para pesca consumo. Debe haber exactamente 1`);
  }
  
  return bahiasParaConsumo[0];
};