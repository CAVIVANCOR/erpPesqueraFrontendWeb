/**
 * API para gestión de Pre-Facturas
 * Funciones de integración con endpoints REST para el manejo de pre-facturas en el sistema.
 * Utiliza autenticación JWT desde Zustand y manejo profesional de errores.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import axios from "axios";
import { useAuthStore } from "../shared/stores/useAuthStore";

const API_URL = `${import.meta.env.VITE_API_URL}/pre-facturas`;

/**
 * Obtiene el token JWT desde el store de autenticación
 * @returns {Object} Headers con autorización Bearer
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Obtiene todas las pre-facturas
 * @returns {Promise<Array>} Lista de pre-facturas
 */
export async function getPreFacturas() {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas:", error);
    throw error;
  }
}

/**
 * Obtiene una pre-factura por ID
 * @param {number} id - ID de la pre-factura
 * @returns {Promise<Object>} Pre-factura
 */
export async function getPreFacturaPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-factura por ID:", error);
    throw error;
  }
}

/**
 * Estado de aplicación (canje) de una Nota de Crédito a su documento afecto
 * @param {number} id - ID de la pre-factura que es Nota de Crédito
 * @returns {Promise<Object>} { esNotaCredito, totalNC, aplicada, pagoCanje, documentoAfecto }
 */
export async function getEstadoNotaCredito(id) {
  const response = await axios.get(`${API_URL}/${id}/estado-nota-credito`, { headers: getAuthHeaders() });
  return response.data;
}

/**
 * Aplica la Nota de Crédito al documento afecto (canje: baja su saldo y recalcula detracción/retención/percepción)
 * @param {number} id - ID de la pre-factura que es Nota de Crédito
 */
export async function aplicarNotaCreditoPreFactura(id) {
  const response = await axios.post(`${API_URL}/${id}/aplicar-nota-credito`, {}, { headers: getAuthHeaders() });
  return response.data;
}

/**
 * Revierte la aplicación de la Nota de Crédito
 * @param {number} id - ID de la pre-factura que es Nota de Crédito
 */
export async function revertirNotaCreditoPreFactura(id) {
  const response = await axios.post(`${API_URL}/${id}/revertir-nota-credito`, {}, { headers: getAuthHeaders() });
  return response.data;
}

/**
 * Crea una nueva pre-factura
 * @param {Object} preFacturaData - Datos de la pre-factura
 * @returns {Promise<Object>} Pre-factura creada
 */
export async function crearPreFactura(preFacturaData) {
  try {
    const response = await axios.post(API_URL, preFacturaData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al crear pre-factura:", error);
    throw error;
  }
}


/**
 * Actualiza una pre-factura existente
 * @param {number} id - ID de la pre-factura
 * @param {Object} preFacturaData - Datos actualizados
 * @returns {Promise<Object>} Pre-factura actualizada
 */
export async function actualizarPreFactura(id, preFacturaData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, preFacturaData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar pre-factura:", error);
    throw error;
  }
}

/**
 * Actualiza SOLO el tipo de cambio de una PreFactura (Regeneración Masiva Ventas - FASE 0).
 * No usar actualizarPreFactura() para esto: el PUT genérico recalcula totales e impuestos
 * y valida el TC con fechaDocumento en lugar de fechaFacturacion.
 * @param {number} id - ID de la pre-factura
 * @param {number} tipoCambio - TC Venta SUNAT (3 decimales)
 * @returns {Promise<{id, tipoCambioAnterior, tipoCambioNuevo}>}
 */
export async function actualizarTipoCambioPreFactura(id, tipoCambio) {
  const response = await axios.put(
    `${API_URL}/${id}/tipo-cambio`,
    { tipoCambio },
    { headers: getAuthHeaders() },
  );
  return response.data;
}


/**
 * Elimina una pre-factura
 * @param {number} id - ID de la pre-factura a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function eliminarPreFactura(id) {
  
  try {
    const headers = getAuthHeaders();
    
    const response = await axios.delete(`${API_URL}/${id}`, { headers });

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene pre-facturas por cliente
 * @param {number} clienteId - ID del cliente
 * @returns {Promise<Array>} Lista de pre-facturas del cliente
 */
