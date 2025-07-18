/**
 * Store global de autenticación para el ERP Megui usando Zustand + persistencia.
 *
 * Este store centraliza el manejo de sesión de usuario, token JWT y estado de autenticación.
 * Se utiliza el middleware 'persist' para garantizar que la sesión sobreviva recargas de página,
 * manteniendo la experiencia fluida y profesional sin acceder manualmente a localStorage en los componentes.
 *
 * Ventajas:
 * - Única fuente de verdad para autenticación en toda la app.
 * - Reactividad: cualquier cambio en el estado se refleja automáticamente en todos los componentes que lo consumen.
 * - Seguridad: el logout limpia todo el estado y storage de sesión de forma atómica.
 * - Escalabilidad: permite agregar roles, expiración, refresco de token, etc. de manera sencilla.
 */

import { create } from 'zustand'; // Zustand: librería ligera para manejo de estado global en React
import { persist } from 'zustand/middleware'; // Middleware para persistir el estado automáticamente en storage

// Definición y exportación del store de autenticación
export const useAuthStore = create(
  // El middleware 'persist' serializa el estado en localStorage bajo la clave 'auth-storage'.
  persist(
    (set) => ({
      /**
       * usuario: Objeto completo del usuario autenticado (incluyendo foto, roles, etc.).
       * token: JWT de autenticación recibido tras login.
       * isAuth: Booleano que indica si hay sesión activa.
       */
      usuario: null,
      token: null,
      isAuth: false,

      /**
       * login: Método para guardar usuario, tokens y expiración en el store y marcar la sesión como activa.
       * Guarda el refreshToken y calcula correctamente la expiración del access token (tokenExpiresAt) a partir del JWT.
       * Esto permite que el refresco automático de sesión funcione correctamente en toda la app.
       * @param {Object} usuario - Objeto usuario retornado por el backend.
       * @param {string} token - JWT de autenticación.
       * @param {string} refreshToken - Refresh token seguro para renovar sesión.
       */
      login: (usuario, token, refreshToken) => {
        // Log de diagnóstico: mostrando los valores recibidos y calculados
        console.log('[useAuthStore] Ejecutando login. Valores recibidos:', { usuario, token, refreshToken });
        // Decodifica el JWT para extraer la fecha de expiración (campo exp, en segundos UTC)
        let tokenExpiresAt = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp) {
            tokenExpiresAt = new Date(payload.exp * 1000).toISOString();
          }
        } catch (e) {
          tokenExpiresAt = null;
        }
        set({ usuario, token, refreshToken, tokenExpiresAt, isAuth: true });
        // Log de diagnóstico: mostrando el nuevo estado tras login
        console.log('[useAuthStore] Estado tras login:', { usuario, token, refreshToken, tokenExpiresAt, isAuth: true });
      },

      /**
       * logout: Método para limpiar usuario, tokens y expiración del store.
       * Borra también el storage persistido automáticamente.
       */
      logout: () => {
        // Log de diagnóstico: limpieza de estado y storage
        console.log('[useAuthStore] Ejecutando logout. Limpiando estado y storage de sesión.');
        set({ usuario: null, token: null, refreshToken: null, tokenExpiresAt: null, isAuth: false });
      },
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage (o sessionStorage)
      // partialize: Define qué partes del estado se persisten (evita guardar funciones u otros estados innecesarios)
      // Se persisten refreshToken y tokenExpiresAt para garantizar el refresco automático de sesión tras recarga o reinicio de la app.
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuth: state.isAuth
      }),
    }
  )
);
