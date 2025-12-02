// src/components/layout/AppHeader/MobileMenu.jsx
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileMenu({ 
  menuItems, 
  mobileMenuOpen, 
  activeMenu, 
  handleMenuClick, 
  handleItemClick 
}) {
  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          className="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {menuItems.map((menu, index) => (
            <div key={index} className="mobile-menu-item">
              <button
                className="mobile-menu-button-item"
                onClick={() => handleMenuClick(index)}
              >
                <i className={menu.icon} />
                <span>{menu.text}</span>
                {menu.items && (
                  <i className={`pi pi-angle-${activeMenu === index ? 'up' : 'down'}`} />
                )}
              </button>
              
              <AnimatePresence>
                {activeMenu === index && menu.items && (
                  <motion.div
                    className="mobile-submenu"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {menu.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        className="mobile-submenu-item"
                        onClick={() => handleItemClick(item.action)}
                      >
                        <i className={item.icon} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}