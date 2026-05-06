// src/components/contabilidad/asientoContable/asientoHelpers.js

/**
 * Calcula los totales de debe, haber, diferencia y estado de cuadrado
 * @param {Array} detalles - Array de detalles del asiento
 * @returns {Object} - Objeto con totalDebe, totalHaber, diferencia y estaCuadrado
 */
export const calcularTotales = (detalles) => {
  const totalDebe = detalles.reduce((sum, d) => sum + Number(d.debe || 0), 0);
  const totalHaber = detalles.reduce((sum, d) => sum + Number(d.haber || 0), 0);
  const diferencia = totalDebe - totalHaber;
  const estaCuadrado = Math.abs(diferencia) < 0.01;

  return {
    totalDebe,
    totalHaber,
    diferencia,
    estaCuadrado,
  };
};

/**
 * Formatea un monto en moneda peruana
 * @param {number} monto - Monto a formatear
 * @returns {string} - Monto formateado
 */
export const formatearMontoPEN = (monto) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto || 0);
};

/**
 * Formatea un monto decimal
 * @param {number} monto - Monto a formatear
 * @returns {string} - Monto formateado
 */
export const formatearMontoDecimal = (monto) => {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto || 0);
};

/**
 * Obtiene el código de moneda extranjera de los detalles
 * @param {Array} detalles - Array de detalles
 * @param {Array} monedas - Array de monedas disponibles
 * @returns {string|null} - Código de moneda o null
 */
export const obtenerMonedaExtranjera = (detalles, monedas) => {
  const detalleME = detalles.find((d) => Number(d.monedaId) !== 1);
  if (!detalleME) return null;

  const moneda = monedas.find((m) => Number(m.id) === Number(detalleME.monedaId));
  const codigoMoneda = moneda?.codigoSunat || null;
  return codigoMoneda && codigoMoneda !== "PEN" ? codigoMoneda : null;
};

/**
 * Calcula totales en moneda extranjera
 * @param {Array} detalles - Array de detalles
 * @returns {Object} - Objeto con totalDebeME, totalHaberME y totalNetoME
 */
export const calcularTotalesMonedaExtranjera = (detalles) => {
  const totalDebeME = detalles.reduce(
    (sum, d) => sum + Number(d.debeMonedaExtranjera || 0),
    0
  );
  const totalHaberME = detalles.reduce(
    (sum, d) => sum + Number(d.haberMonedaExtranjera || 0),
    0
  );
  const totalNetoME = totalDebeME - totalHaberME;

  return {
    totalDebeME,
    totalHaberME,
    totalNetoME,
  };
};

/**
 * Valida los datos de un detalle antes de guardarlo
 * @param {Object} detalleFormData - Datos del formulario de detalle
 * @returns {Object} - Objeto con isValid y mensaje de error
 */
export const validarDetalle = (detalleFormData) => {
  if (!detalleFormData.planCuentaId) {
    return {
      isValid: false,
      mensaje: "Debe seleccionar una cuenta contable",
    };
  }

  if (!detalleFormData.glosa) {
    return {
      isValid: false,
      mensaje: "Debe ingresar una glosa",
    };
  }

  if (!detalleFormData.monedaId) {
    return {
      isValid: false,
      mensaje: "Debe seleccionar una moneda",
    };
  }

  const esMonedaExtranjera = Number(detalleFormData.monedaId) !== 1;
  const debe = esMonedaExtranjera
    ? Number(detalleFormData.debeMonedaExtranjera || detalleFormData.debe || 0)
    : Number(detalleFormData.debe || 0);
  const haber = esMonedaExtranjera
    ? Number(detalleFormData.haberMonedaExtranjera || detalleFormData.haber || 0)
    : Number(detalleFormData.haber || 0);

  if (debe === 0 && haber === 0) {
    return {
      isValid: false,
      mensaje: "Debe ingresar un monto en Debe o Haber",
    };
  }

  if (debe > 0 && haber > 0) {
    return {
      isValid: false,
      mensaje: "No puede tener monto en Debe y Haber al mismo tiempo",
    };
  }

  return { isValid: true };
};

/**
 * Prepara un detalle para ser guardado (conversión de moneda)
 * @param {Object} detalleFormData - Datos del formulario
 * @param {number} tipoCambio - Tipo de cambio
 * @returns {Object} - Detalle preparado
 */
export const prepararDetalleParaGuardar = (detalleFormData, tipoCambio) => {
  const esMonedaExtranjera = Number(detalleFormData.monedaId) !== 1;
  const tc = Number(tipoCambio) || 1;

  const debe = esMonedaExtranjera
    ? Number(detalleFormData.debeMonedaExtranjera || detalleFormData.debe || 0)
    : Number(detalleFormData.debe || 0);
  const haber = esMonedaExtranjera
    ? Number(detalleFormData.haberMonedaExtranjera || detalleFormData.haber || 0)
    : Number(detalleFormData.haber || 0);

  let detalleConvertido = {
    ...detalleFormData,
    debe: 0,
    haber: 0,
    debeMonedaExtranjera: null,
    haberMonedaExtranjera: null,
  };

  if (esMonedaExtranjera) {
    if (debe > 0) {
      detalleConvertido.debeMonedaExtranjera = debe;
      detalleConvertido.debe = debe * tc;
    }
    if (haber > 0) {
      detalleConvertido.haberMonedaExtranjera = haber;
      detalleConvertido.haber = haber * tc;
    }
  } else {
    detalleConvertido.debe = debe;
    detalleConvertido.haber = haber;
  }

  return detalleConvertido;
};