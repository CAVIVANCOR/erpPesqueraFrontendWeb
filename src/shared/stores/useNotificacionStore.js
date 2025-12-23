import { create } from "zustand";
import { 
  getNotificaciones, 
  contarNoLeidas, 
  marcarComoLeida, 
  marcarTodasComoLeidas, 
  eliminarNotificacion 
} from "../../api/notificacion";

/**
 * Store de notificaciones con Zustand.
 * Maneja el estado de notificaciones in-app del usuario.
 * 
 * Características:
 * - Carga de notificaciones con filtros
 * - Contador de notificaciones no leídas
 * - Marcar como leída (individual y todas)
 * - Eliminar notificaciones
 * - Polling automático para actualizar notificaciones
 */

export const useNotificacionStore = create((set, get) => ({
  notificaciones: [],
  noLeidas: 0,
  loading: false,
  error: null,
  pollingInterval: null,

  /**
   * Carga las notificaciones del usuario
   * @param {Object} filtros - Filtros opcionales { leida, tipo, limit, offset }
   */
  cargarNotificaciones: async (filtros = {}) => {
    set({ loading: true, error: null });
    try {
      const notificaciones = await getNotificaciones(filtros);
      set({ notificaciones, loading: false });
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      set({ 
        error: error.message || "Error al cargar notificaciones", 
        loading: false 
      });
    }
  },

  /**
   * Actualiza el contador de notificaciones no leídas
   */
  actualizarContadorNoLeidas: async () => {
    try {
      const count = await contarNoLeidas();
      set({ noLeidas: count });
    } catch (error) {
      console.error("Error al contar notificaciones no leídas:", error);
    }
  },

  /**
   * Marca una notificación como leída
   * @param {string|number} id - ID de la notificación
   */
  marcarLeida: async (id) => {
    try {
      await marcarComoLeida(id);
      
      // Actualizar el estado local
      const { notificaciones } = get();
      const notificacionesActualizadas = notificaciones.map(n => 
        n.id === id ? { ...n, leida: true, fechaLeida: new Date().toISOString() } : n
      );
      
      set({ notificaciones: notificacionesActualizadas });
      
      // Actualizar contador
      get().actualizarContadorNoLeidas();
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      throw error;
    }
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasLeidas: async () => {
    try {
      await marcarTodasComoLeidas();
      
      // Actualizar el estado local
      const { notificaciones } = get();
      const notificacionesActualizadas = notificaciones.map(n => ({
        ...n,
        leida: true,
        fechaLeida: new Date().toISOString()
      }));
      
      set({ notificaciones: notificacionesActualizadas, noLeidas: 0 });
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
      throw error;
    }
  },

  /**
   * Elimina una notificación
   * @param {string|number} id - ID de la notificación
   */
  eliminar: async (id) => {
    try {
      await eliminarNotificacion(id);
      
      // Actualizar el estado local
      const { notificaciones } = get();
      const notificacionesActualizadas = notificaciones.filter(n => n.id !== id);
      
      set({ notificaciones: notificacionesActualizadas });
      
      // Actualizar contador
      get().actualizarContadorNoLeidas();
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      throw error;
    }
  },

  /**
   * Inicia el polling automático de notificaciones
   * @param {number} intervalo - Intervalo en milisegundos (default: 30000 = 30 segundos)
   */
  iniciarPolling: (intervalo = 30000) => {
    const { pollingInterval } = get();
    
    // Si ya hay un polling activo, no crear otro
    if (pollingInterval) return;
    
    // Cargar inmediatamente
    get().actualizarContadorNoLeidas();
    
    // Configurar polling
    const interval = setInterval(() => {
      get().actualizarContadorNoLeidas();
    }, intervalo);
    
    set({ pollingInterval: interval });
  },

  /**
   * Detiene el polling automático
   */
  detenerPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  /**
   * Limpia el estado de notificaciones (útil al hacer logout)
   */
  limpiar: () => {
    get().detenerPolling();
    set({
      notificaciones: [],
      noLeidas: 0,
      loading: false,
      error: null,
      pollingInterval: null,
    });
  },
}));
