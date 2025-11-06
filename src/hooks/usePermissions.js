import { useMemo } from 'react';
import { useAuthStore } from '../shared/stores/useAuthStore';

/**
 * Hook personalizado para verificar permisos del usuario actual
 * Retorna un objeto con todos los permisos booleanos para un submódulo específico
 * Los superusuarios tienen todos los permisos automáticamente
 * 
 * @param {string} ruta - Ruta del submódulo (ej: 'usuarios', 'personal')
 * @returns {Object} Objeto con permisos booleanos
 * 
 * @example
 * const permisos = usePermissions('usuarios');
 * if (permisos.puedeCrear) {
 *   // Mostrar botón de crear
 * }
 */
export const usePermissions = (ruta) => {
  const usuario = useAuthStore(state => state.usuario);
  const accesos = useAuthStore(state => state.accesos);

  const permisos = useMemo(() => {
    // Si no hay usuario, sin permisos
    if (!usuario) {
      return {
        puedeVer: false,
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
        puedeAprobarDocs: false,
        puedeRechazarDocs: false,
        puedeReactivarDocs: false,
        tieneAcceso: false
      };
    }

    // Superusuarios tienen todos los permisos
    if (usuario.esSuperUsuario) {
      return {
        puedeVer: true,
        puedeCrear: true,
        puedeEditar: true,
        puedeEliminar: true,
        puedeAprobarDocs: true,
        puedeRechazarDocs: true,
        puedeReactivarDocs: true,
        tieneAcceso: true,
        esSuperUsuario: true
      };
    }

    // Buscar acceso activo del usuario a este submódulo por ruta
    const acceso = accesos?.find(a => 
      a.submodulo?.ruta === ruta && a.activo === true
    );

    if (!acceso) {
      return {
        puedeVer: false,
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
        puedeAprobarDocs: false,
        puedeRechazarDocs: false,
        puedeReactivarDocs: false,
        tieneAcceso: false
      };
    }

    return {
      puedeVer: acceso.puedeVer || false,
      puedeCrear: acceso.puedeCrear || false,
      puedeEditar: acceso.puedeEditar || false,
      puedeEliminar: acceso.puedeEliminar || false,
      puedeAprobarDocs: acceso.puedeAprobarDocs || false,
      puedeRechazarDocs: acceso.puedeRechazarDocs || false,
      puedeReactivarDocs: acceso.puedeReactivarDocs || false,
      tieneAcceso: true,
      accesoId: acceso.id
    };
  }, [usuario, accesos, ruta]);

  return permisos;
};