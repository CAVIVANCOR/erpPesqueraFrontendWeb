/**
 * Archivo de rutas principal (AppRoutes)
 *
 * Este archivo define toda la lógica de enrutamiento y protección de rutas para el ERP Megui.
 * Determina si se debe mostrar el flujo de configuración inicial (creación de superusuario) o el flujo de login normal,
 * según la existencia de usuarios en el sistema (consultando al backend).
 * Integra componentes PrimeReact y define el layout base para la aplicación autenticada.
 *
 * Decisiones clave:
 * - Si no existen usuarios, fuerza la pantalla de SetupSuperUser en cualquier ruta.
 * - Si existen usuarios, muestra el login y, tras autenticación, el layout principal.
 * - Usa estado local para controlar el flujo de inicialización y evitar flickers.
 * - Está preparado para integrar protección de rutas avanzada usando Zustand (isAuth) en futuras versiones.
 */
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BaseLayout from "./components/layout/BaseLayout";
import ProtectedRoute from "./shared/ProtectedRoute";
import Login from "./pages/Login";
import SetupSuperUser from "./pages/SetupSuperUser";
import { useAuthStore } from "./shared/stores/useAuthStore";
// Importación de todos los módulos internos del ERP
import MultiCrud from "./pages/MultiCrud"; // Sistema profesional de pestañas dinámicas
import apiBackend from "./api/axios";

/**
 * AppRoutes: Gestor principal de rutas y protección de acceso para el ERP Megui.
 *
 * - Si no existen usuarios, fuerza la pantalla de SetupSuperUser en cualquier ruta.
 * - Si existen usuarios, muestra el login y, tras autenticación, el layout principal.
 * - Usa estado local para controlar el flujo de inicialización y evitar flickers.
 * - Está preparado para integrar protección de rutas avanzada usando Zustand (isAuth) en futuras versiones.
 */
export default function AppRoutes() {
  const [checking, setChecking] = useState(true);
  const [noUsers, setNoUsers] = useState(false);
  const isAuth = useAuthStore(state => state.isAuth);

  // Efecto de inicialización: consulta al backend si existen usuarios para decidir el flujo inicial.
  useEffect(() => {
    async function checkUsers() {
      try {
        // Endpoint que retorna el conteo de usuarios existentes en el sistema.
        const res = await apiBackend.get("/usuarios/count");
        setNoUsers(res.data.count === 0);
      } catch (err) {
        setNoUsers(false); // Si hay error, asume que sí existen usuarios (flujo normal)
      }
      setChecking(false);
    }
    checkUsers();
  }, []);

  // Mientras se consulta al backend, no muestra nada para evitar parpadeos en la UI.
  if (checking) {
    return null;
  }

  // Acceso al estado global de autenticación (única fuente de verdad)
  // Si no existen usuarios, fuerza el flujo de SetupSuperUser
  if (noUsers) {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={
            <SetupSuperUser onSuccess={() => {
              // Tras crear superusuario y login automático, recarga la app para activar el flujo protegido
              window.location.reload();
            }} />
          } />
        </Routes>
      </Router>
    );
  }

  // Si existen usuarios, protege rutas usando Zustand
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuth ? <Navigate to="/" replace /> : <Login onLogin={() => window.location.href = "/"} />
        } />
        {/* Rutas protegidas para la app principal: cada módulo es una ruta hija dentro del layout */}
        {/* Todas las rutas internas ahora están protegidas por ProtectedRoute.
            Si el usuario no está autenticado, se redirige automáticamente a /login. */}
        <Route path="/*" element={
          <ProtectedRoute>
            <BaseLayout />
          </ProtectedRoute>
        }>
          {/* Sistema profesional de multitarea: todas las operaciones CRUD se gestionan en pestañas dinámicas */}
          {/* El contenido principal ahora es <MultiCrud />, que permite abrir y alternar entre módulos sin perder estado */}
          <Route index element={<MultiCrud />} />
          <Route path="*" element={<MultiCrud />} />
        </Route>
      </Routes>
    </Router>
  );              
}
