// src/shared/hooks/useNavigateWithReturn.js
import { useEffect } from 'react';
import { useModulo } from '../../context/ModuloContext';

/**
 * Hook reutilizable para navegar a otro módulo y volver automáticamente
 * Guarda el contexto de retorno en sessionStorage para persistir entre navegaciones
 * 
 * @returns {Object} Funciones para navegar y detectar retorno
 */
export const useNavigateWithReturn = () => {
  const { abrirModulo } = useModulo();

  /**
   * Navega a un módulo guardando el contexto de retorno
   * @param {string} targetModule - Módulo destino (ej: 'entidadComercial')
   * @param {string} targetLabel - Label del módulo destino
   * @param {string} returnModule - Módulo de retorno (ej: 'requerimientoCompra')
   * @param {string} reloadAction - Acción a ejecutar al volver (ej: 'reloadProveedores')
   * @param {any} contextData - Datos adicionales del contexto (opcional)
   */
  const navigateToModule = (targetModule, targetLabel, returnModule, reloadAction, contextData = null) => {
    // Guardar contexto de retorno en sessionStorage
    const returnContext = {
      returnModule,
      reloadAction,
      contextData,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('navigationReturnContext', JSON.stringify(returnContext));
    
    // Navegar al módulo destino
    abrirModulo(targetModule, targetLabel);
  };

  /**
   * Detecta si hay un retorno pendiente y ejecuta la acción correspondiente
   * @param {string} currentModule - Módulo actual
   * @param {Function} onReturn - Callback a ejecutar cuando se detecta retorno
   * @returns {Object|null} Contexto de retorno si existe
   */
  const detectReturn = (currentModule, onReturn) => {
    useEffect(() => {
      const returnContextStr = sessionStorage.getItem('navigationReturnContext');
      
      if (returnContextStr) {
        try {
          const returnContext = JSON.parse(returnContextStr);
          
          // Verificar si el retorno es para este módulo
          if (returnContext.returnModule === currentModule) {
            // Limpiar el contexto de retorno
            sessionStorage.removeItem('navigationReturnContext');
            
            // Ejecutar callback de retorno
            if (onReturn && typeof onReturn === 'function') {
              onReturn(returnContext);
            }
          }
        } catch (err) {
          console.error('Error al procesar contexto de retorno:', err);
          sessionStorage.removeItem('navigationReturnContext');
        }
      }
    }, [currentModule, onReturn]);
  };

  /**
   * Marca que se completó una acción en el módulo actual
   * Esto permite que el módulo de origen detecte que debe recargar
   * @param {string} action - Acción completada (ej: 'proveedorCreado')
   * @param {any} data - Datos de la acción completada
   */
  const markActionCompleted = (action, data = null) => {
    const returnContextStr = sessionStorage.getItem('navigationReturnContext');
    
    if (returnContextStr) {
      try {
        const returnContext = JSON.parse(returnContextStr);
        returnContext.actionCompleted = action;
        returnContext.actionData = data;
        sessionStorage.setItem('navigationReturnContext', JSON.stringify(returnContext));
      } catch (err) {
        console.error('Error al marcar acción completada:', err);
      }
    }
  };

  return {
    navigateToModule,
    detectReturn,
    markActionCompleted
  };
};