// src/components/shared/InformacionGeograficaPanel.jsx
// Componente genérico reutilizable para mostrar información geográfica en 3 columnas
import React from "react";
import { Tag } from "primereact/tag";

/**
 * Componente genérico para mostrar información geográfica en 3 columnas
 *
 * @param {Object} props
 * @param {Object} props.infoGeografica - Objeto con información geográfica
 * @param {boolean} props.loadingGeo - Estado de carga
 * @param {Function} props.getClasificacionAguasColor - Función para obtener color de clasificación de aguas
 */
export default function InformacionGeograficaPanel({
  infoGeografica,
  loadingGeo,
  getClasificacionAguasColor,
}) {
  return (
    <>
      {/* COLUMNA 2: UBICACIÓN GEOGRÁFICA (20%) */}
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
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <i className="pi pi-map-marker" style={{ color: "#ef4444" }}></i>
          Ubicación Geográfica
        </h4>

        {loadingGeo ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "2rem", color: "#ef4444" }}
            ></i>
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "12px",
                color: "#6c757d",
              }}
            >
              Cargando...
            </p>
          </div>
        ) : !infoGeografica ? (
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
        ) : (
          <div style={{ fontSize: "12px" }}>
            {infoGeografica.ubicacion?.ciudad === "N/A" &&
            infoGeografica.referenciaCosta ? (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: "4px",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    color: "#92400e",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="pi pi-exclamation-triangle"></i>
                  Alta Mar
                </div>
                <div style={{ fontSize: "11px", color: "#78350f" }}>
                  {infoGeografica.referenciaCosta.descripcion}
                </div>
              </div>
            ) : null}

            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                📍 Lugar
              </div>
              <div style={{ color: "#1f2937" }}>
                {(infoGeografica.ubicacion?.lugar &&
                infoGeografica.ubicacion.lugar !== "N/A"
                  ? infoGeografica.ubicacion.lugar
                  : infoGeografica.referenciaCosta?.ubicacionCosta?.lugar) ||
                  "N/A"}
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                🏛️ Distrito
              </div>
              <div style={{ color: "#1f2937" }}>
                {(infoGeografica.ubicacion?.distrito &&
                infoGeografica.ubicacion.distrito !== "N/A"
                  ? infoGeografica.ubicacion.distrito
                  : infoGeografica.referenciaCosta?.ubicacionCosta?.distrito) ||
                  "N/A"}
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                🗺️ Provincia
              </div>
              <div style={{ color: "#1f2937" }}>
                {(infoGeografica.ubicacion?.provincia &&
                infoGeografica.ubicacion.provincia !== "N/A"
                  ? infoGeografica.ubicacion.provincia
                  : infoGeografica.referenciaCosta?.ubicacionCosta
                      ?.provincia) || "N/A"}
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                🏴 Departamento
              </div>
              <div style={{ color: "#1f2937" }}>
                {(infoGeografica.ubicacion?.departamento &&
                infoGeografica.ubicacion.departamento !== "N/A"
                  ? infoGeografica.ubicacion.departamento
                  : infoGeografica.referenciaCosta?.ubicacionCosta
                      ?.departamento) || "N/A"}
              </div>
            </div>

            {infoGeografica.referenciaCosta && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem",
                  backgroundColor: "#e0f2fe",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: "#0c4a6e",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                  🧭 Navegación
                </div>
                <div>
                  Bearing:{" "}
                  {infoGeografica.referenciaCosta.navegacion?.bearing?.toFixed(
                    1,
                  )}
                  °
                </div>
                <div>
                  Dirección:{" "}
                  {infoGeografica.referenciaCosta.navegacion?.direccion}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COLUMNA 3: DISTANCIAS (20%) */}
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

        {loadingGeo ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "2rem", color: "#10b981" }}
            ></i>
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "12px",
                color: "#6c757d",
              }}
            >
              Cargando...
            </p>
          </div>
        ) : !infoGeografica ? (
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
        ) : (
          <div style={{ fontSize: "12px" }}>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#ecfdf5",
                borderRadius: "4px",
                border: "1px solid #a7f3d0",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  color: "#065f46",
                  marginBottom: "0.25rem",
                }}
              >
                📏 A la Costa
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <span style={{ fontSize: "12px", color: "#059669" }}>
                  {infoGeografica.distancias?.aCosta?.distanciaKm?.toFixed(2) ||
                    "0.00"}{" "}
                  km
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#047857",
                  }}
                >
                  {infoGeografica.distancias?.aCosta?.distanciaMillasNauticas?.toFixed(
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
                {infoGeografica.distancias?.aCosta?.puntoCosteroMasCercano ||
                  "N/A"}
              </div>
            </div>

            {infoGeografica.distancias?.aPuertoMasCercano && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#eff6ff",
                  borderRadius: "4px",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    color: "#1e40af",
                    marginBottom: "0.25rem",
                  }}
                >
                  ⚓ Puerto Más Cercano
                </div>
                <div
                  style={{
                    color: "#1e3a8a",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  {infoGeografica.distancias.aPuertoMasCercano.nombrePuerto ||
                    "N/A"}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "#3b82f6" }}>
                    {infoGeografica.distancias.aPuertoMasCercano.km?.toFixed(
                      2,
                    ) || "0.00"}{" "}
                    km
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#2563eb",
                      fontSize: "12px",
                    }}
                  >
                    {infoGeografica.distancias.aPuertoMasCercano.millasNauticas?.toFixed(
                      2,
                    ) || "0.00"}{" "}
                    MN
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COLUMNA 4: INFORMACIÓN MARÍTIMA (20%) */}
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

        {loadingGeo ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "2rem", color: "#8b5cf6" }}
            ></i>
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "12px",
                color: "#6c757d",
              }}
            >
              Cargando...
            </p>
          </div>
        ) : !infoGeografica ? (
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
        ) : (
          <div style={{ fontSize: "12px" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                🌊 Zona de Pesca
              </div>
              <Tag
                value={infoGeografica.informacionMaritima?.zonaPesca || "N/A"}
                severity="info"
                style={{ fontSize: "11px" }}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                🗺️ Región
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                {infoGeografica.informacionMaritima?.region || "N/A"}
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                💧 Clasificación de Aguas
              </div>
              <Tag
                value={
                  infoGeografica.informacionMaritima?.clasificacionAguas ||
                  "N/A"
                }
                severity={getClasificacionAguasColor(
                  infoGeografica.informacionMaritima?.clasificacionAguas,
                )}
                style={{ fontSize: "11px" }}
              />
            </div>

            {infoGeografica.informacionMaritima?.profundidadMar && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  🌊 Profundidad del Mar
                </div>
                <div style={{ color: "#1f2937" }}>
                  {infoGeografica.informacionMaritima.profundidadMar} m
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
