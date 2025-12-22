// src/components/layout/AppHeader/MegaMenu.jsx
import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import MegaMenuItem from './MegaMenuItem';
import MegaMenuPanel from './MegaMenuPanel';

export default function MegaMenu({ menuConfig }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRefs = useRef({});

  const handleMouseEnter = (menuId) => {
    setActiveMenu(menuId);
    
    // Calcular posición del botón activo
    const buttonElement = menuRefs.current[menuId];
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
        {/* Renderizar todos los menús dinámicamente */}
        {Object.entries(menuConfig).map(([menuId, menuData]) => (
          <div 
            key={menuId} 
            ref={(el) => menuRefs.current[menuId] = el}
          >
            <MegaMenuItem
              menu={menuData}
              isActive={activeMenu === menuId}
              onMouseEnter={() => handleMouseEnter(menuId)}
            />
          </div>
        ))}
      </nav>

      {/* Mega Menu Panels */}
      <AnimatePresence>
        {activeMenu && menuPosition && (
          <MegaMenuPanel
            menu={menuConfig[activeMenu]}
            menuPosition={menuPosition}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}