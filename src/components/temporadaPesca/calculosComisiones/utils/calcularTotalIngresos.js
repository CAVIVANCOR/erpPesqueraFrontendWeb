/**
 * calcularTotalIngresos.js
 * Función utilitaria para calcular el Total de Ingresos con lógica de cuota propia
 */

/**
 * Calcula el total de ingresos procesando descargas con lógica de cuota propia
 * Aplica el porcentaje base de liquidación al final
 * @param {Object} temporada - Objeto temporada con cuotaPropiaTon, precioPorTonDolares, precioPorTonDolaresAlternativo, porcentajeBaseLiqPesca
 * @param {Array} descargas - Array de descargas con toneladas
 * @returns {number} - Total de ingresos en US$ aplicando porcentaje base
 */
export function calcularTotalIngresos(temporada, descargas) {
  if (!temporada || !descargas || descargas.length === 0) {
    return 0;
  }

  const precioPorTonPropia = Number(temporada.precioPorTonDolares || 0);
  const precioPorTonAlternativo = Number(temporada.precioPorTonDolaresAlternativo || 0);
  const cuotaPropiaTon = Number(temporada.cuotaPropiaTon || 0);
  const porcentajeBaseLiqPesca = Number(temporada.porcentajeBaseLiqPesca || 0);

  let totalIngresos = 0;
  let acumulado = 0;

  descargas.forEach((descarga) => {
    const toneladas = Number(descarga.toneladas || 0);
    const restanteCuota = cuotaPropiaTon - acumulado;

    if (acumulado < cuotaPropiaTon) {
      // Aún hay cuota propia disponible
      if (toneladas <= restanteCuota) {
        // Toda la descarga cabe en cuota propia
        totalIngresos += toneladas * precioPorTonPropia;
      } else {
        // Se parte: una parte en cuota, otra en excedente
        totalIngresos += restanteCuota * precioPorTonPropia;
        totalIngresos += (toneladas - restanteCuota) * precioPorTonAlternativo;
      }
    } else {
      // Ya se superó la cuota, todo es excedente
      totalIngresos += toneladas * precioPorTonAlternativo;
    }

    acumulado += toneladas;
  });
  const porcentaje = porcentajeBaseLiqPesca / 100;
  return totalIngresos * porcentaje;
}