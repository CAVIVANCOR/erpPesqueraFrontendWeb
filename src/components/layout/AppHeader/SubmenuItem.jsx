// src/components/layout/AppHeader/SubmenuItem.jsx
import { motion } from 'framer-motion';

export default function SubmenuItem({ icon, label, onClick }) {
  return (
    <motion.button
      className="submenu-item"
      onClick={onClick}
      whileHover={{ x: 5, backgroundColor: 'rgba(0, 159, 227, 0.15)' }}
      whileTap={{ scale: 0.98 }}
    >
      <i className={icon} style={{ marginRight: '0.75rem', fontSize: '1rem' }} />
      <span>{label}</span>
    </motion.button>
  );
}