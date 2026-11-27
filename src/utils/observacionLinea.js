/**
 * Observación de una línea de compra apta para imprimir (misma regla que el backend: src/utils/observacionLinea.js).
 *
 * DetalleOrdenCompra.observaciones también guarda textos internos que no deben salir en un documento: la nota de la importación
 * SIRE ("📋 CONCEPTO ORIGINAL (XML): ...") y la marca de anticipos ("ANTICIPO-OC:<id> ").
 *
 * @param {string|null|undefined} texto - Valor de DetalleOrdenCompra.observaciones
 * @returns {string} Texto imprimible ("" si no hay nada que mostrar). Los saltos de línea se conservan.
 */
export const observacionImprimible = (texto) => {
  const limpio = String(texto ?? "").trim();
  if (!limpio || limpio.startsWith("📋 CONCEPTO ORIGINAL")) return "";
  return limpio.replace(/^ANTICIPO-OC:\d+\s*/, "").trim();
};

export default observacionImprimible;
