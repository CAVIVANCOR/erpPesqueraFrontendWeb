import { usePermissions } from '../../hooks/usePermissions';

/**
 * Componente wrapper para mostrar/ocultar elementos según permisos
 * Útil para botones, acciones y elementos UI condicionales
 * 
 * @param {Object} props
 * @param {string} props.ruta - Ruta del submódulo
 * @param {string} props.permiso - Permiso requerido: 'ver', 'crear', 'editar', 'eliminar', 'aprobar', 'rechazar', 'reactivar'
 * @param {React.ReactNode} props.children - Elemento a renderizar si tiene el permiso
 * @param {React.ReactNode} props.fallback - Elemento alternativo si no tiene permiso (opcional)
 * 
 * @example
 * <PermissionGuard ruta="usuarios" permiso="crear">
 *   <Button label="Nuevo Usuario" onClick={handleAdd} />
 * </PermissionGuard>
 */
export default function PermissionGuard({ ruta, permiso, children, fallback = null }) {
  const permisos = usePermissions(ruta);

  const mapaPermisos = {
    'ver': permisos.puedeVer,
    'crear': permisos.puedeCrear,
    'editar': permisos.puedeEditar,
    'eliminar': permisos.puedeEliminar,
    'aprobar': permisos.puedeAprobarDocs,
    'rechazar': permisos.puedeRechazarDocs,
    'reactivar': permisos.puedeReactivarDocs
  };

  const tienePermiso = mapaPermisos[permiso];

  if (!tienePermiso) {
    return fallback;
  }

  return children;
}