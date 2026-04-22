// src/components/shared/InformacionGeograficaMultiple.jsx
// Componente para mostrar información geográfica de múltiples puntos (SOLO COLUMNA DE UBICACIÓN)
import React from "react";

/**
 * Componente para mostrar información geográfica de múltiples puntos
 * Este componente renderiza SOLO la columna de "Ubicación Geográfica"
 * Las columnas de "Distancias" e "Información Marítima" se renderizan aparte
 *
 * @param {Object} props
 * @param {Object} props.infoInicioRetorno - Info geográfica del inicio de retorno
 * @param {Object} props.infoPlataforma - Info geográfica de la plataforma
 * @param {Object} props.infoFondeo - Info geográfica del fondeo (opcional)
 * @param {boolean} props.loadingInicioRetorno - Estado de carga inicio retorno
 * @param {boolean} props.loadingPlataforma - Estado de carga plataforma
 * @param {boolean} props.loadingFondeo - Estado de carga fondeo
 */
export default function InformacionGeograficaMultiple({
  infoInicioRetorno,
  infoPlataforma,
  infoFondeo,
  loadingInicioRetorno,
  loadingPlataforma,
  loadingFondeo,
}) {
  const renderUbicacion = (info, loading, color) => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "1.5rem", color }}
          ></i>
          <p style={{ marginTop: "0.5rem", fontSize: "11px", color: "#6c757d" }}>
            Cargando...
          </p>
        </div>
      );
    }

    if (!info) {
      return (
        <div style={{ textAlign: "center", padding: "1rem", color: "#6c757d", fontSize: "11px" }}>
          <i className="pi pi-info-circle" style={{ fontSize: "1.2rem" }}></i>
          <p style={{ marginTop: "0.5rem" }}>No disponible</p>
        </div>
      );
    }

    return (
      <div style={{ fontSize: "11px" }}>
        {info.ubicacion?.ciudad === "N/A" && info.referenciaCosta && (
          <div
            style={{
              padding: "0.5rem",
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              borderRadius: "4px",
              marginBottom: "0.5rem",
              fontSize: "10px",
            }}
          >
            <div style={{ fontWeight: "600", color: "#92400e", marginBottom: "0.25rem" }}>
              <i className="pi pi-exclamation-triangle"></i> Alta Mar
            </div>
            <div style={{ color: "#78350f" }}>
              {info.referenciaCosta.descripcion}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "0.5rem", fontSize: "11px" }}>
          <span style={{ fontWeight: "600", color: "#6b7280" }}>📍 Lugar: </span>
          <span style={{ color: "#1f2937" }}>
            {(info.ubicacion?.lugar && info.ubicacion.lugar !== "N/A"
              ? info.ubicacion.lugar
              : info.referenciaCosta?.ubicacionCosta?.lugar) || "N/A"}
          </span>
        </div>

        <div style={{ marginBottom: "0.5rem", fontSize: "11px" }}>
          <span style={{ fontWeight: "600", color: "#6b7280" }}>🏛️ Distrito: </span>
          <span style={{ color: "#1f2937" }}>
            {(info.ubicacion?.distrito && info.ubicacion.distrito !== "N/A"
              ? info.ubicacion.distrito
              : info.referenciaCosta?.ubicacionCosta?.distrito) || "N/A"}
          </span>
        </div>

        <div style={{ marginBottom: "0.5rem", fontSize: "11px" }}>
          <span style={{ fontWeight: "600", color: "#6b7280" }}>🗺️ Provincia: </span>
          <span style={{ color: "#1f2937" }}>
            {(info.ubicacion?.provincia && info.ubicacion.provincia !== "N/A"
              ? info.ubicacion.provincia
              : info.referenciaCosta?.ubicacionCosta?.provincia) || "N/A"}
          </span>
        </div>

        <div style={{ marginBottom: "0.5rem", fontSize: "11px" }}>
          <span style={{ fontWeight: "600", color: "#6b7280" }}>🏴 Departamento: </span>
          <span style={{ color: "#1f2937" }}>
            {(info.ubicacion?.departamento && info.ubicacion.departamento !== "N/A"
              ? info.ubicacion.departamento
              : info.referenciaCosta?.ubicacionCosta?.departamento) || "N/A"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* COLUMNA: UBICACIÓN GEOGRÁFICA (con 3 secciones) */}
      <div
        style={{
          flex: "1 1 200px",
          minWidth: "200px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1rem",
          backgroundColor: "#f9fafb",
          height: "500px",
          overflowY: "auto",
        }}
      >
        <h4
          style={{
            margin: "0 0 0.25rem 0",
            color: "#1f2937",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <i className="pi pi-map-marker" style={{ color: "#ef4444" }}></i>
          Ubicación Geográfica
        </h4>

        {/* 1. INICIO DE RETORNO */}
        <div
          style={{
            marginBottom: "0.25rem",
            padding: "0.75rem",
            backgroundColor: "#eff6ff",
            borderRadius: "6px",
            border: "2px solid #3b82f6",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#1e40af",
              marginBottom: "0.25rem",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔵</span>
            INICIO DE RETORNO
          </div>
          {renderUbicacion(infoInicioRetorno, loadingInicioRetorno, "#3b82f6")}
        </div>

        {/* 2. PLATAFORMA DE DESCARGA */}
        <div
          style={{
            marginBottom: "0.25rem",
            padding: "0.25rem",
            backgroundColor: "#fef2f2",
            borderRadius: "6px",
            border: "2px solid #ef4444",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#991b1b",
              marginBottom: "0.5rem",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔴</span>
            PLATAFORMA DE DESCARGA
          </div>
          {renderUbicacion(infoPlataforma, loadingPlataforma, "#ef4444")}
        </div>

        {/* 3. FONDEO (solo si existe) */}
        {infoFondeo && (
          <div
            style={{
              padding: "0.25rem",
              backgroundColor: "#fff7ed",
              borderRadius: "6px",
              border: "2px solid #ff9800",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                color: "#c2410c",
                marginBottom: "0.25rem",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span style={{ fontSize: "16px" }}>🟠</span>
              FONDEO
            </div>
            {renderUbicacion(infoFondeo, loadingFondeo, "#ff9800")}
          </div>
        )}
      </div>
    </>
  );
}