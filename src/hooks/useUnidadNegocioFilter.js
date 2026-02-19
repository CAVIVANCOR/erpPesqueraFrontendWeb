// src/hooks/useUnidadNegocioFilter.js
import { useState, useEffect, useMemo } from 'react';
import { useDashboardStore } from '../shared/stores/useDashboardStore';

/**
 * Hook personalizado para manejar el filtrado por Unidad de Negocio
 * 
 * Uso:
 * const { datosFiltrados, unidadActiva } = useUnidadNegocioFilter(datos);
 * 
 * Comportamiento:
 * - Dashboard Modular → unidadActiva = null (muestra TODAS)
 * - Dashboard Unidades → unidadActiva = unidad seleccionada (filtra automáticamente)
 * 
 * @param {Array} datos - Array de datos a filtrar
 * @returns {Object} { datosFiltrados, unidadActiva }
 */
export function useUnidadNegocioFilter(datos = []) {
  const { vistaActual, unidadSeleccionada } = useDashboardStore();
  const [unidadActiva, setUnidadActiva] = useState(null);

  // Auto-seleccionar unidad cuando viene de Dashboard Unidades
  useEffect(() => {
    if (vistaActual === 'unidades' && unidadSeleccionada) {
      setUnidadActiva(unidadSeleccionada);
    } else {
      setUnidadActiva(null); // TODAS
    }
  }, [vistaActual, unidadSeleccionada]);

  // Filtrar datos según la unidad activa
  const datosFiltrados = useMemo(() => {
    if (!datos || datos.length === 0) return [];
    
    // Si no hay filtro activo, mostrar todos
    if (!unidadActiva) return datos;
    
    // Filtrar por unidadNegocioId
    return datos.filter(item => {
      // Verificar si el item tiene unidadNegocioId
      if (!item.unidadNegocioId) return false;
      
      // Comparar con la unidad activa
      return Number(item.unidadNegocioId) === Number(unidadActiva.id);
    });
  }, [datos, unidadActiva]);

  return {
    datosFiltrados,
    unidadActiva,
    totalRegistros: datos?.length || 0,
    registrosFiltrados: datosFiltrados?.length || 0,
  };
}
