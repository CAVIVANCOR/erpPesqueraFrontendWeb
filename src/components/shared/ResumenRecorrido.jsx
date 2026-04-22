// src/components/shared/ResumenRecorrido.jsx
// Componente para mostrar resumen de recorrido con consumo y costos de combustible
import React from "react";

/**
 * Componente para mostrar resumen de recorrido
 * Muestra distancia, consumo y costo de combustible para cada tramo
 *
 * @param {Object} props
 * @param {number} props.distanciaRetornoPuerto - Distancia de Inicio Retorno a Puerto Descarga (MN)
 * @param {number} props.consumoRetornoPuerto - Consumo de combustible Inicio Retorno a Puerto (Galones)
 * @param {number} props.costoRetornoPuerto - Costo de combustible Inicio Retorno a Puerto (Soles)
 * @param {number} props.distanciaDescargaFondeo - Distancia de Puerto Descarga a Fondeo (MN)
 * @param {number} props.consumoDescargaFondeo - Consumo de combustible Descarga a Fondeo (Galones)
 * @param {number} props.costoDescargaFondeo - Costo de combustible Descarga a Fondeo (Soles)
 * @param {boolean} props.hayFondeo - Si existe fondeo
 * @param {boolean} props.loadingRetornoPuerto - Estado de carga del cálculo Retorno-Puerto
 * @param {boolean} props.loadingDescargaFondeo - Estado de carga del cálculo Descarga-Fondeo
 */
export default function ResumenRecorrido({
  distanciaRetornoPuerto,
  consumoRetornoPuerto,
  costoRetornoPuerto,
  distanciaDescargaFondeo,
  consumoDescargaFondeo,
  costoDescargaFondeo,
  hayFondeo = false,
  loadingRetornoPuerto = false,
  loadingDescargaFondeo = false,
}) {
  // Calcular totales
  const distanciaTotal =
    (distanciaRetornoPuerto || 0) + (distanciaDescargaFondeo || 0);
  const consumoTotal =
    (consumoRetornoPuerto || 0) + (consumoDescargaFondeo || 0);
  const costoTotal = (costoRetornoPuerto || 0) + (costoDescargaFondeo || 0);

  const hayDatos =
    distanciaRetornoPuerto !== null ||
    consumoRetornoPuerto !== null ||
    costoRetornoPuerto !== null ||
    distanciaDescargaFondeo !== null ||
    consumoDescargaFondeo !== null ||
    costoDescargaFondeo !== null;

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

      {/* TRAMO 1: Inicio Retorno → Puerto Descarga */}
      {loadingRetornoPuerto ? (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "1.5rem", color: "#3b82f6" }}
          ></i>
          <p style={{ marginTop: "0.5rem", fontSize: "11px", color: "#6c757d" }}>
            Calculando...
          </p>
        </div>
      ) : (
        distanciaRetornoPuerto !== null && (
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
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span style={{ fontSize: "14px" }}>🔵</span>
              Inicio Retorno → 🔴 Puerto Descarga
            </div>
            <div style={{ fontSize: "11px" }}>
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
                  style={{ fontWeight: "bold", color: "#1e40af", fontSize: "12px" }}
                >
                  {distanciaRetornoPuerto.toFixed(2)} MN
                </span>
              </div>
              {consumoRetornoPuerto !== null && (
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
                  <span style={{ fontWeight: "bold", color: "#1e40af" }}>
                    {consumoRetornoPuerto.toFixed(2)} Gal
                  </span>
                </div>
              )}
              {costoRetornoPuerto !== null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#6b7280" }}>
                    💰 Costo:
                  </span>
                  <span style={{ fontWeight: "bold", color: "#1e40af" }}>
                    S/ {costoRetornoPuerto.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* TRAMO 2: Puerto Descarga → Fondeo (solo si hay fondeo) */}
      {hayFondeo &&
        (loadingDescargaFondeo ? (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "1.5rem", color: "#ff9800" }}
            ></i>
            <p style={{ marginTop: "0.5rem", fontSize: "11px", color: "#6c757d" }}>
              Calculando...
            </p>
          </div>
        ) : (
          distanciaDescargaFondeo !== null && (
            <div
              style={{
                marginBottom: "0.25rem",
                padding: "0.75rem",
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
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <span style={{ fontSize: "14px" }}>🔴</span>
                Puerto Descarga → 🟠 Fondeo
              </div>
              <div style={{ fontSize: "11px" }}>
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
                    style={{ fontWeight: "bold", color: "#c2410c", fontSize: "12px" }}
                  >
                    {distanciaDescargaFondeo.toFixed(2)} MN
                  </span>
                </div>
                {consumoDescargaFondeo !== null && (
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
                    <span style={{ fontWeight: "bold", color: "#c2410c" }}>
                      {consumoDescargaFondeo.toFixed(2)} Gal
                    </span>
                  </div>
                )}
                {costoDescargaFondeo !== null && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "#6b7280" }}>
                      💰 Costo:
                    </span>
                    <span style={{ fontWeight: "bold", color: "#c2410c" }}>
                      S/ {costoDescargaFondeo.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        ))}

      {/* TOTALES */}
      {(distanciaTotal > 0 || consumoTotal > 0 || costoTotal > 0) && (
        <div
          style={{
            padding: "0.25rem",
            backgroundColor: "#f3f4f6",
            borderRadius: "6px",
            border: "2px solid #6b7280",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#374151",
              marginBottom: "0.25rem",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            📊 TOTAL
          </div>
          <div style={{ fontSize: "11px" }}>
            {distanciaTotal > 0 && (
              <div
                style={{
                  marginBottom: "0.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "600", color: "#6b7280" }}>
                  📏 Distancia Total:
                </span>
                <span
                  style={{ fontWeight: "bold", color: "#374151", fontSize: "12px" }}
                >
                  {distanciaTotal.toFixed(2)} MN
                </span>
              </div>
            )}
            {consumoTotal > 0 && (
              <div
                style={{
                  marginBottom: "0.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "600", color: "#6b7280" }}>
                  ⛽ Consumo Total:
                </span>
                <span style={{ fontWeight: "bold", color: "#374151" }}>
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
                <span style={{ fontWeight: "600", color: "#6b7280" }}>
                  💰 Costo Total:
                </span>
                <span style={{ fontWeight: "bold", color: "#374151" }}>
                  S/ {costoTotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}