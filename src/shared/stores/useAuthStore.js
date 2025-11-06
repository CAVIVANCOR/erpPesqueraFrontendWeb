import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Store de autenticación con Zustand y persistencia en localStorage.
 * Maneja usuario, tokens JWT, refresh token, expiración y accesos del usuario.
 * 
 * Características:
 * - Persistencia automática en localStorage bajo la clave 'auth-storage'
 * - Manejo de tokens JWT con expiración
 * - Refresh token para renovación de sesión
 * - Accesos del usuario para control de permisos
 * - Métodos para login, logout y actualización de accesos
 */

// Definición y exportación del store de autenticación
export const useAuthStore = create(
  // El middleware 'persist' serializa el estado en localStorage bajo la clave 'auth-storage'.
  persist(
    (set) => ({
      /**
       * usuario: Objeto completo del usuario autenticado (incluyendo foto, roles, etc.).
       * token: JWT de autenticación recibido tras login.
       * refreshToken: Token para renovar la sesión.
       * tokenExpiresAt: Fecha de expiración del token en formato ISO.
       * isAuth: Booleano que indica si hay sesión activa.
       * accesos: Array de accesos del usuario con permisos por submódulo.
       */
      usuario: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuth: false,
      accesos: [], // NUEVO: Array de accesos del usuario

      /**
       * login: Método para guardar usuario, tokens, expiración y accesos en el store.
       * Marca la sesión como activa.
       * Guarda el refreshToken y calcula correctamente la expiración del access token (tokenExpiresAt) a partir del JWT.
       * Esto permite que el refresco automático de sesión funcione correctamente en toda la app.
       * 
       * @param {Object} usuario - Objeto usuario retornado por el backend.
       * @param {string} token - JWT de autenticación.
       * @param {string} refreshToken - Refresh token seguro para renovar sesión.
       * @param {Array} accesos - Array de accesos del usuario (opcional, se puede cargar después).
       */
      login: (usuario, token, refreshToken, accesos = []) => {
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
        set({ 
          usuario, 
          token, 
          refreshToken, 
          tokenExpiresAt, 
          accesos,
          isAuth: true 
        });
      },

      /**
       * setAccesos: Método para actualizar solo los accesos del usuario.
       * Útil cuando se cargan los accesos después del login.
       * 
       * @param {Array} accesos - Array de accesos del usuario.
       */
      setAccesos: (accesos) => {
        set({ accesos });
      },

      /**
       * updateToken: Método para actualizar el token y su expiración.
       * Útil para el refresh automático de tokens.
       * 
       * @param {string} token - Nuevo JWT de autenticación.
       */
      updateToken: (token) => {
        let tokenExpiresAt = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp) {
            tokenExpiresAt = new Date(payload.exp * 1000).toISOString();
          }
        } catch (e) {
          tokenExpiresAt = null;
        }
        set({ token, tokenExpiresAt });
      },

      /**
       * logout: Método para limpiar usuario, tokens, expiración y accesos del store.
       * Borra también el storage persistido automáticamente.
       */
      logout: () => {
        set({ 
          usuario: null, 
          token: null, 
          refreshToken: null, 
          tokenExpiresAt: null, 
          accesos: [],
          isAuth: false 
        });
      },
    }),
    {
      name: "auth-storage", // Clave en localStorage
      // Opcional: puedes agregar partialize para controlar qué se persiste
      // partialize: (state) => ({ usuario: state.usuario, token: state.token, accesos: state.accesos }),
    }
  )
);