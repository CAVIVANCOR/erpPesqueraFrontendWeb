/**
 * calculoIngresosFacturacionTotalPescaIndustrial.js
 * Función utilitaria para calcular el Total de Ingresos de Facturación con precios especiales/globales
 */

import { obtenerPrecioVigente } from "../../../../api/precioEntidad";

/**
 * Calcula el total de ingresos de facturación procesando descargas con precios especiales o globales
 * @param {Object} temporada - Objeto temporada completo con empresa
 * @param {Array} descargas - Array de descargas con clienteId, especieId, toneladas, fechaDescarga
 * @param {Function} showToast - Función para mostrar mensajes Toast
 * @returns {Promise<number|null>} - Total de ingresos en US$ o null si hay error
 */
export async function calcularIngresosTotalPesca(temporada, descargas, showToast) {
  if (!temporada || !descargas || descargas.length === 0) {
    return 0;
  }

  if (!temporada.empresa || !temporada.empresa.entidadComercialId) {
    showToast?.({
      severity: "error",
      summary: "Error de Configuración",
      detail: "La temporada no tiene empresa o entidad comercial configurada",
      life: 5000,
    });
    return null;
  }

  let totalIngresos = 0;

  try {
    for (const descarga of descargas) {
      const { clienteId, especieId, toneladas, fechaHoraInicioDescarga } = descarga;

      if (!especieId) {
        showToast?.({
          severity: "warn",
          summary: "Descarga sin Especie",
          detail: `Descarga del ${fechaHoraInicioDescarga ? new Date(fechaHoraInicioDescarga).toLocaleDateString() : 'fecha desconocida'} no tiene especie asignada`,
          life: 5000,
        });
        continue;
      }

      // Obtener precio vigente (especial o global)
      const precioData = await obtenerPrecioVigente(
        temporada.empresaId,
        temporada.empresa.entidadComercialId,
        especieId,
        clienteId || null,
        fechaHoraInicioDescarga
      );

      if (!precioData || !precioData.precioUnitario) {
        const clienteNombre = descarga.cliente?.razonSocial || descarga.cliente?.nombreComercial || "Sin cliente";
        const especieNombre = descarga.especie?.nombre || `Especie ID ${especieId}`;
        
        showToast?.({
          severity: "error",
          summary: "Precio No Configurado",
          detail: `No se encontró precio vigente para:
- Fecha: ${fechaHoraInicioDescarga ? new Date(fechaHoraInicioDescarga).toLocaleDateString() : 'No definida'}
- Especie: ${especieNombre}
- Cliente: ${clienteNombre}

Configure un precio especial o global vigente para esta fecha.`,
          life: 8000,
        });
        return null;
      }

      // Calcular ingreso de esta descarga
      const ingreso = Number(toneladas || 0) * Number(precioData.precioUnitario);
      totalIngresos += ingreso;
    }

    return totalIngresos;
  } catch (error) {
    console.error("Error al calcular total de ingresos:", error);
    showToast?.({
      severity: "error",
      summary: "Error de Cálculo",
      detail: error.response?.data?.message || "Error al calcular el total de ingresos",
      life: 5000,
    });
    return null;
  }
}