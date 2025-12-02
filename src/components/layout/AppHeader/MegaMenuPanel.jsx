// src/components/layout/AppHeader/MegaMenuPanel.jsx
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MegaMenuPanel({ menu, menuPosition, onClose }) {
  const panelRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (columnId, sectionIndex) => {
    const key = `${columnId}-${sectionIndex}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Si es dropdown simple (USUARIOS o ACCESO INSTALACIONES)
  if (menu.type === 'dropdown') {
    return (
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        onMouseLeave={onClose}
        style={{
          position: 'fixed',
          top: '64px',
          left: `${menuPosition.left}px`,
          marginTop: '0px',
          width: '280px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155',
          overflow: 'hidden',
          zIndex: 50
        }}
      >
        {menu.items.map((item, index) => (
          <motion.button
            key={index}
            onClick={() => {
              item.action();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              textAlign: 'left',
              color: '#e2e8f0',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'background-color 0.2s'
            }}
            whileHover={{ x: 4, backgroundColor: '#334155' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i className={item.icon} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '14px' }}>{item.label}</span>
          </motion.button>
        ))}
      </motion.div>
    );
  }

  // Si es megamenu (PROCESOS o MAESTROS)
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onMouseLeave={onClose}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: '64px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #334155',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        zIndex: 50,
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px' }}>
          {menu.columns.map((column, colIndex) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.05 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Título de la columna */}
              <h3 style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #334155',
                paddingBottom: '8px'
              }}>
                {column.title}
              </h3>

              {/* Secciones */}
              {column.sections.map((section, secIndex) => {
                const sectionKey = `${column.id}-${secIndex}`;
                const isExpanded = expandedSections[sectionKey];
                const isTablas = section.title === '📋 Tablas';

                return (
                  <div key={secIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {section.title && (
                      <motion.h4
                        onClick={() => isTablas && toggleSection(column.id, secIndex)}
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: isTablas ? '#60a5fa' : '#64748b',
                          marginTop: '8px',
                          marginBottom: '4px',
                          cursor: isTablas ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          userSelect: 'none'
                        }}
                        whileHover={isTablas ? { x: 2 } : {}}
                      >
                        {section.title}
                        {isTablas && (
                          <motion.i
                            className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                            style={{ fontSize: '10px' }}
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.h4>
                    )}

                    {/* Items - Solo mostrar si no es Tablas o si está expandido */}
                    {(!isTablas || isExpanded) && (
                      <AnimatePresence>
                        <motion.div
                          initial={isTablas ? { opacity: 0, height: 0 } : false}
                          animate={isTablas ? { opacity: 1, height: 'auto' } : false}
                          exit={isTablas ? { opacity: 0, height: 0 } : false}
                          transition={{ duration: 0.3 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}
                        >
                          {section.items.map((item, itemIndex) => (
                            <motion.button
                              key={itemIndex}
                              onClick={() => {
                                item.action();
                                onClose();
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                color: '#cbd5e1',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                              }}
                              initial={isTablas ? { opacity: 0, x: -10 } : false}
                              animate={isTablas ? { opacity: 1, x: 0 } : false}
                              transition={isTablas ? { delay: itemIndex * 0.03 } : {}}
                              whileHover={{ x: 4, backgroundColor: '#1e293b', color: '#ffffff' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1e293b';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#cbd5e1';
                              }}
                            >
                              <i className={item.icon} style={{ color: '#60a5fa', fontSize: '14px' }} />
                              <span style={{ fontSize: '14px' }}>{item.label}</span>
                            </motion.button>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}