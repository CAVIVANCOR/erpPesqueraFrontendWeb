import axios from './axios';

/**
 * Consultar datos de persona por DNI en RENIEC
 * @param {string} dni - Número de DNI de 8 dígitos
 * @returns {Promise} - Datos de la persona
 */
export const consultarReniec = async (dni) => {
  try {
    // Validar formato de DNI antes de enviar
    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
      throw new Error('DNI debe tener exactamente 8 dígitos numéricos');
    }

    const response = await axios.get(`/consultas-externas/reniec/${dni}`);
    return response.data;
  } catch (error) {
    // Manejar errores específicos
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('DNI no encontrado en RENIEC');
        case 400:
          throw new Error('DNI no válido');
        case 500:
          throw new Error('Servicio de consulta RENIEC no disponible');
        default:
          throw new Error(`Error ${error.response.status}: ${error.response.data?.error || 'Error desconocido'}`);
      }
    }
    throw new Error('Error de conexión al consultar RENIEC');
  }
};

/**
 * Consultar RUC básico en SUNAT
 * @param {string} ruc - Número de RUC de 11 dígitos
 * @returns {Promise} - Datos básicos de la empresa
 */
export const consultarSunatRuc = async (ruc) => {
  try {
    // Validar formato de RUC antes de enviar
    if (!ruc || ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      throw new Error('RUC debe tener exactamente 11 dígitos numéricos');
    }

    const response = await axios.post(`/consultas-externas/sunat/ruc/${ruc}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('RUC no encontrado en SUNAT');
        case 400:
          throw new Error('RUC no válido');
        case 500:
          throw new Error('Servicio de consulta SUNAT no disponible');
        default:
          throw new Error(`Error ${error.response.status}: ${error.response.data?.error || 'Error desconocido'}`);
      }
    }
    throw new Error('Error de conexión al consultar SUNAT');
  }
};

/**
 * Consultar RUC avanzado en SUNAT (información completa)
 * @param {string} ruc - Número de RUC de 11 dígitos
 * @returns {Promise} - Datos completos de la empresa
 */
export const consultarSunatRucFull = async (ruc) => {
  try {
    // Validar formato de RUC antes de enviar
    if (!ruc || ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      throw new Error('RUC debe tener exactamente 11 dígitos numéricos');
    }

    const response = await axios.get(`/consultas-externas/sunat/ruc-full/${ruc}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('RUC no encontrado en SUNAT');
        case 400:
          throw new Error('RUC no válido');
        case 500:
          throw new Error('Servicio de consulta SUNAT no disponible');
        default:
          throw new Error(`Error ${error.response.status}: ${error.response.data?.error || 'Error desconocido'}`);
      }
    }
    throw new Error('Error de conexión al consultar SUNAT');
  }
};

/**
 * Consultar tipo de cambio SUNAT
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.date - Fecha específica (YYYY-MM-DD)
 * @param {number} params.month - Mes (1-12)
 * @param {number} params.year - Año (YYYY)
 * @returns {Promise} - Tipo de cambio
 */
export const consultarTipoCambioSunat = async (params = {}) => {
  try {
    const { date, month, year } = params;
    
    // Validar parámetros
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Fecha debe estar en formato YYYY-MM-DD');
    }
    
    if (month && (month < 1 || month > 12)) {
      throw new Error('Mes debe estar entre 1 y 12');
    }
    
    if (year && year < 2000) {
      throw new Error('Año debe ser mayor a 2000');
    }

    // Construir query params
    const queryParams = new URLSearchParams();
    if (date) {
      queryParams.append('date', date);
    } else if (month && year) {
      queryParams.append('month', month.toString());
      queryParams.append('year', year.toString());
    }

    const url = `/consultas-externas/sunat/tipo-cambio${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error('Parámetros de fecha no válidos');
        case 401:
          throw new Error('Token de API SUNAT vencido o inválido. Contacte al administrador del sistema para renovar el token.');
        case 404:
          return null;
        case 500:
          return null;
        default:
          throw new Error(`Error ${error.response.status}: ${error.response.data?.error || 'Error desconocido'}`);
      }
    }
    throw new Error('Error de conexión al consultar tipo de cambio');
  }
};

/**
 * Consultar datos de empresa por RUC en SUNAT (alias para compatibilidad)
 * @param {string} ruc - Número de RUC
 * @returns {Promise} - Datos de la empresa
 */
export const consultarSunat = consultarSunatRuc;
