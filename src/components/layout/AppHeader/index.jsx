// src/components/layout/AppHeader/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { motion } from 'framer-motion';
import { useModulo } from '../../../context/ModuloContext';
import { getMenuConfig } from './menuConfig';
import MegaMenu from './MegaMenu';
import UserAvatar from './UserAvatar';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import logotipoMegui from '../../../assets/Logotipo/Logotipo_Megui_Negativo.png';
import logoJitsi from '../../../assets/logoJitsiMeet.png';

export default function AppHeader() {
  const navigate = useNavigate();
  const { abrirModulo, volverAlDashboard } = useModulo();
  const { usuario, logout: logoutStore } = useAuthStore();

  // Configuración del menú
  const menuConfig = getMenuConfig(abrirModulo);

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

        {/* Mega Menu */}
        <MegaMenu menuConfig={menuConfig} />

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
          <Tooltip target=".jitsi-avatar-tooltip" content="Videoconferencias" position="bottom" />

          {/* User Avatar */}
          <UserAvatar usuario={usuario} />
          <Tooltip target=".user-avatar-tooltip" position="bottom" />

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