// src/components/layout/AppHeader/NavLink.jsx
import { motion } from 'framer-motion';

export default function NavLink({ text, onClick, hasSubmenu, isActive }) {
  return (
    <motion.button
      className={`nav-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {text}
      {hasSubmenu && <i className="pi pi-angle-down" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} />}
    </motion.button>
  );
}