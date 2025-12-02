// src/context/ModuloContext.jsx
/**
 * ModuloContext - Context profesional para gestión de módulos del ERP
 * 
 * Este contexto centraliza:
 * - Estado de pestañas abiertas
 * - Función para abrir módulos
 * - Función para cerrar pestañas
 * - Índice de pestaña activa
 */

import { createContext, useContext } from 'react';

export const ModuloContext = createContext(null);

export const useModulo = () => {
  const context = useContext(ModuloContext);
  if (!context) {
    throw new Error('useModulo debe usarse dentro de ModuloProvider');
  }
  return context;
};