/**
 * calcularIngresoFidelizacion.js
 * Función utilitaria para calcular el Total de Ingreso por Fidelización
 * que los clientes pagan a la empresa Megui
 */

/**
 * Calcula el total de ingresos por fidelización que pagan los clientes
 * @param {Array} descargas - Array de descargas con toneladas y precioPorTonComisionFidelizacion
 * @returns {number} - Total de ingresos por fidelización en US$
 */
export function calcularIngresoFidelizacion(descargas) {
  if (!descargas || descargas.length === 0) {
    return 0;
  }

  let totalIngreso = 0;

  descargas.forEach(descarga => {
    const toneladas = Number(descarga.toneladas || 0);
    const precioPorTon = Number(descarga.precioPorTonComisionFidelizacion || 0);
    
    totalIngreso += toneladas * precioPorTon;
  });

  return totalIngreso;
}