/**
 * calcularFidelizacionPersonal.js
 * Función utilitaria para calcular el Total de Fidelización que se reparte al Personal
 * Suma todas las comisiones generadas (lo que Megui paga a su personal)
 */

/**
 * Calcula el total de fidelización que se reparte al personal
 * @param {Array} comisionesGeneradas - Array de comisiones con montoPagarFidelizacionDolares
 * @returns {number} - Total de fidelización a personal en US$
 */
export function calcularFidelizacionPersonal(comisionesGeneradas) {
  if (!comisionesGeneradas || comisionesGeneradas.length === 0) {
    return 0;
  }

  let totalFidelizacion = 0;

  comisionesGeneradas.forEach(comision => {
    const monto = Number(comision.montoPagarFidelizacionDolares || 0);
    totalFidelizacion += monto;
  });

  return totalFidelizacion;
}