// src/pages/DashboardUnidades.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../shared/stores/useDashboardStore";
import { unidadesNegocio, calcularModulosPorUnidad } from "../config/modulosConfig";

/**
 * DashboardUnidades - Selector de Unidades de Negocio
 * Permite al usuario elegir una unidad de negocio para ver su dashboard específico
 */
export default function DashboardUnidades() {
  const { seleccionarUnidad } = useDashboardStore();
  const [hoveredCard, setHoveredCard] = useState(null);

  // Datos de unidades de negocio (ahora desde configuración central)
  const unidades = unidadesNegocio.map(unidad => ({
    ...unidad,
    modulos: calcularModulosPorUnidad(unidad.id)
  }));

  const handleUnidadClick = (unidad) => {
    seleccionarUnidad(unidad);
  };

  // Animación del mesh gradient
  const meshVariants = {
    animate: {
      background: [
        "radial-gradient(circle at 20% 50%, rgba(93, 173, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 132, 73, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 80% 20%, rgba(93, 173, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(40, 116, 166, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 50% 50%, rgba(30, 132, 73, 0.1) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(93, 173, 226, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 20% 50%, rgba(93, 173, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 132, 73, 0.1) 0%, transparent 50%)",
      ],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "#0a0e1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Mesh gradient animado de fondo */}
      <motion.div
        variants={meshVariants}
        animate="animate"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />

      {/* Grid pattern sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(93, 173, 226, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(93, 173, 226, 0.03) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          zIndex: 0,
        }}
      />

      {/* Contenido principal */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1800px",
          margin: "0 auto",
          marginTop:"1rem",
          padding: "60px 40px",
        }}
      >

        {/* Grid de Unidades - Responsive: Desktop (6 cols), Laptop (4 cols), Tablet HD (3 cols) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "12px",
            gridAutoRows: "minmax(180px, auto)",
          }}
          className="dashboard-unidades-grid"
        >
          <style>{`
            /* Desktop y Laptop: 6 columnas (≥1280px) */
            @media (min-width: 1280px) {
              .dashboard-unidades-grid {
                grid-template-columns: repeat(6, 1fr) !important;
                gap: 10px !important;
              }
              .dashboard-unidades-grid .unidad-content h3 {
                font-size: 0.75rem !important;
              }
              .dashboard-unidades-grid .unidad-content p {
                font-size: 0.65rem !important;
              }
              .dashboard-unidades-grid .unidad-content .modulo-count {
                font-size: 0.65rem !important;
              }
            }
            
            /* Tablet HD: 3 columnas (768px - 1279px) */
            @media (min-width: 768px) and (max-width: 1279px) {
              .dashboard-unidades-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
            }
          `}</style>
          <AnimatePresence>
            {unidades.map((unidad, index) => (
              <motion.div
                key={unidad.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(unidad.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleUnidadClick(unidad)}
                whileHover={{ y: -8, scale: 1.02 }}
                style={{
                  background:
                    hoveredCard === unidad.id
                      ? "rgba(15, 23, 42, 0.8)"
                      : "rgba(15, 23, 42, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${
                    hoveredCard === unidad.id
                      ? unidad.color
                      : "rgba(51, 65, 85, 0.5)"
                  }`,
                  borderRadius: "12px",
                  padding: "10px",
                  minHeight: "180px",
                  maxHeight: "180px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  boxShadow:
                    hoveredCard === unidad.id
                      ? `0 20px 40px ${unidad.color}40, 0 0 0 1px ${unidad.color}30`
                      : "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* Glow effect en hover */}
                <AnimatePresence>
                  {hoveredCard === unidad.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: "absolute",
                        inset: "-2px",
                        background: `radial-gradient(circle at 50% 0%, ${unidad.color}30, transparent 70%)`,
                        borderRadius: "12px",
                        zIndex: 0,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Contenido de la card */}
                <div style={{ position: "relative", zIndex: 1 }} className="unidad-content">
                  {/* Icono */}
                  <motion.div
                    animate={
                      hoveredCard === unidad.id
                        ? {
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1.1, 1],
                          }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                    style={{
                      fontSize: "2rem",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: `linear-gradient(135deg, ${unidad.color}30, ${unidad.color}10)`,
                      border: `1px solid ${unidad.color}40`,
                    }}
                  >
                    {unidad.icono}
                  </motion.div>

                  {/* Nombre */}
                  <h3
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: "#ffffff",
                      marginBottom: "3px",
                      letterSpacing: "-0.01em",
                      lineHeight: "1.2",
                    }}
                  >
                    {unidad.nombre}
                  </h3>

                  {/* Descripción */}
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      lineHeight: "1.3",
                      marginBottom: "6px",
                    }}
                  >
                    {unidad.descripcion}
                  </p>

                  {/* Contador de módulos */}
                  <div
                    className="modulo-count"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.7rem",
                      color: "#64748b",
                    }}
                  >
                    <i className="pi pi-box" style={{ fontSize: "11px" }} />
                    <span>{unidad.modulos} módulos</span>
                    <motion.i
                      className="pi pi-arrow-right"
                      style={{
                        fontSize: "11px",
                        marginLeft: "auto",
                        color: unidad.color,
                      }}
                      animate={
                        hoveredCard === unidad.id ? { x: [0, 5, 0] } : {}
                      }
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer con estadísticas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            marginTop: "60px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.9rem",
          }}
        >
          <p>
            Sistema integrado de gestión empresarial con{" "}
            <strong style={{ color: "#5DADE2" }}>6 unidades de negocio</strong>{" "}
            y más de{" "}
            <strong style={{ color: "#1E8449" }}>36 módulos especializados</strong>
          </p>
        </motion.div>
      </div>
    </div>
  );
}