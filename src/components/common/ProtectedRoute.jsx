import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Componente wrapper para proteger rutas que requieren permisos específicos
 * Redirige a /sin-acceso si el usuario no tiene acceso al módulo
 * 
 * @param {Object} props
 * @param {string} props.ruta - Ruta del submódulo requerido
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si tiene acceso
 * 
 * @example
 * <Route path="/usuarios" element={
 *   <ProtectedRoute ruta="usuarios">
 *     <Usuarios />
 *   </ProtectedRoute>
 * } />
 */
export default function ProtectedRoute({ ruta, children }) {
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return children;
}