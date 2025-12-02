// src/components/layout/AppHeader/DesktopMenu.jsx
import { motion, AnimatePresence } from 'framer-motion';
import NavLink from './NavLink';
import SubmenuItem from './SubmenuItem';

export default function DesktopMenu({ menuItems, activeMenu, setActiveMenu, handleItemClick }) {
  return (
    <div className="nav-links-container">
      {menuItems.map((menu, index) => (
        <div 
          key={index} 
          className="nav-item"
          onMouseEnter={() => setActiveMenu(index)}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <NavLink
            text={menu.text}
            hasSubmenu={menu.items && menu.items.length > 0}
            isActive={activeMenu === index}
          />
          
          {/* Submenu */}
          <AnimatePresence>
            {activeMenu === index && menu.items && (
              <motion.div
                className="submenu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {menu.items.map((item, itemIndex) => (
                  <SubmenuItem
                    key={itemIndex}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => handleItemClick(item.action)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}