import { useCallback } from 'react';

/**
 * Hook para actualizar registros en una lista sin recargar desde el servidor
 * Conserva filtros, scroll y paginación automáticamente
 * 
 * @param {Array} items - Array de items actual
 * @param {Function} setItems - Función para actualizar el array
 * @returns {Object} Funciones para actualizar, agregar y eliminar registros
 */
export const useActualizarRegistroEnLista = (items, setItems) => {
  
  const actualizarRegistro = useCallback((id, nuevosDatos) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? nuevosDatos : item
      )
    );
  }, [setItems]);

  const agregarRegistro = useCallback((nuevoRegistro) => {
    setItems(prevItems => [nuevoRegistro, ...prevItems]);
  }, [setItems]);

  const eliminarRegistro = useCallback((id) => {
    setItems(prevItems =>
      prevItems.filter(item => item.id !== id)
    );
  }, [setItems]);

  return {
    actualizarRegistro,
    agregarRegistro,
    eliminarRegistro,
  };
};