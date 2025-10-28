import axios from 'axios';
import { useAuthStore } from '../shared/stores/useAuthStore';

const API_URL = `${import.meta.env.VITE_API_URL}/cotizaciones-proveedor`;

/**
 * Obtiene el token de autenticación desde el store de Zustand
 * @returns {string} Token JWT para autenticación
 */
function getAuthHeader() {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Lista cotizaciones por requerimiento
 * @param {string|number} requerimientoCompraId - ID del requerimiento
 * @returns {Promise<Array>} Lista de cotizaciones
 */
export const getCotizacionesProveedor = async (requerimientoCompraId) => {
  try {
    const response = await axios.get(API_URL, {
      params: { requerimientoCompraId },
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    throw error;
  }
};

/**
 * Obtiene una cotización por ID
 * @param {string|number} id - ID de la cotización
 * @returns {Promise<Object>} Cotización con detalles
 */
export const getCotizacionProveedorById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    throw error;
  }
};

/**
 * Crea una nueva cotización (crea automáticamente los detalles)
 * @param {Object} data - Datos de la cotización
 * @param {number} data.requerimientoCompraId - ID del requerimiento
 * @param {number} data.proveedorId - ID del proveedor
 * @param {number} data.monedaId - ID de la moneda
 * @param {Date} data.fechaCotizacion - Fecha de la cotización
 * @returns {Promise<Object>} Cotización creada con detalles
 */
export const crearCotizacionProveedor = async (data) => {
  try {
    const response = await axios.post(API_URL, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear cotización:', error);
    throw error;
  }
};

/**
 * Actualiza la cabecera de una cotización
 * @param {string|number} id - ID de la cotización
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Cotización actualizada
 */
export const actualizarCotizacionProveedor = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar cotización:', error);
    throw error;
  }
};

/**
 * Elimina una cotización y todos sus detalles
 * @param {string|number} id - ID de la cotización
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarCotizacionProveedor = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    throw error;
  }
};

/**
 * Actualiza un detalle de cotización (precio, cantidad)
 * @param {string|number} detalleId - ID del detalle
 * @param {Object} data - Datos a actualizar
 * @param {number} data.precioUnitario - Precio unitario
 * @param {number} data.cantidad - Cantidad
 * @returns {Promise<Object>} Detalle actualizado
 */
export const actualizarDetalleCotizacion = async (detalleId, data) => {
  try {
    const response = await axios.put(`${API_URL}/detalle/${detalleId}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar detalle:', error);
    throw error;
  }
};

/**
 * Agrega un producto alternativo a una cotización
 * @param {string|number} cotizacionId - ID de la cotización
 * @param {Object} data - Datos del producto alternativo
 * @param {number} data.productoId - ID del producto
 * @param {number} data.cantidad - Cantidad
 * @param {number} data.precioUnitario - Precio unitario
 * @param {string} data.observaciones - Observaciones
 * @returns {Promise<Object>} Detalle creado
 */
export const agregarProductoAlternativo = async (cotizacionId, data) => {
  try {
    const response = await axios.post(`${API_URL}/${cotizacionId}/producto-alternativo`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al agregar producto alternativo:', error);
    throw error;
  }
};

/**
 * Elimina un detalle de cotización (solo productos alternativos)
 * @param {string|number} detalleId - ID del detalle
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarDetalleCotizacion = async (detalleId) => {
  try {
    const response = await axios.delete(`${API_URL}/detalle/${detalleId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar detalle:', error);
    throw error;
  }
};

/**
 * Marca/desmarca un detalle de cotización como seleccionado para orden de compra
 * @param {string|number} detalleId - ID del detalle
 * @param {boolean} seleccionado - true para seleccionar, false para deseleccionar
 * @returns {Promise<Object>} Detalle actualizado
 */
export const marcarSeleccionadoParaOC = async (detalleId, seleccionado) => {
  try {
    const response = await axios.patch(
      `${API_URL}/detalle/${detalleId}/seleccionar`,
      { esSeleccionadoParaOrdenCompra: seleccionado },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error al marcar item:', error);
    throw error;
  }
};