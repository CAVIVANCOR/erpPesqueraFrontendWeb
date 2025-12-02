// src/components/layout/AppHeader/MegaMenuItem.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MegaMenuItem({ menu, isActive, onMouseEnter }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter();
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '600',
        color: isActive ? '#5DADE2' : isHovered ? '#ffffff' : '#cbd5e1',
        background: 'transparent',
        border: isActive ? '2px solid transparent' : '2px solid transparent',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backgroundImage: isActive 
          ? 'linear-gradient(#0f172a, #0f172a), linear-gradient(135deg, #5DADE2, #1E8449, #2874A6)'
          : 'none',
        backgroundOrigin: 'border-box',
        backgroundClip: isActive ? 'padding-box, border-box' : 'padding-box'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {menu.label}
      
      {/* Glow effect */}
      {isActive && (
        <motion.div
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #5DADE2, #1E8449, #2874A6)',
            opacity: 0.2,
            filter: 'blur(8px)',
            zIndex: -1
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.button>
  );
}