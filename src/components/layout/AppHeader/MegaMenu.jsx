// src/components/layout/AppHeader/MegaMenu.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MegaMenuItem from './MegaMenuItem';
import MegaMenuPanel from './MegaMenuPanel';

export default function MegaMenu({ menuConfig }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRefs = {
    accesoInstalaciones: useRef(null),
    procesos: useRef(null),
    maestros: useRef(null),
    usuarios: useRef(null)
  };

  const handleMouseEnter = (menuId) => {
    setActiveMenu(menuId);
    
    // Calcular posición del botón activo
    const buttonElement = menuRefs[menuId]?.current;
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      setMenuPosition({
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleClose = () => {
    setActiveMenu(null);
    setMenuPosition(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* ACCESO INSTALACIONES */}
        <div ref={menuRefs.accesoInstalaciones}>
          <MegaMenuItem
            menu={menuConfig.accesoInstalaciones}
            isActive={activeMenu === 'accesoInstalaciones'}
            onMouseEnter={() => handleMouseEnter('accesoInstalaciones')}
          />
        </div>

        {/* PROCESOS */}
        <div ref={menuRefs.procesos}>
          <MegaMenuItem
            menu={menuConfig.procesos}
            isActive={activeMenu === 'procesos'}
            onMouseEnter={() => handleMouseEnter('procesos')}
          />
        </div>

        {/* MAESTROS */}
        <div ref={menuRefs.maestros}>
          <MegaMenuItem
            menu={menuConfig.maestros}
            isActive={activeMenu === 'maestros'}
            onMouseEnter={() => handleMouseEnter('maestros')}
          />
        </div>

        {/* USUARIOS */}
        <div ref={menuRefs.usuarios}>
          <MegaMenuItem
            menu={menuConfig.usuarios}
            isActive={activeMenu === 'usuarios'}
            onMouseEnter={() => handleMouseEnter('usuarios')}
          />
        </div>
      </nav>

      {/* Mega Menu Panels */}
      <AnimatePresence>
        {activeMenu && menuPosition && (
          <MegaMenuPanel
            menu={
              activeMenu === 'accesoInstalaciones'
                ? menuConfig.accesoInstalaciones
                : activeMenu === 'procesos'
                ? menuConfig.procesos
                : activeMenu === 'maestros'
                ? menuConfig.maestros
                : menuConfig.usuarios
            }
            menuPosition={menuPosition}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}