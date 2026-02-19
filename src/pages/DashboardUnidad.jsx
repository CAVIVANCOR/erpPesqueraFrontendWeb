// src/pages/DashboardUnidad.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "primereact/button";
import { useDashboardStore } from "../shared/stores/useDashboardStore";
import { useModulo } from "../context/ModuloContext";
import { modulosPorUnidad } from "../config/modulosConfig";

/**
 * DashboardUnidad - Dashboard específico de una unidad de negocio
 * Muestra módulos y KPIs filtrados por la unidad seleccionada
 */
export default function DashboardUnidad() {
  const { unidadSeleccionada, limpiarUnidad } = useDashboardStore();
  const { abrirModulo } = useModulo();
  const [hoveredModule, setHoveredModule] = useState(null);

  // Si no hay unidad seleccionada, mostrar mensaje
  if (!unidadSeleccionada) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          background: "#0a0e1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "4rem", marginBottom: "16px" }}
          />
          <h2>No hay unidad seleccionada</h2>
          <p>Por favor, selecciona una unidad de negocio</p>
        </div>
      </div>
    );
  }

  // Módulos por unidad de negocio (ahora desde configuración central)
  // const modulosPorUnidad importado desde modulosConfig.js

  const datosUnidad =
    modulosPorUnidad[unidadSeleccionada.id] || modulosPorUnidad[1];

  const handleVolverSelector = () => {
    limpiarUnidad();
  };

  const handleModuloClick = (modulo) => {
    abrirModulo(modulo.id, modulo.titulo);
  };

  // Calcular total de módulos
  const totalModulos =
    (datosUnidad.procesosPrincipales?.length || 0) +
    (datosUnidad.procesosPrincipales?.reduce(
      (acc, p) => acc + (p.tablas?.length || 0),
      0,
    ) || 0);

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
        animate={{
          background: [
            `radial-gradient(circle at 20% 50%, ${unidadSeleccionada.color}15 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${unidadSeleccionada.color}10 0%, transparent 50%)`,
            `radial-gradient(circle at 80% 20%, ${unidadSeleccionada.color}15 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${unidadSeleccionada.color}10 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 50%, ${unidadSeleccionada.color}15 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${unidadSeleccionada.color}10 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
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
          backgroundImage: `linear-gradient(${unidadSeleccionada.color}08 1px, transparent 1px), linear-gradient(90deg, ${unidadSeleccionada.color}08 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          zIndex: 0,
        }}
      />

      {/* Contenido principal */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Icono de la unidad */}
            <div
              style={{
                fontSize: "3rem",
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${unidadSeleccionada.color}30, ${unidadSeleccionada.color}10)`,
                border: `1px solid ${unidadSeleccionada.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {unidadSeleccionada.icono}
            </div>

            {/* Título */}
            <div>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#ffffff",
                  marginBottom: "8px",
                  letterSpacing: "-0.02em",
                }}
              >
                {unidadSeleccionada.nombre}
              </h1>
              <p style={{ color: "#94a3b8", fontSize: "1rem" }}>
                {totalModulos} módulos disponibles
              </p>
            </div>
          </div>

          {/* Botón volver */}
          <Button
            label="Volver al Selector"
            icon="pi pi-arrow-left"
            onClick={handleVolverSelector}
            outlined
            style={{
              borderColor: unidadSeleccionada.color,
              color: unidadSeleccionada.color,
            }}
          />
        </motion.div>

        {/* GRID DE PROCESOS CON SUS TABLAS - Responsive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${datosUnidad.procesosPrincipales?.length || 6}, 1fr)`,
            gap: "16px",
          }}
          className="dashboard-unidad-grid"
        >
          <style>{`
            /* Desktop y Laptop: 6 columnas (≥1280px) */
            @media (min-width: 1280px) {
              .dashboard-unidad-grid {
                grid-template-columns: repeat(6, 1fr) !important;
                gap: 12px !important;
              }
              .dashboard-unidad-grid .proceso-card h3 {
                font-size: 0.8rem !important;
              }
              .dashboard-unidad-grid .proceso-card p {
                font-size: 0.7rem !important;
              }
              .dashboard-unidad-grid .proceso-card .badge-tablas {
                font-size: 0.65rem !important;
              }
              .dashboard-unidad-grid .tabla-item {
                font-size: 0.7rem !important;
                padding: 6px 8px !important;
              }
            }
            
            /* Tablet HD: 3 columnas (768px - 1279px) */
            @media (min-width: 768px) and (max-width: 1279px) {
              .dashboard-unidad-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
            }
          `}</style>
          {datosUnidad.procesosPrincipales &&
            datosUnidad.procesosPrincipales.map((proceso, index) => (
              <motion.div
                key={proceso.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Card del Proceso Principal */}
                <motion.div
                  className="proceso-card"
                  onMouseEnter={() => setHoveredModule(proceso.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  onClick={() => handleModuloClick(proceso)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  style={{
                    background:
                      hoveredModule === proceso.id
                        ? "rgba(15, 23, 42, 0.8)"
                        : "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${
                      hoveredModule === proceso.id
                        ? proceso.color
                        : "rgba(51, 65, 85, 0.5)"
                    }`,
                    borderRadius: "12px",
                    padding: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      hoveredModule === proceso.id
                        ? `0 12px 24px ${proceso.color}30`
                        : "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {/* Icono */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: `linear-gradient(135deg, ${proceso.color}30, ${proceso.color}10)`,
                      border: `1px solid ${proceso.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <i
                      className={`pi ${proceso.icono}`}
                      style={{ fontSize: "18px", color: proceso.color }}
                    />
                  </div>

                  {/* Título */}
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#ffffff",
                      marginBottom: "4px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {proceso.titulo}
                  </h3>

                  {/* Descripción */}
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      lineHeight: "1.3",
                      marginBottom: "6px",
                    }}
                  >
                    {proceso.descripcion}
                  </p>

                  {/* Badge de tablas */}
                  {proceso.tablas && proceso.tablas.length > 0 && (
                    <div
                      className="badge-tablas"
                      style={{
                        display: "inline-flex",
                        background: `${proceso.color}15`,
                        border: `1px solid ${proceso.color}30`,
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "0.7rem",
                        color: proceso.color,
                        fontWeight: "600",
                        alignSelf: "flex-start",
                      }}
                    >
                      {proceso.tablas.length} tablas
                    </div>
                  )}
                </motion.div>

                {/* Tablas del Proceso */}
                {proceso.tablas && proceso.tablas.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {proceso.tablas.map((tabla, tablaIndex) => (
                      <motion.button
                        key={tabla.id}
                        className="tabla-item"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.1 + 0.1 + tablaIndex * 0.03,
                        }}
                        onMouseEnter={() => setHoveredModule(tabla.id)}
                        onMouseLeave={() => setHoveredModule(null)}
                        onClick={() => handleModuloClick(tabla)}
                        whileHover={{ x: 4 }}
                        style={{
                          background:
                            hoveredModule === tabla.id
                              ? "rgba(15, 23, 42, 0.8)"
                              : "rgba(15, 23, 42, 0.4)",
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${
                            hoveredModule === tabla.id
                              ? proceso.color + "60"
                              : "rgba(51, 65, 85, 0.4)"
                          }`,
                          borderRadius: "8px",
                          padding: "8px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.2s ease",
                          textAlign: "left",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                        }}
                      >
                        <i
                          className={`pi ${tabla.icono}`}
                          style={{
                            fontSize: "12px",
                            color:
                              hoveredModule === tabla.id
                                ? proceso.color
                                : "#64748b",
                            transition: "color 0.2s ease",
                          }}
                        />
                        <span style={{ flex: 1 }}>{tabla.titulo}</span>
                        <i
                          className="pi pi-chevron-right"
                          style={{
                            fontSize: "9px",
                            color: "#64748b",
                            opacity: hoveredModule === tabla.id ? 1 : 0,
                            transition: "opacity 0.2s ease",
                          }}
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
