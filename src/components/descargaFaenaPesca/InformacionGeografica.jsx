// src/components/descargaFaenaPesca/InformacionGeografica.jsx
// Componente para mostrar información geográfica de coordenadas GPS
// Documentado en español

import React from "react";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";

/**
 * Componente InformacionGeografica
 *
 * Muestra información geográfica completa obtenida del análisis de coordenadas GPS
 *
 * Props:
 * - data: Objeto con información geográfica (ubicacion, distancias, informacionMaritima)
 * - loading: Boolean indicando si está cargando
 * - error: String con mensaje de error (opcional)
 */
export default function InformacionGeografica({ data, loading, error }) {
  // Si está cargando
  if (loading) {
    return (
      <Panel header="📍 Información Geográfica" className="mb-3">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          <p style={{ marginTop: "1rem", color: "#6c757d" }}>
            Analizando coordenadas...
          </p>
        </div>
      </Panel>
    );
  }

  // Si hay error
  if (error) {
    return (
      <Panel header="📍 Información Geográfica" className="mb-3">
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "2rem", color: "#f59e0b" }}
          ></i>
          <p style={{ marginTop: "0.5rem", color: "#dc2626" }}>{error}</p>
        </div>
      </Panel>
    );
  }

  // Si no hay datos
  if (!data) {
    return (
      <Panel header="📍 Información Geográfica" className="mb-3">
        <div style={{ textAlign: "center", padding: "1rem", color: "#6c757d" }}>
          <i className="pi pi-info-circle" style={{ fontSize: "2rem" }}></i>
          <p style={{ marginTop: "0.5rem" }}>
            Capture las coordenadas GPS para ver la información geográfica
          </p>
        </div>
      </Panel>
    );
  }

  // Función para obtener color del Tag según clasificación de aguas
  const getClasificacionAguasColor = (clasificacion) => {
    if (clasificacion.includes("Territoriales")) return "danger";
    if (clasificacion.includes("Económica")) return "success";
    return "info";
  };

  return (
    <Panel
      header="📍 Información Geográfica y Marítima"
      className="mb-3"
      toggleable
      collapsed={false}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* SECCIÓN 1: UBICACIÓN */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#f9fafb",
          }}
        >
          <h4
            style={{
              margin: "0 0 0.75rem 0",
              color: "#1f2937",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="pi pi-map" style={{ color: "#3b82f6" }}></i>
            Ubicación Geográfica
          </h4>

          <div style={{ fontSize: "12px" }}>
            {/* Alerta si está en alta mar y hay referencia costera */}
            {data.ubicacion?.ciudad === "N/A" && data.referenciaCosta && (
              <div
                style={{
                  backgroundColor: "#e0f2fe",
                  border: "2px solid #0ea5e9",
                  borderRadius: "6px",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    color: "#075985",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="pi pi-compass" style={{ fontSize: "14px" }}></i>
                  Ubicación en Alta Mar
                </div>
                <div style={{ color: "#0c4a6e", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>📍 Referencia costera:</strong>
                    <div style={{ marginTop: "0.25rem", paddingLeft: "1rem" }}>
                      {data.referenciaCosta.ubicacionCosta.lugar}
                      {data.referenciaCosta.ubicacionCosta.distrito &&
                        data.referenciaCosta.ubicacionCosta.distrito !==
                          "N/A" && (
                          <>, {data.referenciaCosta.ubicacionCosta.distrito}</>
                        )}
                      <br />
                      {data.referenciaCosta.ubicacionCosta.provincia},{" "}
                      {data.referenciaCosta.ubicacionCosta.departamento}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#f0f9ff",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      marginTop: "0.5rem",
                    }}
                  >
                    <div>
                      <strong>📏 Distancia:</strong>{" "}
                      {data.referenciaCosta.distanciaACosta.millasNauticas.toFixed(
                        1,
                      )}{" "}
                      MN
                    </div>
                    {data.referenciaCosta.navegacion && (
                      <div>
                        <strong>🧭 Rumbo:</strong>{" "}
                        {data.referenciaCosta.navegacion.direccion} (
                        {data.referenciaCosta.navegacion.bearing}°)
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontStyle: "italic",
                    marginTop: "0.5rem",
                    borderTop: "1px solid #bae6fd",
                    paddingTop: "0.5rem",
                  }}
                >
                  {data.referenciaCosta.mensaje ||
                    "Calculado mediante proyección perpendicular a la costa"}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Lugar:</strong>{" "}
              {data.referenciaCosta?.ubicacionCosta?.lugar
                ? `${data.referenciaCosta.ubicacionCosta.lugar} *`
                : data.ubicacion?.ciudad || "N/A"}
            </div>
            {data.referenciaCosta?.ubicacionCosta?.distrito &&
              data.referenciaCosta.ubicacionCosta.distrito !== "N/A" && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Distrito:</strong>{" "}
                  {data.referenciaCosta.ubicacionCosta.distrito} *
                </div>
              )}
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Provincia:</strong>{" "}
              {data.referenciaCosta?.ubicacionCosta?.provincia
                ? `${data.referenciaCosta.ubicacionCosta.provincia} *`
                : data.ubicacion?.provincia || "N/A"}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Departamento:</strong>{" "}
              {data.referenciaCosta?.ubicacionCosta?.departamento
                ? `${data.referenciaCosta.ubicacionCosta.departamento} *`
                : data.ubicacion?.departamento || "N/A"}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Cuerpo de Agua:</strong>{" "}
              {data.ubicacion?.cuerpoAgua || "N/A"}
            </div>

            {/* Nota explicativa si hay referencia costera */}
            {data.referenciaCosta && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#0369a1",
                  fontStyle: "italic",
                  marginTop: "0.5rem",
                  backgroundColor: "#f0f9ff",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "3px",
                  border: "1px solid #bae6fd",
                }}
              >
                <i
                  className="pi pi-info-circle"
                  style={{ fontSize: "9px", marginRight: "0.25rem" }}
                ></i>
                * Referencia calculada mediante proyección perpendicular hacia
                la costa (datos oficiales INEI)
              </div>
            )}

            <Divider style={{ margin: "0.5rem 0" }} />
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              {data.ubicacion?.direccionCompleta || "N/A"}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DISTANCIAS */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#f9fafb",
          }}
        >
          <h4
            style={{
              margin: "0 0 0.75rem 0",
              color: "#1f2937",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="pi pi-compass" style={{ color: "#10b981" }}></i>
            Distancias
          </h4>

          <div style={{ fontSize: "12px" }}>
            {/* Distancia a la costa */}
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.5rem",
                backgroundColor: "#ecfdf5",
                borderRadius: "4px",
                border: "1px solid #a7f3d0",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                  color: "#065f46",
                }}
              >
                📏 A la Costa
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {data.distancias?.aCosta?.distanciaKm?.toFixed(2) || "0.00"}{" "}
                  km
                </span>
                <span style={{ fontWeight: "bold", color: "#059669" }}>
                  {data.distancias?.aCosta?.distanciaMillasNauticas?.toFixed(
                    2,
                  ) || "0.00"}{" "}
                  MN
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                Punto más cercano:{" "}
                {data.distancias?.aCosta?.puntoCosteroMasCercano || "N/A"}
              </div>
            </div>

            {/* Puerto más cercano */}
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.5rem",
                backgroundColor: "#eff6ff",
                borderRadius: "4px",
                border: "1px solid #bfdbfe",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                  color: "#1e40af",
                }}
              >
                ⚓ Puerto Más Cercano
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                {data.distancias?.aPuertoMasCercano?.nombrePuerto || "N/A"}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                }}
              >
                <span>
                  {data.distancias?.aPuertoMasCercano?.km?.toFixed(2) || "0.00"}{" "}
                  km
                </span>
                <span style={{ fontWeight: "bold", color: "#2563eb" }}>
                  {data.distancias?.aPuertoMasCercano?.millasNauticas?.toFixed(
                    2,
                  ) || "0.00"}{" "}
                  MN
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {data.distancias?.aPuertoMasCercano?.zona || "N/A"} -{" "}
                {data.distancias?.aPuertoMasCercano?.provincia || "N/A"}
              </div>
            </div>

            {/* Distancia desde puerto de salida */}
            {data.distancias?.desdePuertoSalida && (
              <div
                style={{
                  padding: "0.5rem",
                  backgroundColor: "#fef3c7",
                  borderRadius: "4px",
                  border: "1px solid #fde68a",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                    color: "#92400e",
                  }}
                >
                  🚢 Desde Puerto de Salida
                </div>
                <div style={{ marginBottom: "0.25rem", fontSize: "11px" }}>
                  {data.distancias?.desdePuertoSalida?.puertoSalida || "N/A"}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                  }}
                >
                  <span>
                    {data.distancias?.desdePuertoSalida?.distanciaKm?.toFixed(
                      2,
                    ) || "0.00"}{" "}
                    km
                  </span>
                  <span style={{ fontWeight: "bold", color: "#b45309" }}>
                    {data.distancias?.desdePuertoSalida?.distanciaMillasNauticas?.toFixed(
                      2,
                    ) || "0.00"}{" "}
                    MN
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: INFORMACIÓN MARÍTIMA */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#f9fafb",
          }}
        >
          <h4
            style={{
              margin: "0 0 0.75rem 0",
              color: "#1f2937",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="pi pi-globe" style={{ color: "#8b5cf6" }}></i>
            Información Marítima
          </h4>

          <div style={{ fontSize: "12px" }}>
            {/* Zona de Pesca */}
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Zona de Pesca:</strong>
              <div style={{ marginTop: "0.25rem" }}>
                <Tag
                  value={data.informacionMaritima?.zonaPesca || "N/A"}
                  severity="info"
                  style={{ fontSize: "11px" }}
                />
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {data.informacionMaritima?.region || "N/A"}
              </div>
            </div>

            {/* Clasificación de Aguas */}
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Clasificación de Aguas:</strong>
              <div style={{ marginTop: "0.25rem" }}>
                <Tag
                  value={data.informacionMaritima?.clasificacionAguas || "N/A"}
                  severity={getClasificacionAguasColor(
                    data.informacionMaritima?.clasificacionAguas || "",
                  )}
                  style={{ fontSize: "11px" }}
                />
              </div>
              <div style={{ fontSize: "11px", marginTop: "0.25rem" }}>
                {data.informacionMaritima?.enAguasTerritoriales && (
                  <span style={{ color: "#dc2626" }}>
                    ⚠️ Aguas Territoriales (0-12 MN)
                  </span>
                )}
                {!data.informacionMaritima?.enAguasTerritoriales &&
                  data.informacionMaritima?.enZEE && (
                    <span style={{ color: "#059669" }}>
                      ✓ Zona Económica Exclusiva (12-200 MN)
                    </span>
                  )}
                {!data.informacionMaritima?.enZEE && (
                  <span style={{ color: "#3b82f6" }}>
                    🌊 Aguas Internacionales (&gt;200 MN)
                  </span>
                )}
              </div>
            </div>

            {/* Profundidad del Mar */}
            {data.informacionMaritima?.profundidad &&
              data.informacionMaritima.profundidad.profundidadMetros > 0 && (
                <div
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#dbeafe",
                    borderRadius: "4px",
                    border: "1px solid #93c5fd",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "0.25rem",
                      color: "#1e40af",
                    }}
                  >
                    🌊 Profundidad del Mar
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>
                      {data.informacionMaritima.profundidad.profundidadMetros?.toFixed(
                        2,
                      ) || "0.00"}{" "}
                      m
                    </span>
                    <span style={{ fontWeight: "bold", color: "#2563eb" }}>
                      {data.informacionMaritima.profundidad.profundidadBrazas?.toFixed(
                        2,
                      ) || "0.00"}{" "}
                      brazas
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                      fontStyle: "italic",
                    }}
                  >
                    Fuente:{" "}
                    {data.informacionMaritima.profundidad.fuente || "N/A"}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
