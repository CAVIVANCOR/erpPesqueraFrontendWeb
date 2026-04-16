/**
 * combustibleUtils.js
 * 
 * Utilidades para cálculo de consumo de combustible en faenas pesqueras.
 * Documentado en español técnico.
 * 
 * @author ERP Megui
 * @version 1.0.1 - Corregido retorno de calcularDiferenciaTiempo
 */

/**
 * Calcula el consumo de combustible basado en distancia y rendimiento
 * 
 * @param {number} distanciaMillasNauticas - Distancia total recorrida en millas náuticas
 * @param {number} rendimientoMNporGalon - Rendimiento de la embarcación (MN/gal)
 * @returns {number} Galones consumidos
 */
export function calcularConsumoFaena(distanciaMillasNauticas, rendimientoMNporGalon) {
  if (!distanciaMillasNauticas || !rendimientoMNporGalon || rendimientoMNporGalon === 0) {
    return 0;
  }
  return distanciaMillasNauticas / rendimientoMNporGalon;
}

/**
 * Calcula el costo del combustible consumido
 * 
 * @param {number} galonesConsumidos - Galones consumidos
 * @param {number} precioPorGalon - Precio por galón (default: 12.00 soles)
 * @returns {number} Costo total en soles
 */
export function calcularCostoCombustible(galonesConsumidos, precioPorGalon = 12.00) {
  if (!galonesConsumidos) {
    return 0;
  }
  return galonesConsumidos * precioPorGalon;
}

/**
 * Calcula la diferencia de tiempo entre dos fechas
 * 
 * @param {Date|string} fechaInicio - Fecha/hora de inicio
 * @param {Date|string} fechaFin - Fecha/hora de fin
 * @returns {string} Texto formateado "Xh Ymin"
 */
export function calcularDiferenciaTiempo(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return "0h 0min";
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const diferenciaMs = fin - inicio;
  const totalMinutos = Math.floor(diferenciaMs / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return `${horas}h ${minutos}min`;
}

/**
 * Calcula la diferencia de tiempo en horas decimales
 * 
 * @param {Date|string} fechaInicio - Fecha/hora de inicio
 * @param {Date|string} fechaFin - Fecha/hora de fin
 * @returns {number} Tiempo en horas decimales
 */
export function calcularDiferenciaTiempoEnHoras(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return 0;
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const diferenciaMs = fin - inicio;
  const totalMinutos = Math.floor(diferenciaMs / 60000);
  
  return totalMinutos / 60;
}

/**
 * Calcula la velocidad promedio
 * 
 * @param {number} distanciaMillasNauticas - Distancia en millas náuticas
 * @param {string} tiempoFormateado - Tiempo formateado "Xh Ymin"
 * @returns {number} Velocidad en nudos
 */
export function calcularVelocidadPromedio(distanciaMillasNauticas, tiempoFormateado) {
  if (!distanciaMillasNauticas || !tiempoFormateado) {
    return 0;
  }

  // Extraer horas y minutos del string "Xh Ymin"
  const match = tiempoFormateado.match(/(\d+)h\s*(\d+)min/);
  if (!match) {
    return 0;
  }

  const horas = parseInt(match[1]);
  const minutos = parseInt(match[2]);
  const tiempoHoras = horas + (minutos / 60);

  if (tiempoHoras === 0) {
    return 0;
  }

  return distanciaMillasNauticas / tiempoHoras;
}