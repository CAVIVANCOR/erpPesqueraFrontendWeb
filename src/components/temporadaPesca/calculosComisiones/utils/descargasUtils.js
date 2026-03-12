/**
 * descargasUtils.js
 * Funciones utilitarias para formateo y validación de datos de descargas
 */

/**
 * Formatea el peso en toneladas con 3 decimales
 * @param {number} peso - Peso en toneladas
 * @returns {string} Peso formateado
 */
export const formatearPesoToneladas = (peso) => {
  if (!peso && peso !== 0) return "0.000";
  return Number(peso).toFixed(3);
};

/**
 * Formatea el precio por tonelada
 * @param {number} precio - Precio por tonelada
 * @param {string} moneda - Código de moneda (USD, PEN, etc.)
 * @returns {string} Precio formateado
 */
export const formatearPrecioPorTon = (precio, moneda = "USD") => {
  if (!precio && precio !== 0) return `${moneda} 0.00`;
  return `${moneda} ${Number(precio).toFixed(2)}`;
};

/**
 * Calcula el total de comisión para una descarga
 * @param {number} pesoToneladas - Peso en toneladas
 * @param {number} precioPorTon - Precio por tonelada
 * @returns {number} Total calculado
 */
export const calcularTotalComision = (pesoToneladas, precioPorTon) => {
  if (!pesoToneladas || !precioPorTon) return 0;
  return Number(pesoToneladas) * Number(precioPorTon);
};

/**
 * Valida si una descarga tiene los datos mínimos requeridos
 * @param {object} descarga - Objeto descarga
 * @returns {object} { valido: boolean, errores: string[] }
 */
export const validarDescarga = (descarga) => {
  const errores = [];

  if (!descarga.clienteId) {
    errores.push("Falta asignar cliente");
  }

  if (!descarga.pesoToneladas || descarga.pesoToneladas <= 0) {
    errores.push("Peso inválido");
  }

  if (!descarga.precioPorTonComisionFidelizacion || descarga.precioPorTonComisionFidelizacion <= 0) {
    errores.push("Precio inválido");
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};

/**
 * Agrupa descargas por cliente
 * @param {array} descargas - Array de descargas
 * @returns {object} Descargas agrupadas por clienteId
 */
export const agruparDescargasPorCliente = (descargas) => {
  if (!descargas || descargas.length === 0) return {};

  return descargas.reduce((grupos, descarga) => {
    const clienteId = descarga.clienteId || "sin_cliente";
    if (!grupos[clienteId]) {
      grupos[clienteId] = [];
    }
    grupos[clienteId].push(descarga);
    return grupos;
  }, {});
};

/**
 * Calcula estadísticas de descargas
 * @param {array} descargas - Array de descargas
 * @returns {object} Estadísticas calculadas
 */
export const calcularEstadisticasDescargas = (descargas) => {
  if (!descargas || descargas.length === 0) {
    return {
      totalDescargas: 0,
      totalToneladas: 0,
      totalComision: 0,
      descargasConCliente: 0,
      descargasSinCliente: 0,
      descargasConPrecio: 0,
      descargasSinPrecio: 0,
    };
  }

  const stats = {
    totalDescargas: descargas.length,
    totalToneladas: 0,
    totalComision: 0,
    descargasConCliente: 0,
    descargasSinCliente: 0,
    descargasConPrecio: 0,
    descargasSinPrecio: 0,
  };

  descargas.forEach((descarga) => {
    stats.totalToneladas += Number(descarga.pesoToneladas || 0);
    stats.totalComision += calcularTotalComision(
      descarga.pesoToneladas,
      descarga.precioPorTonComisionFidelizacion
    );

    if (descarga.clienteId) {
      stats.descargasConCliente++;
    } else {
      stats.descargasSinCliente++;
    }

    if (descarga.precioPorTonComisionFidelizacion && descarga.precioPorTonComisionFidelizacion > 0) {
      stats.descargasConPrecio++;
    } else {
      stats.descargasSinPrecio++;
    }
  });

  return stats;
};