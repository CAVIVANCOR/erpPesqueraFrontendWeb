// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\asignarStockUtils.js

/**
 * ============================================================================
 * UTILIDADES PARA ASIGNACIÓN DE STOCK (SIMPLIFICADO)
 * ============================================================================
 * 
 * Funciones auxiliares para el proceso de asignación de stock.
 * Versión simplificada - solo funciones esenciales.
 */

/**
 * Calcular peso proporcional basado en cantidad asignada
 */
export const calcularPesoProporcional = (cantidadAsignada, cantidadTotal, pesoTotal) => {
  if (!cantidadTotal || cantidadTotal === 0) return 0;
  return (cantidadAsignada / cantidadTotal) * pesoTotal;
};

/**
 * Validar que la cantidad asignada sea válida
 */
export const validarCantidadAsignada = (cantidadAsignada, cantidadDisponible) => {
  if (cantidadAsignada <= 0) {
    return {
      valido: false,
      mensaje: "La cantidad debe ser mayor a 0"
    };
  }

  if (cantidadAsignada > cantidadDisponible) {
    return {
      valido: false,
      mensaje: `La cantidad no puede ser mayor al disponible (${cantidadDisponible})`
    };
  }

  return {
    valido: true
  };
};