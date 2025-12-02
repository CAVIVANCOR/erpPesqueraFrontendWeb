// src/pages/MultiCrud.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "../shared/hooks/useIsMobile";
import { useModulo } from '../context/ModuloContext';
import Dashboard from './Dashboard';

/**
 * MultiCrud - Componente de presentación para pestañas dinámicas
 * Incluye App Switcher estilo macOS/Windows
 */
export default function MultiCrud() {
  const isMobile = useIsMobile();
  
  // Obtener estado y funciones del contexto
  const { tabs, activeIndex, setActiveIndex, cerrarTab, volverAlDashboard } = useModulo();
  
  // Estado del App Switcher
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K o Cmd+K para abrir el switcher (más confiable que Ctrl+Tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSwitcher(true);
      }
      
      // ESC para cerrar el switcher
      if (e.key === 'Escape' && showSwitcher) {
        setShowSwitcher(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSwitcher]);

  // Manejar click en una card del switcher
  const handleSwitcherClick = (index) => {
    if (index === -1) {
      // Dashboard - NO cerrar pestañas, solo cambiar vista
      volverAlDashboard();
    } else {
      // Módulo específico
      setActiveIndex(index);
    }
    setShowSwitcher(false);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", position: "relative" }}>
      {/* Sistema de pestañas dinámicas */}
      {activeIndex === -1 ? (
        // Mostrar Dashboard cuando activeIndex es -1
        <Dashboard />
      ) : (
        // Mostrar pestañas cuando hay módulos abiertos
        <div style={{ padding: "1rem" }}>
          <TabView
            activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)}
            renderActiveOnly={false}
            scrollable
          >
            {tabs.map((tab, idx) => (
              <TabPanel
                key={tab.key}
                header={tab.label}
                closable={true}
                onClose={() => cerrarTab(idx)}
              >
                {tab.content}
              </TabPanel>
            ))}
          </TabView>
        </div>
      )}

      {/* Botón flotante para abrir App Switcher - SIEMPRE visible */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSwitcher(true)}
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #5DADE2, #2874A6)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(93, 173, 226, 0.4), 0 0 0 0 rgba(93, 173, 226, 0.7)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          color: "#fff",
          fontSize: "24px",
          animation: "pulse 2s infinite",
        }}
      >
        <i className="pi pi-th-large" />
        {tabs.length > 0 && (
          <span style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#ef4444",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #0a0e1a",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}>
            {tabs.length}
          </span>
        )}
      </motion.button>

      {/* App Switcher Overlay */}
      <AnimatePresence>
        {showSwitcher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowSwitcher(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(10px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "1200px",
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              {/* Header del Switcher */}
              <div style={{
                textAlign: "center",
                marginBottom: "32px",
                color: "#fff",
              }}>
                <h2 style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                  background: "linear-gradient(135deg, #5DADE2, #1E8449)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Cambiar de Vista
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                  Presiona <kbd style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}>ESC</kbd> para cerrar
                </p>
              </div>

              {/* Grid de opciones */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
              }}>
                {/* Dashboard Card - Siempre primero */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSwitcherClick(-1)}
                  style={{
                    background: activeIndex === -1
                      ? "linear-gradient(135deg, rgba(93, 173, 226, 0.3), rgba(30, 132, 73, 0.3))"
                      : "rgba(15, 23, 42, 0.8)",
                    border: activeIndex === -1
                      ? "2px solid #5DADE2"
                      : "1px solid rgba(51, 65, 85, 0.5)",
                    borderRadius: "16px",
                    padding: "24px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Indicador de activo */}
                  {activeIndex === -1 && (
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#1E8449",
                      boxShadow: "0 0 10px #1E8449",
                    }} />
                  )}

                  {/* Icono */}
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(93, 173, 226, 0.3), rgba(30, 132, 73, 0.3))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    border: "1px solid rgba(93, 173, 226, 0.4)",
                  }}>
                    <i className="pi pi-th-large" style={{
                      fontSize: "32px",
                      color: "#5DADE2",
                    }} />
                  </div>

                  {/* Título */}
                  <h3 style={{
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "8px",
                  }}>
                    Dashboard
                  </h3>

                  {/* Descripción */}
                  <p style={{
                    fontSize: "0.9rem",
                    color: "#94a3b8",
                    lineHeight: "1.5",
                  }}>
                    Vista principal del sistema
                  </p>
                </motion.div>

                {/* Cards de módulos abiertos */}
                {tabs.map((tab, idx) => (
                  <motion.div
                    key={tab.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSwitcherClick(idx)}
                    style={{
                      background: activeIndex === idx
                        ? "linear-gradient(135deg, rgba(40, 116, 166, 0.3), rgba(93, 173, 226, 0.3))"
                        : "rgba(15, 23, 42, 0.8)",
                      border: activeIndex === idx
                        ? "2px solid #2874A6"
                        : "1px solid rgba(51, 65, 85, 0.5)",
                      borderRadius: "16px",
                      padding: "24px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Indicador de activo */}
                    {activeIndex === idx && (
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#2874A6",
                        boxShadow: "0 0 10px #2874A6",
                      }} />
                    )}

                    {/* Botón cerrar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cerrarTab(idx);
                      }}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: activeIndex === idx ? "32px" : "12px",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.4)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      ×
                    </button>

                    {/* Icono */}
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(40, 116, 166, 0.3), rgba(93, 173, 226, 0.3))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                      border: "1px solid rgba(40, 116, 166, 0.4)",
                    }}>
                      <i className="pi pi-file" style={{
                        fontSize: "32px",
                        color: "#2874A6",
                      }} />
                    </div>

                    {/* Título */}
                    <h3 style={{
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color: "#ffffff",
                      marginBottom: "8px",
                      paddingRight: "40px",
                    }}>
                      {tab.label}
                    </h3>

                    {/* Descripción */}
                    <p style={{
                      fontSize: "0.9rem",
                      color: "#94a3b8",
                      lineHeight: "1.5",
                    }}>
                      Módulo activo
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Footer con instrucciones */}
              <div style={{
                marginTop: "32px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.85rem",
              }}>
                <p>
                  Usa <kbd style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}>Ctrl+K</kbd> para abrir este menú en cualquier momento
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estilos para la animación del botón flotante */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(93, 173, 226, 0.4), 0 0 0 0 rgba(93, 173, 226, 0.7);
          }
          50% {
            box-shadow: 0 8px 32px rgba(93, 173, 226, 0.6), 0 0 0 10px rgba(93, 173, 226, 0);
          }
        }
      `}</style>
    </div>
  );
}