export async function getPreFacturasPorCliente(clienteId) {
  try {
    const response = await axios.get(`${API_URL}/por-cliente/${clienteId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas por cliente:", error);
    throw error;
  }
}

/**
 * Obtiene pre-facturas por estado
 * @param {string} estado - Estado de la pre-factura
 * @returns {Promise<Array>} Lista de pre-facturas filtradas por estado
 */
export async function getPreFacturasPorEstado(estado) {
  try {
    const response = await axios.get(`${API_URL}/por-estado/${estado}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas por estado:", error);
    throw error;
  }
}


/**
 * Convierte una pre-factura a factura
 * @param {number} id - ID de la pre-factura
 * @returns {Promise<Object>} Factura generada
 */
export async function convertirPreFacturaAFactura(id) {
  try {
    const response = await axios.post(`${API_URL}/${id}/convertir-factura`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al convertir pre-factura a factura:", error);
    throw error;
  }
}


/**
 * Obtiene series de documentos filtradas por empresaId y tipoDocumentoId
 * @param {number} empresaId - ID de la empresa
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {Promise<Array>} Lista de series de documentos
 */
export async function getSeriesDoc(empresaId, tipoDocumentoId) {
  try {
    const params = {
      ...(empresaId && { empresaId }),
      ...(tipoDocumentoId && { tipoDocumentoId })
    };
    const response = await axios.get(`${API_URL}/series-doc`, { 
      params,
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener series de documentos:", error);
    throw error;
  }
}
/**
 * Genera una Factura Electrónica desde una PreFactura
 * @param {number} id - ID de la pre-factura
 * @param {Object} datos - Datos para la generación (serieDocFinalId, tipoDocumentoFinalId)
 * @returns {Promise<Object>} Comprobante electrónico generado
 */
export async function generarFacturaDesdePreFactura(id, datos) {
  try {
    const response = await axios.post(`${API_URL}/${id}/generar-factura`, datos, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al generar factura desde pre-factura:", error);
    throw error;
  }
}

/**
 * Genera una Boleta Electrónica desde una PreFactura
 * @param {number} id - ID de la pre-factura
 * @param {Object} datos - Datos para la generación (serieDocFinalId, tipoDocumentoFinalId)
 * @returns {Promise<Object>} Comprobante electrónico generado
 */
export async function generarBoletaDesdePreFactura(preFacturaId, datosBoleta) {
  try {
    const response = await axios.post(`${API_URL}/${preFacturaId}/generar-boleta`, datosBoleta, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al generar boleta desde pre-factura:", error);
    throw error;
  }
}

/**
 * Particionar PreFactura: Clona en DOS copias idénticas con estado PENDIENTE
 */
export async function partirPreFactura(preFacturaId) {
  try {
    const response = await axios.put(`${API_URL}/${preFacturaId}/partir`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al particionar pre-factura:", error);
    throw error;
  }
}

/**
 * Facturar PreFactura Negra (Gerencial)
 */
export async function facturarPreFacturaNegra(preFacturaId) {
  try {
    const response = await axios.post(`${API_URL}/${preFacturaId}/facturar-negra`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al facturar pre-factura negra:", error);
    throw error;
  }
}

/**
 * Facturar PreFactura Blanca (SUNAT)
 */
export async function facturarPreFacturaBlanca(preFacturaId) {
  try {
    const response = await axios.post(`${API_URL}/${preFacturaId}/facturar-blanca`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al facturar pre-factura blanca:", error);
    throw error;
  }
}

/**
 * Generar Comprobante Electrónico desde PreFactura EMITIDA
 */
export async function generarComprobanteElectronico(preFacturaId) {
  try {
    const response = await axios.put(`${API_URL}/${preFacturaId}/generar-comprobante`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error al generar comprobante electrónico:', error);
    throw error;
  }
}

/**
 * Aprobar una pre-factura
 * @param {number} id - ID de la pre-factura
 * @returns {Promise<Object>} Pre-factura aprobada
 */
export async function aprobarPreFactura(id) {
  try {
    const response = await axios.put(`${API_URL}/${id}/aprobar`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al aprobar pre-factura:", error);
    throw error;
  }
}

/**
 * Reactiva un documento de PreFactura (cambia estado a PENDIENTE)
 * @param {number} id - ID de la pre-factura
 * @returns {Promise<Object>} Resultado con estadísticas
 */
export async function reactivarDocumentoPreFactura(id) {
  try {
    const response = await axios.put(`${API_URL}/${id}/reactivar`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error al reactivar pre-factura:", error);
    throw error;
  }
}

/**
 * Obtiene el borrador de asiento contable para una PreFactura
 * @param {number} preFacturaId - ID de la PreFactura
 * @returns {Promise<Object>} - Borrador del asiento
 */
export async function obtenerBorradorAsiento(preFacturaId) {
  try {
    const response = await axios.get(`${API_URL}/${preFacturaId}/borrador-asiento`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener borrador de asiento:", error);
    throw error;
  }
}

/**
 * Guarda el asiento contable editado
 * @param {number} preFacturaId - ID de la PreFactura
 * @param {Object} asientoData - Datos del asiento editado
 * @returns {Promise<Object>} - Asiento guardado
 */
export async function guardarAsientoContable(preFacturaId, asientoData) {
  try {
    const response = await axios.post(
      `${API_URL}/${preFacturaId}/guardar-asiento`,
      { asientoData },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al guardar asiento contable:", error);
    throw error;
  }
}

/**
 * Elimina un asiento contable específico
 * @param {number} preFacturaId - ID de la PreFactura
 * @param {number} asientoId - ID del asiento a eliminar
 * @returns {Promise<Object>} - Confirmación
 */
export async function eliminarAsientoContable(preFacturaId, asientoId) {
  try {
    const response = await axios.delete(
      `${API_URL}/${preFacturaId}/asiento/${asientoId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar asiento contable:", error);
    throw error;
  }
}


export async function generarMovimientoAlmacenPreFactura(id, datosKardex) {
  const res = await axios.post(
    `${API_URL}/${id}/generar-movimiento`,
    datosKardex,
    { headers: getAuthHeaders() }
  );
  return res.data;
}

/**
 * Despacha el stock elegido por el usuario: un movimiento de salida por almacén, con su kardex y saldos.
 * @param {number} id - ID de la pre-factura (emitida)
 * @param {Object} payload - { conceptosPorAlmacen: {almacenId: conceptoId}, lineas: [{detallePreFacturaId, saldoDetProductoClienteId, cantidad}] }
 */
export async function despacharStockPreFactura(id, payload) {
  const res = await axios.post(
    `${API_URL}/${id}/despachar-stock`,
    payload,
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function regenerarKardexPreFactura(id) {
  const res = await axios.post(
    `${API_URL}/${id}/regenerar-kardex`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}


/**
 * Obtiene pre-facturas filtradas por empresa, cliente y fecha límite (para NC/ND)
 * @param {number} empresaId - ID de la empresa
 * @param {number} clienteId - ID del cliente
 * @param {string} fechaLimite - Fecha límite en formato ISO
 * @returns {Promise<Array>} Lista de pre-facturas filtradas
 */
export async function getPreFacturasParaDocumentoAfecto(empresaId, clienteId, fechaLimite) {
  try {
    const params = new URLSearchParams();
    if (empresaId) params.append('empresaId', empresaId);
    if (clienteId) params.append('clienteId', clienteId);
    if (fechaLimite) params.append('fechaLimite', fechaLimite);
    
    const response = await axios.get(`${API_URL}/por-cliente?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener pre-facturas para documento afecto:", error);
    throw error;
  }
}

export async function actualizarTipoOperacionSunatMasivo(ids, tipoOperacionSunatId) {
  const res = await axios.put(
    `${API_URL}/actualizar-tipo-operacion-sunat-masivo`,
    { ids, tipoOperacionSunatId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function actualizarTipoAfectacionIGVMasivo(ids, tipoAfectacionIGVId) {
  const res = await axios.put(
    `${API_URL}/actualizar-tipo-afectacion-igv-masivo`,
    { ids, tipoAfectacionIGVId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function actualizarUnidadNegocioMasivo(ids, unidadNegocioId) {
  const res = await axios.put(
    `${API_URL}/actualizar-unidad-negocio-masivo`,
    { ids, unidadNegocioId },
    { headers: getAuthHeaders() }
  );
  return res.data;
}
/**
 * Exporta Registro de Ventas SUNAT 14.1 (TXT)
 */
export async function exportarRegistroVentasSUNAT(params) {
  const res = await axios.get(`${API_URL}/exportar-registro-ventas-sunat`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  });
  return res.data;
}

/**
 * Boleteo automático: crea PreFactura + DetallePreFactura desde boletas ya emitidas.
 * Se envía en lotes pequeños para poder mostrar el avance.
 * @param {Array} boletas - Boletas normalizadas
 * @param {Object} parametros - { estadoId?, tipoOperacionSunatId? }
 * @returns {Promise<{resultados: Array}>} Un resultado por boleta: CREADA | OMITIDA | ERROR
 */
export async function importarBoletasAutomatico(boletas, parametros = {}) {
  const res = await axios.post(
    `${API_URL}/boleteo-automatico`,
    { boletas, parametros },
    { headers: getAuthHeaders() }
  );
  return res.data;
}