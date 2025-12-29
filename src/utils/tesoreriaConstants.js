// src/utils/tesoreriaConstants.js
// Constantes para módulos de Tesorería Avanzada
// Basadas en los enums definidos en schema.prisma

// ============================================
// PRÉSTAMO BANCARIO
// ============================================

export const TIPOS_PRESTAMO = [
  { label: "CAPITAL DE TRABAJO", value: "CAPITAL_TRABAJO" },
  { label: "ACTIVO FIJO", value: "ACTIVO_FIJO" },
  { label: "HIPOTECARIO", value: "HIPOTECARIO" },
  { label: "VEHICULAR", value: "VEHICULAR" },
  { label: "EQUIPAMIENTO", value: "EQUIPAMIENTO" },
  { label: "EXPANSIÓN", value: "EXPANSION" },
  { label: "REFINANCIAMIENTO", value: "REFINANCIAMIENTO" },
];

export const TIPOS_AMORTIZACION = [
  { label: "FRANCÉS (Cuotas Fijas)", value: "FRANCES" },
  { label: "ALEMÁN (Amortización Constante)", value: "ALEMAN" },
  { label: "AMERICANO (Solo Intereses)", value: "AMERICANO" },
];

export const FRECUENCIAS_PAGO = [
  { label: "MENSUAL", value: "MENSUAL" },
  { label: "BIMESTRAL", value: "BIMESTRAL" },
  { label: "TRIMESTRAL", value: "TRIMESTRAL" },
  { label: "CUATRIMESTRAL", value: "CUATRIMESTRAL" },
  { label: "SEMESTRAL", value: "SEMESTRAL" },
  { label: "ANUAL", value: "ANUAL" },
];

export const TIPOS_TASA = [
  { label: "EFECTIVA ANUAL", value: "EFECTIVA_ANUAL" },
  { label: "NOMINAL ANUAL", value: "NOMINAL_ANUAL" },
  { label: "EFECTIVA MENSUAL", value: "EFECTIVA_MENSUAL" },
];

export const TIPOS_GARANTIA = [
  { label: "HIPOTECARIA", value: "HIPOTECARIA" },
  { label: "PRENDARIA", value: "PRENDARIA" },
  { label: "FIANZA", value: "FIANZA" },
  { label: "SIN GARANTÍA", value: "SIN_GARANTIA" },
];

export const ESTADOS_PAGO_CUOTA = [
  { label: "PENDIENTE", value: "PENDIENTE" },
  { label: "PAGADO", value: "PAGADO" },
  { label: "VENCIDO", value: "VENCIDO" },
  { label: "PARCIAL", value: "PARCIAL" },
];

// ============================================
// LÍNEA DE CRÉDITO
// ============================================

export const TIPOS_LINEA_CREDITO = [
  { label: "REVOLVENTE", value: "REVOLVENTE" },
  { label: "CARTA DE CRÉDITO", value: "CARTA_CREDITO" },
  { label: "GARANTÍA BANCARIA", value: "GARANTIA_BANCARIA" },
  { label: "SOBREGIRO", value: "SOBREGIRO" },
];

export const ESTADOS_UTILIZACION_LINEA = [
  { label: "VIGENTE", value: "VIGENTE" },
  { label: "DEVUELTO", value: "DEVUELTO" },
  { label: "VENCIDO", value: "VENCIDO" },
];

// ============================================
// INVERSIÓN FINANCIERA
// ============================================

export const TIPOS_INVERSION = [
  { label: "DEPÓSITO A PLAZO FIJO", value: "PLAZO_FIJO" },
  { label: "FONDO MUTUO", value: "FONDO_MUTUO" },
  { label: "BONOS", value: "BONOS" },
  { label: "ACCIONES", value: "ACCIONES" },
  { label: "CTS", value: "CTS" },
];

export const TIPOS_MOVIMIENTO_INVERSION = [
  { label: "INVERSIÓN", value: "INVERSION" },
  { label: "RENDIMIENTO", value: "RENDIMIENTO" },
  { label: "RETIRO", value: "RETIRO" },
  { label: "AJUSTE", value: "AJUSTE" },
  { label: "LIQUIDACIÓN", value: "LIQUIDACION" },
];

export const PERIODICIDADES_PAGO = [
  { label: "AL VENCIMIENTO", value: "VENCIMIENTO" },
  { label: "MENSUAL", value: "MENSUAL" },
  { label: "TRIMESTRAL", value: "TRIMESTRAL" },
  { label: "SEMESTRAL", value: "SEMESTRAL" },
  { label: "ANUAL", value: "ANUAL" },
];

export const OPCIONES_RENOVACION = [
  { label: "SÍ", value: true },
  { label: "NO", value: false },
];
