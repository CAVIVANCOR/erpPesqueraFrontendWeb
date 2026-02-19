// src/shared/stores/useDashboardStore.js
import { create } from 'zustand';

/**
 * Store para manejar el estado de los dashboards
 * - vistaActual: 'modular' (vista global) o 'unidades' (vista por unidades de negocio)
 * - unidadSeleccionada: Objeto con la unidad de negocio seleccionada (solo para vista unidades)
 */
export const useDashboardStore = create((set) => ({
  // Estado inicial
  vistaActual: 'modular', // Por defecto vista modular
  unidadSeleccionada: null,
  searchQuery: '', // Query de búsqueda para filtrar módulos
  
  // Cambiar a vista modular (global)
  cambiarAModular: () => set({ 
    vistaActual: 'modular', 
    unidadSeleccionada: null 
  }),
  
  // Cambiar a vista por unidades de negocio
  cambiarAUnidades: () => set({ 
    vistaActual: 'unidades' 
  }),
  
  // Seleccionar una unidad de negocio específica
  seleccionarUnidad: (unidad) => set({ 
    unidadSeleccionada: unidad,
    vistaActual: 'unidades'
  }),
  
  // Limpiar unidad seleccionada
  limpiarUnidad: () => set({
    unidadSeleccionada: null
  }),
  
  // Actualizar query de búsqueda
  setSearchQuery: (query) => set({
    searchQuery: query
  })
}));