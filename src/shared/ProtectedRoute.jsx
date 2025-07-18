import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";

/**
 * ProtectedRoute: Componente profesional para proteger rutas internas del ERP Megui.
 * - Si el usuario no está autenticado, redirige automáticamente a /login.
 * - Si está autenticado, renderiza el children (el módulo solicitado).
 * - Integración total con Zustand y React Router v6+.
 * - Documentado en español técnico y profesional.
 */
export default function ProtectedRoute({ children }) {
  const isAuth = useAuthStore(state => state.isAuth);
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
