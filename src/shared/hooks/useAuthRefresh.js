/**
 * Hook profesional para refresco automático de sesión en el ERP Megui.
 *
 * - Detecta cuándo el access token está por expirar y lo renueva usando el refresh token.
 * - Si el refresh falla (token revocado o expirado), cierra sesión y redirige a login.
 * - Integra con Zustand y la API backend.
 * - Documentado en español técnico y profesional.
 *
 * Debe usarse en el layout principal o en un contexto global cuando el usuario esté autenticado.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Hook profesional para refresco automático de sesión en el ERP Megui.
 *
 * - Detecta cuándo el access token está por expirar y lo renueva usando el refresh token.
 * - Si el refresh falla (token revocado o expirado), cierra sesión, redirige a login y dispara un callback para mostrar Toast.
 * - Integra con Zustand y la API backend.
 * - Documentado en español técnico y profesional.
 *
 * @param {Function} [onSessionExpired] - Callback opcional para mostrar Toast o UX personalizada al expirar sesión.
 */
export function useAuthRefresh(onSessionExpired) {
  const { token, refreshToken, tokenExpiresAt, isAuth, login, logout, usuario } = useAuthStore();
  const navigate = useNavigate();
  const refreshTimeout = useRef(null);

  useEffect(() => {
    // Limpia cualquier timer anterior al desmontar o cambiar sesión
    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [token, refreshToken]);

  useEffect(() => {
    // Si no hay sesión activa o falta info, no hacer nada
    if (!isAuth || !token || !refreshToken || !tokenExpiresAt) {
      console.warn('[useAuthRefresh] Condición de salida: Faltan datos clave para refresco o usuario no autenticado.', {
        isAuth,
        token,
        refreshToken,
        tokenExpiresAt
      });
      return;
    }

    // Refresco automático: programa el intento de renovar el access token justo antes de expirar.
    // Si el refresh falla (por expiración o revocación), se dispara el flujo de cierre de sesión y notificación.
    const expiresInMs = new Date(tokenExpiresAt).getTime() - Date.now() - 60_000;
    if (expiresInMs <= 0) {
      handleRefresh();
      return;
    }
    refreshTimeout.current = setTimeout(handleRefresh, expiresInMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshToken, tokenExpiresAt, isAuth]);

  // Función profesional para refrescar el access token
  async function handleRefresh() {
    try {
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      if (response.data && response.data.token) {
        // Reutiliza el usuario actual y refresca solo el token y expiración
        login(usuario, response.data.token, refreshToken);
      } else {
        console.warn('[useAuthRefresh] Respuesta inválida del backend al refrescar');
        throw new Error('Respuesta inválida del backend');
      }
    } catch (error) {
      console.error('[useAuthRefresh] Error al refrescar token:', error);
      // Si falla el refresh, cerrar sesión y redirigir a login
      logout();
      if (typeof onSessionExpired === 'function') {
        onSessionExpired(); // Permite mostrar Toast u otra UX personalizada
      }
      // Espera breve para que el Toast de expiración sea visible antes de desmontar el layout
      setTimeout(() => {
        navigate('/login?expired=1', { replace: true });
      }, 800);
    }
  }
}
