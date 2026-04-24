// src/components/shared/ResumenRecorrido.jsx
// Componente GENÉRICO para mostrar resumen de recorrido con consumo y costos de combustible
// Soporta N tramos dinámicos para máxima reutilización
import React from "react";

/**
 * Componente GENÉRICO para mostrar resumen de recorrido
 * Acepta un array de tramos para máxima flexibilidad
 *
 * @param {Object} props
 * 
 * // MODO LEGACY (compatibilidad con código existente)
 * @param {number} props.distanciaRetornoPuerto - Distancia tramo 1 (MN)
 * @param {number} props.consumoRetornoPuerto - Consumo tramo 1 (Galones)
 * @param {number} props.costoRetornoPuerto - Costo tramo 1 (Soles)
 * @param {number} props.distanciaDescargaFondeo - Distancia tramo 2 (MN)
 * @param {number} props.consumoDescargaFondeo - Consumo tramo 2 (Galones)
 * @param {number} props.costoDescargaFondeo - Costo tramo 2 (Soles)
 * @param {boolean} props.hayFondeo - Si existe tramo 2
 * @param {boolean} props.loadingRetornoPuerto - Loading tramo 1
 * @param {boolean} props.loadingDescargaFondeo - Loading tramo 2
 * 
 * // MODO GENÉRICO (nuevo - recomendado)
 * @param {Array} props.tramos - Array de objetos tramo:
 *   {
 *     label: string,           // Ej: "🔵 Puerto Zarpe → 🟢 Inicio Cala"
 *     distancia: number,       // Millas náuticas
 *     consumo: number,         // Galones
 *     costo: number,           // Soles
 *     loading: boolean,        // Estado de carga
 *     color: string,           // Color del borde: 'blue', 'orange', 'green', 'red'
 *     emoji: string            // Emoji inicial (opcional)
 *   }
 * 
 * @example
 * // Uso para CALA (2 tramos):
 * <ResumenRecorrido
 *   tramos={[
 *     {
 *       label: "🟣 Puerto Zarpe → 🟢 Inicio Cala",
 *       distancia: 45.32,
 *       consumo: 5.67,
 *       costo: 136.08,
 *       loading: false,
 *       color: 'blue'
 *     },
 *     {
 *       label: "🟢 Inicio Cala → 🔴 Fin Cala",
 *       distancia: 12.50,
 *       consumo: 1.56,
 *       costo: 37.44,
 *       loading: false,
 *       color: 'green'
 *     }
 *   ]}
 * />
 * 
 * @example
 * // Uso para DESCARGA (2-3 tramos):
 * <ResumenRecorrido
 *   tramos={[
 *     {
 *       label: "🔵 Inicio Retorno → 🔴 Puerto Descarga",
 *       distancia: 8.60,
 *       consumo: 1.08,
 *       costo: 67.35,
 *       loading: false,
 *       color: 'blue'
 *     },
 *     {
 *       label: "🔴 Puerto Descarga → 🟠 Fondeo",
 *       distancia: 8.32,
 *       consumo: 1.04,
 *       costo: 63.13,
 *       loading: false,
 *       color: 'orange'
 *     }
 *   ]}
 * />
 */
