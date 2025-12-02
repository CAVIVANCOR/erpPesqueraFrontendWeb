import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BaseLayout from "./components/layout/BaseLayout";
import ProtectedRoute from "./shared/ProtectedRoute";
import Login from "./pages/Login";
import SetupSuperUser from "./pages/SetupSuperUser";
import SinAcceso from "./pages/SinAcceso";
import { useAuthStore } from "./shared/stores/useAuthStore";
import MultiCrud from "./pages/MultiCrud";
import apiBackend from "./api/axios";

export default function AppRoutes() {
  const [checking, setChecking] = useState(true);
  const [noUsers, setNoUsers] = useState(false);
  const isAuth = useAuthStore(state => state.isAuth);

  useEffect(() => {
    async function checkUsers() {
      try {
        const res = await apiBackend.get("/usuarios/count");
        setNoUsers(res.data.count === 0);
      } catch (err) {
        console.error("Error al verificar usuarios:", err);
      } finally {
        setChecking(false);
      }
    }
    checkUsers();
  }, []);

  if (checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#009FE3'
      }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', marginRight: '1rem' }} />
        Cargando...
      </div>
    );
  }

  if (noUsers) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<SetupSuperUser />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas - SOLO cuando NO está autenticado */}
        <Route path="/" element={!isAuth ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/dashboard" replace />} />
        
        {/* Ruta pública para mostrar mensaje de acceso denegado */}
        <Route path="/sin-acceso" element={
          <ProtectedRoute>
            <SinAcceso />
          </ProtectedRoute>
        } />
        
        {/* Rutas protegidas - SOLO cuando SÍ está autenticado */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <BaseLayout />
          </ProtectedRoute>
        }>
          <Route index element={<MultiCrud />} />
          <Route path="*" element={<MultiCrud />} />
        </Route>

        {/* Catch-all: redirige cualquier ruta no encontrada */}
        <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );              
}