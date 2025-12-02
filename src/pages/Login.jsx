import React, { useState, useRef, useEffect } from "react";
import { Toast } from 'primereact/toast';
import { Navigate } from 'react-router-dom';
import apiBackend from "../api/axios";
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getAccesosPorUsuario } from '../api/accesosUsuario';
import LandingInitial from '../components/landing/LandingInitial';
import LoginDialog from '../components/landing/LoginDialog';

export default function Login() {
  const expired = window.location.search.includes('expired=1');
  const toast = useRef(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [redirectToDashboard, setRedirectToDashboard] = useState(false);
  const loginStore = useAuthStore(state => state.login);

  useEffect(() => {
    if (expired && toast.current) {
      toast.current.show({
        severity: 'warn',
        summary: 'Sesión finalizada',
        detail: 'Tu sesión ha expirado o fue cerrada automáticamente. Por favor, inicia sesión nuevamente.',
        life: 5000
      });
      setShowLoginDialog(true);
    }
  }, [expired]);

  const handleLoginSubmit = async (credentials) => {
    try {
      const response = await apiBackend.post("/auth/login", { 
        username: credentials.username, 
        password: credentials.password 
      });
      const { token, refreshToken, usuario: usuarioData } = response.data;

      const accesos = await getAccesosPorUsuario(usuarioData.id, token);
      loginStore(usuarioData, token, refreshToken, accesos);

      if (toast.current) {
        toast.current.show({
          severity: 'success',
          summary: 'Bienvenido',
          detail: `Sesión iniciada correctamente. ¡Hola, ${usuarioData.username}!`,
          life: 1500
        });
      }

      setShowLoginDialog(false);
      setRedirectToDashboard(true);

    } catch (err) {
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Error de autenticación',
          detail: err.response?.data?.message || 'Usuario o contraseña incorrectos',
          life: 5000
        });
      }
    }
  };

  const handleClickAnimation = () => {
    setShowLoginDialog(true);
  };

  if (redirectToDashboard) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Toast ref={toast} position="top-center" />
      <LandingInitial onClickAnimation={handleClickAnimation} />
      <LoginDialog
        visible={showLoginDialog}
        onHide={() => setShowLoginDialog(false)}
        onLogin={handleLoginSubmit}
      />
    </>
  );
}