export default function ResumenRecorrido({
  // Props LEGACY (compatibilidad hacia atrás)
  distanciaRetornoPuerto,
  consumoRetornoPuerto,
  costoRetornoPuerto,
  distanciaDescargaFondeo,
  consumoDescargaFondeo,
  costoDescargaFondeo,
  hayFondeo = false,
  loadingRetornoPuerto = false,
  loadingDescargaFondeo = false,
  
  // Props GENÉRICOS (nuevo)
  tramos = null,
}) {
  // ========== CONVERSIÓN LEGACY → GENÉRICO ==========
  // Si no se pasan tramos, construir desde props legacy
  const tramosFinales = tramos || [
    // Tramo 1: Siempre existe si hay datos
    (distanciaRetornoPuerto !== null || consumoRetornoPuerto !== null || costoRetornoPuerto !== null) && {
      label: "🔵 Inicio Retorno → 🔴 Puerto Descarga",
      distancia: distanciaRetornoPuerto,
      consumo: consumoRetornoPuerto,
      costo: costoRetornoPuerto,
      loading: loadingRetornoPuerto,
      color: 'blue',
    },
    // Tramo 2: Solo si hay fondeo
    hayFondeo && (distanciaDescargaFondeo !== null || consumoDescargaFondeo !== null || costoDescargaFondeo !== null) && {
      label: "🔴 Puerto Descarga → 🟠 Fondeo",
      distancia: distanciaDescargaFondeo,
      consumo: consumoDescargaFondeo,
      costo: costoDescargaFondeo,
      loading: loadingDescargaFondeo,
      color: 'orange',
    },
  ].filter(Boolean); // Eliminar nulls

  // ========== CALCULAR TOTALES ==========
  const distanciaTotal = tramosFinales.reduce((sum, t) => sum + (t.distancia || 0), 0);
  const consumoTotal = tramosFinales.reduce((sum, t) => sum + (t.consumo || 0), 0);
  const costoTotal = tramosFinales.reduce((sum, t) => sum + (t.costo || 0), 0);

  const hayDatos = tramosFinales.length > 0 && tramosFinales.some(t => 
    t.distancia !== null || t.consumo !== null || t.costo !== null
  );

  // ========== CONFIGURACIÓN DE COLORES ==========
  const getColorConfig = (color) => {
    const configs = {
      blue: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
      orange: { bg: '#fff7ed', border: '#ff9800', text: '#c2410c' },
      green: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
      red: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      purple: { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8' },
    };
    return configs[color] || configs.blue;
  };

  // ========== RENDER SIN DATOS ==========
  if (!hayDatos) {
    return (
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
            margin: "0 0 0.75rem 0",
            color: "#1f2937",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <i className="pi pi-chart-line" style={{ color: "#f59e0b" }}></i>
          ⛽ Resumen de Recorrido
        </h4>
        <div
          style={{
            textAlign: "center",
            padding: "1rem",
            color: "#6c757d",
            fontSize: "12px",
          }}
        >
          <i className="pi pi-info-circle" style={{ fontSize: "1.5rem" }}></i>
          <p style={{ marginTop: "0.5rem" }}>Capture coordenadas GPS</p>
        </div>
      </div>
    );
  }

  // ========== RENDER CON DATOS ==========
  return (
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
        <i className="pi pi-chart-line" style={{ color: "#f59e0b" }}></i>
        ⛽ Resumen de Recorrido
      </h4>

      {/* ========== RENDERIZAR CADA TRAMO ========== */}
      {tramosFinales.map((tramo, index) => {
        const colorConfig = getColorConfig(tramo.color);

        if (tramo.loading) {
          return (
            <div key={index} style={{ textAlign: "center", padding: "1rem" }}>
              <i
                className="pi pi-spin pi-spinner"
                style={{ fontSize: "1.5rem", color: colorConfig.border }}
              ></i>
              <p style={{ marginTop: "0.5rem", fontSize: "11px", color: "#6c757d" }}>
                Calculando...
              </p>
            </div>
          );
        }

        if (tramo.distancia === null && tramo.consumo === null && tramo.costo === null) {
          return null;
        }

        return (
          <div
            key={index}
            style={{
              marginBottom: "0.25rem",
              padding: "0.75rem",
              backgroundColor: colorConfig.bg,
              borderRadius: "6px",
              border: `2px solid ${colorConfig.border}`,
            }}
          >
            <div
              style={{
                fontWeight: "700",
                color: colorConfig.text,
                marginBottom: "0.25rem",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {tramo.label}
            </div>
            <div style={{ fontSize: "11px" }}>
              {tramo.distancia !== null && (
                <div
                  style={{
                    marginBottom: "0.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#6b7280" }}>
                    📏 Distancia:
                  </span>
                  <span
                    style={{ fontWeight: "bold", color: colorConfig.text, fontSize: "12px" }}
                  >
                    {tramo.distancia.toFixed(2)} MN
                  </span>
                </div>
              )}
              {tramo.consumo !== null && (
                <div
                  style={{
                    marginBottom: "0.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#6b7280" }}>
                    ⛽ Consumo:
                  </span>
                  <span style={{ fontWeight: "bold", color: colorConfig.text }}>
                    {tramo.consumo.toFixed(2)} Gal
                  </span>
                </div>
              )}
              {tramo.costo !== null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#6b7280" }}>
                    💰 Costo:
                  </span>
                  <span style={{ fontWeight: "bold", color: colorConfig.text }}>
                    S/ {tramo.costo.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ========== TOTALES ========== */}
      <div
        style={{
          marginTop: "0.5rem",
          padding: "0.75rem",
          backgroundColor: "#fef3c7",
          borderRadius: "6px",
          border: "2px solid #f59e0b",
        }}
      >
        <div
          style={{
            fontWeight: "700",
            color: "#92400e",
            marginBottom: "0.5rem",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <i className="pi pi-calculator" style={{ fontSize: "14px" }}></i>
          📊 TOTAL
        </div>
        <div style={{ fontSize: "11px" }}>
          <div
            style={{
              marginBottom: "0.25rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: "600", color: "#78350f" }}>
              📏 Distancia Total:
            </span>
            <span
              style={{ fontWeight: "bold", color: "#92400e", fontSize: "13px" }}
            >
              {distanciaTotal.toFixed(2)} MN
            </span>
          </div>
          {consumoTotal > 0 && (
            <div
              style={{
                marginBottom: "0.25rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: "600", color: "#78350f" }}>
                ⛽ Consumo Total:
              </span>
              <span style={{ fontWeight: "bold", color: "#92400e", fontSize: "13px" }}>
                {consumoTotal.toFixed(2)} Gal
              </span>
            </div>
          )}
          {costoTotal > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: "600", color: "#78350f" }}>
                💰 Costo Total:
              </span>
              <span style={{ fontWeight: "bold", color: "#92400e", fontSize: "13px" }}>
                S/ {costoTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}