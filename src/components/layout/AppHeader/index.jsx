// src/components/layout/AppHeader/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { motion } from 'framer-motion';
import { useModulo } from '../../../context/ModuloContext';
import { getMenuConfig } from './menuConfig';
import MegaMenu from './MegaMenu';
import UserAvatar from './UserAvatar';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import logotipoMegui from '../../../assets/Logotipo/Logotipo_Megui_Negativo.png';

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
          {/* Avatar */}
          <UserAvatar usuario={usuario} />

          {/* Logout Button */}
          <Button
            icon="pi pi-sign-out"
            rounded
            text
            severity="danger"
            onClick={handleLogout}
            tooltip="Cerrar Sesión"
            tooltipOptions={{ position: 'bottom' }}
            style={{
              transition: 'background-color 0.2s'
            }}
          />
        </div>
      </div>
    </motion.header>
  );
}