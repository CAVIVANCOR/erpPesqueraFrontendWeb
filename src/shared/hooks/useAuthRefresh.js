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
  console.log('[useAuthRefresh] Hook montado.');
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
    // Log detallado de diagnóstico sobre el estado de la sesión y tokens
    console.log('[useAuthRefresh] useEffect ejecutado', { isAuth, token, refreshToken, tokenExpiresAt });
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
    console.log('[useAuthRefresh] Tiempo hasta el refresh automático:', expiresInMs, 'ms');
    if (expiresInMs <= 0) {
      console.log('[useAuthRefresh] Token ya expirado o por expirar, refrescando inmediatamente');
      console.log('[useAuthRefresh] Iniciando proceso de refresco de token debido a expiración inminente');
      handleRefresh();
      return;
    }
    console.log('[useAuthRefresh] Programando refresh automático en', expiresInMs, 'ms');
    console.log('[useAuthRefresh] Programando refresco automático. Tiempo restante:', expiresInMs, 'ms');
    refreshTimeout.current = setTimeout(handleRefresh, expiresInMs);
    console.log('[useAuthRefresh] Timer de refresco programado con éxito. ID:', refreshTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshToken, tokenExpiresAt, isAuth]);

  // Función profesional para refrescar el access token
  async function handleRefresh() {
    console.log('[useAuthRefresh] Intentando refrescar el access token...');
    try {
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      if (response.data && response.data.token) {
        console.log('[useAuthRefresh] Refresh exitoso, nuevo token recibido');
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
        console.log('[useAuthRefresh] Ejecutando callback de expiración de sesión');
        onSessionExpired(); // Permite mostrar Toast u otra UX personalizada
      }
      // Espera breve para que el Toast de expiración sea visible antes de desmontar el layout
      setTimeout(() => {
        console.log('[useAuthRefresh] Navegando a /login por expiración de sesión');
        navigate('/login?expired=1', { replace: true });
      }, 800);
    }
  }
}
