// src/components/layout/AppHeader/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { motion } from 'framer-motion';
import { useModulo } from '../../../context/ModuloContext';
import { useDashboardStore } from '../../../shared/stores/useDashboardStore';
import UserAvatar from './UserAvatar';
import NotificationBell from './NotificationBell';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import logotipoMegui from '../../../assets/Logotipo/Logotipo_Megui_Negativo.png';
import logoJitsi from '../../../assets/logoJitsiMeet.png';

export default function AppHeader() {
  const navigate = useNavigate();
  const { abrirModulo, volverAlDashboard } = useModulo();
  const { usuario, logout: logoutStore } = useAuthStore();

  // Store de dashboard
  const { vistaActual, cambiarAModular, cambiarAUnidades, searchQuery, setSearchQuery } = useDashboardStore();

  // Manejar logout
  const handleLogout = () => {
    logoutStore();
    navigate('/login');
  };

  // Manejar click en logo - volver al dashboard
  const handleLogoClick = () => {
    volverAlDashboard();
  };

  // Manejar click en avatar de Jitsi - abrir videoconferencias
  const handleJitsiClick = () => {
    abrirModulo("videoconferencia", "Videoconferencias");
  };
  // Manejar cambio a dashboard modular
  const handleDashboardModular = () => {
    cambiarAModular();
    volverAlDashboard();
  };

  // Manejar cambio a dashboard por unidades
  const handleDashboardUnidades = () => {
    cambiarAUnidades();
    volverAlDashboard();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '64px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
      }}
    >
      <div style={{
        height: '100%',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo - Clickeable para volver al dashboard */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={handleLogoClick}
        >
          <img 
            src={logotipoMegui} 
            alt="ERP Megui" 
            style={{ 
              height: '40px',
              objectFit: 'contain'
            }} 
          />
        </motion.div>

         {/* Botones de Dashboard y Búsqueda */}
        <div style={{ 
          display: 'flex', 
          gap: '16px',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: '900px'
        }}>
          <Button
            label="Dashboard Modular"
            icon="pi pi-th-large"
            onClick={handleDashboardModular}
            severity={vistaActual === 'modular' ? 'info' : 'secondary'}
            outlined={vistaActual !== 'modular'}
            style={{
              fontWeight: vistaActual === 'modular' ? 'bold' : 'normal',
              minWidth: '180px'
            }}
          />
          <Button
            label="Dashboard Unidades"
            icon="pi pi-building"
            onClick={handleDashboardUnidades}
            severity={vistaActual === 'unidades' ? 'info' : 'secondary'}
            outlined={vistaActual !== 'unidades'}
            style={{
              fontWeight: vistaActual === 'unidades' ? 'bold' : 'normal',
              minWidth: '180px'
            }}
          />
          
          {/* Campo de Búsqueda - Visible en ambas vistas */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <i
                className="pi pi-search"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '14px',
                  zIndex: 2,
                }}
              />
              <input
                type="text"
                placeholder="Buscar módulos, procesos o funcionalidades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 36px 8px 36px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(93, 173, 226, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(93, 173, 226, 0.6)';
                  e.target.style.background = 'rgba(15, 23, 42, 0.8)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(93, 173, 226, 0.3)';
                  e.target.style.background = 'rgba(15, 23, 42, 0.6)';
                }}
              />
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(93, 173, 226, 0.2)',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#5DADE2',
                    zIndex: 2,
                  }}
                >
                  <i className="pi pi-times" style={{ fontSize: '12px' }} />
                </motion.button>
              )}
            </div>
        </div>

        {/* User Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Jitsi Avatar - Videoconferencias */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleJitsiClick}
            className="jitsi-avatar-tooltip"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '2px solid rgba(99, 102, 241, 0.5)',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <img 
              src={logoJitsi} 
              alt="Jitsi Meet" 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }} 
            />
          </motion.div>
          <Tooltip mouseTrack target=".jitsi-avatar-tooltip" content="Videoconferencias" position="bottom" />

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Avatar */}
          <UserAvatar usuario={usuario} />
          <Tooltip mouseTrack target=".user-avatar-tooltip" position="bottom" />

          {/* Logout Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Button
              icon="pi pi-sign-out"
              rounded
              text
              severity="danger"
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              tooltipOptions={{ position: 'bottom' }}
              style={{
                width: '100%',
                height: '100%',
                transition: 'background-color 0.2s'
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}