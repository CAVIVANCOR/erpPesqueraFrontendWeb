/**
 * Componente GENÉRICO para mostrar información geográfica de múltiples puntos
 * Este componente renderiza SOLO la columna de "Ubicación Geográfica"
 * Las columnas de "Distancias" e "Información Marítima" se renderizan aparte
 *
 * @param {Object} props
 * @param {Object} props.infoInicioRetorno - Info geográfica del punto 1
 * @param {Object} props.infoPlataforma - Info geográfica del punto 2
 * @param {Object} props.infoFondeo - Info geográfica del punto 3 (opcional)
 * @param {boolean} props.loadingInicioRetorno - Estado de carga punto 1
 * @param {boolean} props.loadingPlataforma - Estado de carga punto 2
 * @param {boolean} props.loadingFondeo - Estado de carga punto 3
 * @param {string} props.labelPunto1 - Label personalizado punto 1 (default: "INICIO DE RETORNO")
 * @param {string} props.labelPunto2 - Label personalizado punto 2 (default: "PLATAFORMA DE DESCARGA")
 * @param {string} props.labelPunto3 - Label personalizado punto 3 (default: "FONDEO")
 * @param {string} props.iconoPunto1 - Icono punto 1 (default: "🔵")
 * @param {string} props.iconoPunto2 - Icono punto 2 (default: "🔴")
 * @param {string} props.iconoPunto3 - Icono punto 3 (default: "🟠")
 * @param {string} props.colorPunto1 - Color punto 1 (default: "#3b82f6")
 * @param {string} props.colorPunto2 - Color punto 2 (default: "#ef4444")
 * @param {string} props.colorPunto3 - Color punto 3 (default: "#ff9800")
 * @param {string} props.bgColorPunto1 - Color fondo punto 1 (default: "#eff6ff")
 * @param {string} props.bgColorPunto2 - Color fondo punto 2 (default: "#fef2f2")
 * @param {string} props.bgColorPunto3 - Color fondo punto 3 (default: "#fff7ed")
 */
export default function InformacionGeograficaMultiple({
  infoInicioRetorno,
  infoPlataforma,
  infoFondeo,
  loadingInicioRetorno,
  loadingPlataforma,
  loadingFondeo,
  // Props genéricos con valores por defecto para Descarga (compatibilidad hacia atrás)
  labelPunto1 = "INICIO DE RETORNO",
  labelPunto2 = "PLATAFORMA DE DESCARGA",
  labelPunto3 = "FONDEO",
  iconoPunto1 = "🔵",
  iconoPunto2 = "🔴",
  iconoPunto3 = "🟠",
  colorPunto1 = "#3b82f6",
  colorPunto2 = "#ef4444",
  colorPunto3 = "#ff9800",
  bgColorPunto1 = "#eff6ff",
  bgColorPunto2 = "#fef2f2",
  bgColorPunto3 = "#fff7ed",
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

        {/* 1. PUNTO 1 (Personalizable) */}
        <div
          style={{
            marginBottom: "0.25rem",
            padding: "0.75rem",
            backgroundColor: bgColorPunto1,
            borderRadius: "6px",
            border: `2px solid ${colorPunto1}`,
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: colorPunto1,
              marginBottom: "0.25rem",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span style={{ fontSize: "16px" }}>{iconoPunto1}</span>
            {labelPunto1}
          </div>
          {renderUbicacion(infoInicioRetorno, loadingInicioRetorno, colorPunto1)}
        </div>

        {/* 2. PUNTO 2 (Personalizable) */}
        <div
          style={{
            marginBottom: "0.25rem",
            padding: "0.75rem",
            backgroundColor: bgColorPunto2,
            borderRadius: "6px",
            border: `2px solid ${colorPunto2}`,
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: colorPunto2,
              marginBottom: "0.5rem",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "16px" }}>{iconoPunto2}</span>
            {labelPunto2}
          </div>
          {renderUbicacion(infoPlataforma, loadingPlataforma, colorPunto2)}
        </div>

        {/* 3. PUNTO 3 (Personalizable - solo si existe) */}
        {infoFondeo && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: bgColorPunto3,
              borderRadius: "6px",
              border: `2px solid ${colorPunto3}`,
            }}
          >
            <div
              style={{
                fontWeight: "700",
                color: colorPunto3,
                marginBottom: "0.25rem",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span style={{ fontSize: "16px" }}>{iconoPunto3}</span>
              {labelPunto3}
            </div>
            {renderUbicacion(infoFondeo, loadingFondeo, colorPunto3)}
          </div>
        )}
      </div>
    </>
  );
}