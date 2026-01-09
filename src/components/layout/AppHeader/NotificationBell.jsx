import React, { useEffect, useState, useRef } from 'react';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Dialog } from 'primereact/dialog';
import { motion } from 'framer-motion';
import { useNotificacionStore } from '../../../shared/stores/useNotificacionStore';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const [mostrarSoloNoLeidas, setMostrarSoloNoLeidas] = useState(true);
  
  const [dialogoEspera, setDialogoEspera] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    notificacionId: null
  });

  const {
    notificaciones,
    noLeidas,
    loading,
    cargarNotificaciones,
    actualizarContadorNoLeidas,
    marcarLeida,
    marcarTodasLeidas,
    eliminar,
    iniciarPolling,
    detenerPolling,
  } = useNotificacionStore();

  useEffect(() => {
    iniciarPolling(30000);
    cargarNotificaciones({ leida: false, limit: 20 });

    return () => {
      detenerPolling();
    };
  }, []);

  const handleBellClick = (e) => {
    overlayRef.current.toggle(e);
    if (!overlayRef.current.isVisible()) {
      cargarNotificaciones({ 
        leida: mostrarSoloNoLeidas ? false : undefined, 
        limit: 20 
      });
    }
  };

  const handleNotificacionClick = async (notificacion) => {
    overlayRef.current.hide();

    if (notificacion.tipo?.includes('VIDEOCONFERENCIA') && notificacion.metadata?.salaId) {
      const esModerador = notificacion.metadata?.esModerador === true || notificacion.metadata?.rol === 'MODERADOR';
      const salaId = notificacion.metadata.salaId;

      if (esModerador) {
        // Patrón simple que funciona en Videoconferencia.jsx
        const jitsiUrl = `https://meet.megui.com.pe/${salaId}`;
        window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
        
        // Marcar como leída
        if (!notificacion.leida) {
          await marcarLeida(notificacion.id);
        }

      } else {        
        // Mismo patrón simple para participantes
        const jitsiUrl = `https://meet.megui.com.pe/${salaId}`;
        window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
        
        // Marcar como leída
        if (!notificacion.leida) {
          await marcarLeida(notificacion.id);
        }
      }
    } else {
      // Para otras notificaciones, comportamiento normal
      if (!notificacion.leida) {
        await marcarLeida(notificacion.id);
      }
      
      if (notificacion.urlDestino) {
        navigate(notificacion.urlDestino);
      }
    }
  };

  const handleMarcarTodasLeidas = async () => {
    await marcarTodasLeidas();
    cargarNotificaciones({ 
      leida: mostrarSoloNoLeidas ? false : undefined, 
      limit: 20 
    });
  };

  const handleEliminar = async (e, id) => {
    e.stopPropagation();
    await eliminar(id);
  };

  const handleToggleFiltro = () => {
    const nuevoFiltro = !mostrarSoloNoLeidas;
    setMostrarSoloNoLeidas(nuevoFiltro);
    cargarNotificaciones({ 
      leida: nuevoFiltro ? false : undefined, 
      limit: 20 
    });
  };

  const handleCerrarDialogoEspera = () => {
    setDialogoEspera({
      visible: false,
      titulo: '',
      mensaje: '',
      notificacionId: null
    });
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora - fechaNotif;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    
    return fechaNotif.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const getIconoPorTipo = (tipo) => {
    const iconos = {
      VIDEOCONFERENCIA_INVITACION: 'pi-video',
      VIDEOCONFERENCIA_RECORDATORIO_24H: 'pi-clock',
      VIDEOCONFERENCIA_1H: 'pi-bell',
      VIDEOCONFERENCIA_INICIADA: 'pi-play-circle',
      VIDEOCONFERENCIA_CANCELADA: 'pi-times-circle',
      SISTEMA_GENERAL: 'pi-info-circle',
      APROBACION_PENDIENTE: 'pi-exclamation-triangle',
      DOCUMENTO_APROBADO: 'pi-check-circle',
      DOCUMENTO_RECHAZADO: 'pi-times-circle',
    };
    return iconos[tipo] || 'pi-bell';
  };

  const getColorPorTipo = (tipo) => {
    const colores = {
      VIDEOCONFERENCIA_INVITACION: '#3B82F6',
      VIDEOCONFERENCIA_RECORDATORIO_24H: '#F59E0B',
      VIDEOCONFERENCIA_1H: '#EF4444',
      VIDEOCONFERENCIA_INICIADA: '#10B981',
      VIDEOCONFERENCIA_CANCELADA: '#6B7280',
      SISTEMA_GENERAL: '#6366F1',
      APROBACION_PENDIENTE: '#F59E0B',
      DOCUMENTO_APROBADO: '#10B981',
      DOCUMENTO_RECHAZADO: '#EF4444',
    };
    return colores[tipo] || '#6366F1';
  };

  const notificacionesFiltradas = mostrarSoloNoLeidas
    ? notificaciones.filter(n => !n.leida)
    : notificaciones;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleBellClick}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <i 
          className="pi pi-bell" 
          style={{ 
            fontSize: '1.2rem', 
            color: '#fff' 
          }} 
        />
        {noLeidas > 0 && (
          <Badge 
            value={noLeidas > 99 ? '99+' : noLeidas} 
            severity="danger"
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '20px',
              height: '20px',
              fontSize: '0.7rem',
            }}
          />
        )}
      </motion.div>

      <OverlayPanel 
        ref={overlayRef} 
        dismissable 
        className="notification-overlay"
        style={{ width: '400px', maxWidth: '90vw' }}
      >
        <div className="notification-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            Notificaciones
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              icon={mostrarSoloNoLeidas ? 'pi-eye' : 'pi-eye-slash'}
              rounded
              text
              size="small"
              onClick={handleToggleFiltro}
              tooltip={mostrarSoloNoLeidas ? 'Mostrar todas' : 'Solo no leídas'}
              tooltipOptions={{ position: 'bottom' }}
            />
            {noLeidas > 0 && (
              <Button
                icon="pi-check-square"
                rounded
                text
                size="small"
                onClick={handleMarcarTodasLeidas}
                tooltip="Marcar todas como leídas"
                tooltipOptions={{ position: 'bottom' }}
              />
            )}
          </div>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <ScrollPanel style={{ width: '100%', height: '400px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
            </div>
          ) : notificacionesFiltradas.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#6B7280'
            }}>
              <i className="pi pi-inbox" style={{ fontSize: '3rem', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>
                {mostrarSoloNoLeidas ? 'No tienes notificaciones nuevas' : 'No hay notificaciones'}
              </p>
            </div>
          ) : (
            <div className="notification-list">
              {notificacionesFiltradas.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                  onClick={() => handleNotificacionClick(notif)}
                >
                  <div 
                    className="notification-icon"
                    style={{ backgroundColor: getColorPorTipo(notif.tipo) }}
                  >
                    <i className={`pi ${getIconoPorTipo(notif.tipo)}`} />
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">{notif.titulo}</div>
                    <div className="notification-message">{notif.mensaje}</div>
                    <div className="notification-time">
                      {formatearFecha(notif.fechaCreacion)}
                    </div>
                  </div>

                  <Button
                    icon="pi pi-times"
                    rounded
                    text
                    size="small"
                    severity="secondary"
                    className="notification-delete"
                    onClick={(e) => handleEliminar(e, notif.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollPanel>
      </OverlayPanel>

      <Dialog
        visible={dialogoEspera.visible}
        onHide={handleCerrarDialogoEspera}
        header="Reunión no iniciada"
        modal
        style={{ width: '450px' }}
        footer={
          <div>
            <Button
              label="Entendido"
              icon="pi pi-check"
              onClick={handleCerrarDialogoEspera}
              className="p-button-primary"
            />
          </div>
        }
      >
        <div style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <i 
              className="pi pi-clock" 
              style={{ 
                fontSize: '3rem', 
                color: '#F59E0B' 
              }} 
            />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{dialogoEspera.titulo}</h4>
              <p style={{ margin: 0, color: '#6B7280' }}>
                {dialogoEspera.mensaje}
              </p>
            </div>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#FEF3C7', 
            borderRadius: '6px',
            border: '1px solid #FCD34D'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400E' }}>
              <i className="pi pi-info-circle" style={{ marginRight: '0.5rem' }} />
              La notificación permanecerá activa hasta que el moderador inicie la reunión.
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
}