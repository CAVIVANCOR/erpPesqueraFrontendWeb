// src/api/ordenCompra.js
import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/ordenes-compra`;

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

export async function getOrdenesCompra() {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getOrdenCompraPorId(id) {
  const res = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function crearOrdenCompra(data) {
  const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
  return res.data;
}

export async function actualizarOrdenCompra(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function eliminarOrdenCompra(id) {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function aprobarOrdenCompra(id) {
  const res = await axios.post(
    `${API_URL}/${id}/aprobar`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function anularOrdenCompra(id) {
  const res = await axios.post(
    `${API_URL}/${id}/anular`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function generarMovimientoAlmacen(id, data) {
  const res = await axios.post(`${API_URL}/${id}/generar-movimiento`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function generarOrdenDesdeRequerimiento(requerimientoCompraId) {
  const res = await axios.post(
    `${API_URL}/generar-desde-requerimiento`,
    { requerimientoCompraId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function regenerarKardexOrdenCompra(id) {
  const res = await axios.post(
    `${API_URL}/${id}/regenerar-kardex`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Generar Cuenta Por Pagar desde Orden de Compra
 * Crea una CxP y actualiza el estado de la OC a FACTURADA (113)
 * 
 * @param {number} id - ID de la orden de compra
 * @returns {Promise<Object>} Resultado con ordenCompra y cuentaPorPagar
 */
export async function generarCuentaPorPagar(id) {
  const res = await axios.post(
    `${API_URL}/${id}/generar-cxp`,
    {},
    { headers: getAuthHeaders() }
  );
  // El backend devuelve { success, mensaje, data: { ordenCompra, cuentaPorPagar } }
  return res.data.data || res.data;
}

/**
 * Reactivar Orden de Compra
 * Devuelve una OrdenCompra APROBADA al estado PENDIENTE
 * Elimina kardex, CuentaPorPagar (sin pagos) y AsientosContables
 * 
 * @param {number} id - ID de la orden de compra
 * @returns {Promise<Object>} Resultado con estadísticas
 */
export async function reactivarDocumentoOrdenCompra(id) {
  try {
    const response = await axios.put(`${API_URL}/${id}/reactivar`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al reactivar orden de compra:", error);
    throw error;
  }
}

/**
 * Eliminar asiento contable de una OrdenCompra
 * @param {number} ordenCompraId - ID de la orden de compra
 * @param {number} asientoId - ID del asiento a eliminar
 * @returns {Promise<Object>} - Confirmación
 */
export async function eliminarAsientoContable(ordenCompraId, asientoId) {
  try {
    const response = await axios.delete(
      `${API_URL}/${ordenCompraId}/asiento/${asientoId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar asiento contable:", error);
    throw error;
  }
}


/**
 * Generar borrador de asiento contable para OrdenCompra
 * @param {number} ordenCompraId - ID de la orden de compra
 * @returns {Promise<Object>} - Borrador del asiento
 */
export async function generarBorradorAsiento(ordenCompraId) {
  try {
    const response = await axios.get(
      `${API_URL}/${ordenCompraId}/borrador-asiento`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al generar borrador de asiento:", error);
    throw error;
  }
}

/**
 * Guardar asiento contable de OrdenCompra
 * @param {number} ordenCompraId - ID de la orden de compra
 * @param {Object} asientoData - Datos del asiento
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Object>} - Asiento guardado
 */
export async function guardarAsientoContable(ordenCompraId, asientoData, usuarioId) {
  try {
    const response = await axios.post(
      `${API_URL}/${ordenCompraId}/guardar-asiento`,
      { ...asientoData, creadoPor: usuarioId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al guardar asiento contable:", error);
    throw error;
  }
}


export async function asignarCentroCostoMasivo(centroCostoId, ordenesIds) {
  const res = await axios.put(
    `${API_URL}/asignar-centro-costo-masivo`,
    { centroCostoId, ordenesIds },
    { headers: getAuthHeaders() }
  );
  return res.data;
}



/**
 * Obtiene órdenes de compra filtradas por empresa, proveedor y fecha límite (para NC/ND)
 * @param {number} empresaId - ID de la empresa
 * @param {number} proveedorId - ID del proveedor
 * @param {string} fechaLimite - Fecha límite en formato ISO
 * @returns {Promise<Array>} Lista de órdenes de compra filtradas
 */
export async function getOrdenesCompraParaDocumentoAfecto(empresaId, proveedorId, fechaLimite) {
  try {
    const params = new URLSearchParams();
    if (empresaId) params.append('empresaId', empresaId);
    if (proveedorId) params.append('proveedorId', proveedorId);
    if (fechaLimite) params.append('fechaLimite', fechaLimite);
    
    const response = await axios.get(`${API_URL}/por-proveedor?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes de compra para documento afecto:", error);
    throw error;
  }
}

