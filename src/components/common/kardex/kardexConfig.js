/**
 * Configuración centralizada para generación de Kardex
 * Define comportamiento según tipo de documento
 * Patrón: Configuración estática reutilizable
 */

export const KARDEX_CONFIG = {
  ordenCompra: {
    tipoConceptoId: 1, // COMPRA (TipoConcepto)
    tipoMovimientoId: 2, // INGRESO (TipoMovimientoAlmacen)
    tipoDocumentoAlmacen: 13, // Nota de Ingreso
    labelAlmacen: "Almacén Destino",
    placeholderAlmacen: "Seleccionar almacén de recepción...",
    tooltipAlmacen: "Almacén donde ingresará la mercadería comprada",
    labelConcepto: "Concepto de Movimiento",
    placeholderConcepto: "Concepto de ingreso por compra...",
    direccionFlujo: "Proveedor → Almacén",
    efectoStock: "⬆️ AUMENTA",
    colorOperacion: "success",
    iconoOperacion: "pi-arrow-down",
    campoRelacion: "movIngresoAlmacenId",
    tituloDialog: "Generar Movimiento de Almacén - ORDEN DE COMPRA",
    mensajeConfirmacion: "Se creará el movimiento de ingreso a almacén y se actualizarán los saldos de stock.",
  },

  preFactura: {
    tipoConceptoId: 2, // VENTA (TipoConcepto)
    tipoMovimientoId: 3, // SALIDA (TipoMovimientoAlmacen)
    tipoDocumentoAlmacen: 14, // Nota de Salida
    labelAlmacen: "Almacén Origen",
    placeholderAlmacen: "Seleccionar almacén de salida...",
    tooltipAlmacen: "Almacén desde donde saldrá la mercadería vendida",
    labelConcepto: "Concepto de Movimiento",
    placeholderConcepto: "Concepto de egreso por venta...",
    direccionFlujo: "Almacén → Cliente",
    efectoStock: "⬇️ REDUCE",
    colorOperacion: "danger",
    iconoOperacion: "pi-arrow-up",
    campoRelacion: "movSalidaAlmacenId",
    tituloDialog: "Generar Movimiento de Almacén - PRE-FACTURA",
    mensajeConfirmacion: "Se creará el movimiento de salida de almacén y se actualizarán los saldos de stock.",
  },

  notaCredito: {
    tipoConceptoId: 2, // VENTA (TipoConcepto) - Devolución de venta
    tipoMovimientoId: 2, // INGRESO (TipoMovimientoAlmacen)
    tipoDocumentoAlmacen: 13, // Nota de Ingreso
    labelAlmacen: "Almacén Destino",
    placeholderAlmacen: "Seleccionar almacén de devolución...",
    tooltipAlmacen: "Almacén donde ingresará la mercadería devuelta por el cliente",
    labelConcepto: "Concepto de Movimiento",
    placeholderConcepto: "Concepto de devolución de venta...",
    direccionFlujo: "Cliente → Almacén",
    efectoStock: "⬆️ AUMENTA",
    colorOperacion: "info",
    iconoOperacion: "pi-replay",
    campoRelacion: "movIngresoAlmacenId",
    tituloDialog: "Generar Movimiento de Almacén - NOTA DE CRÉDITO",
    mensajeConfirmacion: "Se creará el movimiento de ingreso por devolución y se actualizarán los saldos de stock.",
  },

  notaDebito: {
    tipoConceptoId: 1, // COMPRA (TipoConcepto) - Devolución a proveedor
    tipoMovimientoId: 3, // SALIDA (TipoMovimientoAlmacen)
    tipoDocumentoAlmacen: 14, // Nota de Salida
    labelAlmacen: "Almacén Origen",
    placeholderAlmacen: "Seleccionar almacén de devolución...",
    tooltipAlmacen: "Almacén desde donde saldrá la mercadería a devolver al proveedor",
    labelConcepto: "Concepto de Movimiento",
    placeholderConcepto: "Concepto de devolución a proveedor...",
    direccionFlujo: "Almacén → Proveedor",
    efectoStock: "⬇️ REDUCE",
    colorOperacion: "warning",
    iconoOperacion: "pi-replay",
    campoRelacion: "movSalidaAlmacenId",
    tituloDialog: "Generar Movimiento de Almacén - NOTA DE DÉBITO",
    mensajeConfirmacion: "Se creará el movimiento de salida por devolución y se actualizarán los saldos de stock.",
  },
};

/**
 * Obtiene configuración para un tipo de documento
 * @param {string} tipoDocumento - Tipo de documento (ordenCompra, preFactura, etc.)
 * @returns {object} Configuración del tipo de documento
 */
export const getKardexConfig = (tipoDocumento) => {
  const config = KARDEX_CONFIG[tipoDocumento];
  if (!config) {
    throw new Error(`Tipo de documento no soportado: ${tipoDocumento}`);
  }
  return config;
};