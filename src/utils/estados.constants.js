// ════════════════════════════════════════════════════════════
// CONSTANTES DE ESTADOS DEL SISTEMA
// ════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────
// ESTADOS: ASIENTO CONTABLE
// ────────────────────────────────────────────────────────────
export const ESTADO_ASIENTO_CONTABLE = {
  PENDIENTE: 76,
  APROBADO: 77,
  ANULADO: 78,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: CUENTAS POR PAGAR
// ────────────────────────────────────────────────────────────
export const ESTADO_CUENTA_POR_PAGAR = {
  PENDIENTE: 106,
  PAGO_PARCIAL: 107,
  PAGADO: 108,
  VENCIDO: 109,
  ANULADO: 110,
  CANJEADO: 111,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: ORDEN DE COMPRA
// ────────────────────────────────────────────────────────────
export const ESTADO_ORDEN_COMPRA = {
  PENDIENTE: 38,
  APROBADO: 39,
  ANULADO: 40,
  KARDEX_GENERADO: 50,
  PARTICIONADA: 112,
  FACTURADA: 113,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: PRE FACTURA
// ────────────────────────────────────────────────────────────
export const ESTADO_PREFACTURA = {
  PENDIENTE: 45,
  APROBADA: 46,
  ANULADA: 47,
  PARTICIONADA: 48,
  FACTURADA: 95,
  EMITIDA: 96,
  COMPROBANTE_ELECTRONICO_GENERADO: 97,
  VALIDADO_SUNAT: 98,
  NO_VALIDADO_SUNAT: 99,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: CUENTA POR COBRAR
// ────────────────────────────────────────────────────────────
export const ESTADO_CUENTA_POR_COBRAR = {
  PENDIENTE: 100,
  PAGO_PARCIAL: 101,
  PAGADO: 102,
  VENCIDO: 103,
  ANULADO: 104,
  CANJEADO: 105,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: DETRACCION
// ────────────────────────────────────────────────────────────
export const ESTADO_DETRACCION = {
  PENDIENTE: 126,
  VALIDADO: 127,
  ASIENTO_GENERADO: 128,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: RETENCION
// ────────────────────────────────────────────────────────────
export const ESTADO_RETENCION = {
  PENDIENTE: 129,
  VALIDADO: 130,
  ASIENTO_GENERADO: 131,
};

// ────────────────────────────────────────────────────────────
// ESTADOS: PERCEPCION
// ────────────────────────────────────────────────────────────
export const ESTADO_PERCEPCION = {
  PENDIENTE: 132,
  VALIDADO: 133,
  ASIENTO_GENERADO: 134,
};

// ────────────────────────────────────────────────────────────
// TIPOS DE DOCUMENTO (para impuestos SUNAT)
// ────────────────────────────────────────────────────────────
export const TIPO_DOCUMENTO_SUNAT = {
  DETRACCION: 26,
  RETENCION: 27,
  PERCEPCION: 28,
};

// ────────────────────────────────────────────────────────────
// SEVERITY MAPPING (para referencia)
// ────────────────────────────────────────────────────────────
export const ESTADO_SEVERITY = {
  // Asiento Contable
  [ESTADO_ASIENTO_CONTABLE.PENDIENTE]: 'warning',
  [ESTADO_ASIENTO_CONTABLE.APROBADO]: 'contrast',
  [ESTADO_ASIENTO_CONTABLE.ANULADO]: 'danger',
  
  // Cuenta por Pagar
  [ESTADO_CUENTA_POR_PAGAR.PENDIENTE]: 'danger',
  [ESTADO_CUENTA_POR_PAGAR.PAGO_PARCIAL]: 'warning',
  [ESTADO_CUENTA_POR_PAGAR.PAGADO]: 'success',
  [ESTADO_CUENTA_POR_PAGAR.VENCIDO]: 'danger',
  [ESTADO_CUENTA_POR_PAGAR.ANULADO]: 'secondary',
  [ESTADO_CUENTA_POR_PAGAR.CANJEADO]: 'contrast',
  
  // Orden de Compra
  [ESTADO_ORDEN_COMPRA.PENDIENTE]: 'warning',
  [ESTADO_ORDEN_COMPRA.APROBADO]: 'success',
  [ESTADO_ORDEN_COMPRA.ANULADO]: 'danger',
  [ESTADO_ORDEN_COMPRA.KARDEX_GENERADO]: 'success',
  [ESTADO_ORDEN_COMPRA.PARTICIONADA]: 'secondary',
  [ESTADO_ORDEN_COMPRA.FACTURADA]: 'contrast',
};