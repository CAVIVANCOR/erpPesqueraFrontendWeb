/**
 * Constantes de Tipos de Documento del Sistema
 * Usadas para identificar documentos en frontend
 */

// IDs de Tipos de Documento
export const TIPO_DOC_ID = {
  OTROS: 1,
  FACTURA: 2,
  RECIBO_HONORARIOS: 3,
  BOLETA_VENTA: 4,
  LIQUIDACION_COMPRA: 5,
  BOLETO_TRANSPORTE: 6,
  PORTE_AEREO: 7,
  NOTA_CREDITO: 8,
  NOTA_DEBITO: 9,
  GUIA_REMISION: 10,
  RECIBO_ARRENDAMIENTO: 11,
  COMPROBANTE_RETENCION: 12,
  VALE_INGRESO: 13,
  VALE_SALIDA: 14,
  NOTA_TRANSFERENCIA: 15,
  REQUERIMIENTO_COMPRA: 16,
  ORDEN_COMPRA: 17,
  COTIZACION_VENTA: 18,
  PRE_FACTURA: 19,
  CONTRATO: 20,
  ORDEN_TRABAJO: 21,
  SI_CXC: 22,
  SI_CXP: 23,
  SI_ANTICIPO_PROVEEDOR: 24,
  SI_ANTICIPO_CLIENTE: 25,
  DETRACCION: 26,
  RETENCION: 27,
  PERCEPCION: 28,
  SI_DET_CXP: 29,
  DOC_COBRANZA: 30,
};

// Códigos SUNAT de Tipos de Documento
export const CODIGO_SUNAT = {
  OTROS: "00",
  FACTURA: "01",
  RECIBO_HONORARIOS: "02",
  BOLETA_VENTA: "03",
  LIQUIDACION_COMPRA: "04",
  BOLETO_TRANSPORTE: "05",
  PORTE_AEREO: "06",
  NOTA_CREDITO: "07",
  NOTA_DEBITO: "08",
  GUIA_REMISION: "09",
  RECIBO_ARRENDAMIENTO: "10",
  COMPROBANTE_RETENCION: "20",
};

// Documentos que deben tener monto negativo
export const DOCS_MONTO_NEGATIVO = [
  TIPO_DOC_ID.NOTA_CREDITO,
];

// Documentos que deben tener monto negativo por código SUNAT
export const CODIGOS_SUNAT_MONTO_NEGATIVO = [
  CODIGO_SUNAT.NOTA_CREDITO,
];

/**
 * Verifica si un tipo de documento debe tener monto negativo
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {boolean}
 */
export const esTipoDocumentoNegativo = (tipoDocumentoId) => {
  return DOCS_MONTO_NEGATIVO.includes(Number(tipoDocumentoId));
};

/**
 * Verifica si un código SUNAT debe tener monto negativo
 * @param {string} codigoSunat - Código SUNAT del documento
 * @returns {boolean}
 */
export const esCodigoSunatNegativo = (codigoSunat) => {
  return CODIGOS_SUNAT_MONTO_NEGATIVO.includes(codigoSunat);
};

/**
 * Aplica el signo correcto al monto según el tipo de documento
 * @param {number} monto - Monto a ajustar
 * @param {number} tipoDocumentoId - ID del tipo de documento
 * @returns {number}
 */
export const aplicarSignoMonto = (monto, tipoDocumentoId) => {
  if (esTipoDocumentoNegativo(tipoDocumentoId)) {
    return -Math.abs(monto);
  }
  return Math.abs(monto);
};

/**
 * Aplica el signo correcto al monto según código SUNAT
 * @param {number} monto - Monto a ajustar
 * @param {string} codigoSunat - Código SUNAT del documento
 * @returns {number}
 */
export const aplicarSignoMontoPorCodigo = (monto, codigoSunat) => {
  if (esCodigoSunatNegativo(codigoSunat)) {
    return -Math.abs(monto);
  }
  return Math.abs(monto);
};

/**
 * Formatea el monto con color según signo
 * @param {number} monto - Monto a formatear
 * @returns {object} { valor, color, esNegativo }
 */
export const formatearMontoConSigno = (monto) => {
  const valor = Number(monto);
  return {
    valor: valor.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    color: valor < 0 ? "red" : "inherit",
    esNegativo: valor < 0,
  };
};