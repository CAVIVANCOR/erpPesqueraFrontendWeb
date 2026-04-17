// src/components/shared/MapaConControles.jsx
// Componente genérico reutilizable para mapas con controles y capas
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Button } from "primereact/button";
import { DEFAULT_MAP_ZOOM } from "../../config/mapConfig";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Componente de líneas guía (graticule) - Implementación manual
 */
const GraticuleLayer = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const graticuleLines = [];

    const drawGraticule = () => {
      // Limpiar líneas anteriores
      graticuleLines.forEach((line) => map.removeLayer(line));
      graticuleLines.length = 0;

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Determinar intervalo según zoom (más líneas)
      let interval = 0.5;
      if (zoom >= 12) interval = 0.05;
      else if (zoom >= 10) interval = 0.1;
      else if (zoom >= 8) interval = 0.2;
      else if (zoom >= 6) interval = 0.5;
      else if (zoom >= 4) interval = 1;
      else if (zoom >= 2) interval = 2;
      else interval = 5;

      const south = Math.floor(bounds.getSouth() / interval) * interval;
      const north = Math.ceil(bounds.getNorth() / interval) * interval;
      const west = Math.floor(bounds.getWest() / interval) * interval;
      const east = Math.ceil(bounds.getEast() / interval) * interval;

      // Dibujar líneas de latitud (horizontales)
      for (let lat = south; lat <= north; lat += interval) {
        const line = L.polyline(
          [
            [lat, west],
            [lat, east],
          ],
          {
            color: "#0EA5E9",
            weight: 1,
            opacity: 0.4,
            dashArray: "3, 6",
            interactive: false,
          }
        ).addTo(map);
        graticuleLines.push(line);

        // Agregar etiqueta de latitud
        if (zoom >= 7) {
          const marker = L.marker([lat, west], {
            icon: L.divIcon({
              className: "graticule-label",
              html: `<div style="background: rgba(255,255,255,0.8); padding: 2px 4px; border-radius: 3px; font-size: 10px; color: #0EA5E9; font-weight: 600; white-space: nowrap;">${lat.toFixed(
                interval < 1 ? 1 : 0
              )}°</div>`,
              iconSize: [50, 20],
              iconAnchor: [0, 10],
            }),
            interactive: false,
          }).addTo(map);
          graticuleLines.push(marker);
        }
      }

      // Dibujar líneas de longitud (verticales)
      for (let lng = west; lng <= east; lng += interval) {
        const line = L.polyline(
          [
            [south, lng],
            [north, lng],
          ],
          {
            color: "#0EA5E9",
            weight: 1,
            opacity: 0.4,
            dashArray: "3, 6",
            interactive: false,
          }
        ).addTo(map);
        graticuleLines.push(line);

        // Agregar etiqueta de longitud
        if (zoom >= 7) {
          const marker = L.marker([south, lng], {
            icon: L.divIcon({
              className: "graticule-label",
              html: `<div style="background: rgba(255,255,255,0.8); padding: 2px 4px; border-radius: 3px; font-size: 10px; color: #0EA5E9; font-weight: 600; white-space: nowrap;">${lng.toFixed(
                interval < 1 ? 1 : 0
              )}°</div>`,
              iconSize: [50, 20],
              iconAnchor: [25, 0],
            }),
            interactive: false,
          }).addTo(map);
          graticuleLines.push(marker);
        }
      }
    };

    // Dibujar al cargar
    drawGraticule();

    // Redibujar al mover o hacer zoom
    map.on("moveend", drawGraticule);
    map.on("zoomend", drawGraticule);

    return () => {
      graticuleLines.forEach((line) => map.removeLayer(line));
      map.off("moveend", drawGraticule);
      map.off("zoomend", drawGraticule);
    };
  }, [map]);

  return null;
};

/**
 * Componente genérico de mapa con controles
 * 
 * @param {Object} props
 * @param {Array} props.mapPosition - Posición central del mapa [lat, lng]
 * @param {number} props.mapKey - Key para forzar re-render del mapa
 * @param {string} props.tipoMapa - Tipo de mapa: 'street', 'satellite', 'hybrid'
 * @param {number} props.zoom - Nivel de zoom inicial (opcional, default: DEFAULT_MAP_ZOOM)
 * @param {Function} props.getTileConfig - Función que retorna configuración de tiles
 * @param {Function} props.toggleFullscreen - Función para alternar pantalla completa
 * @param {Function} props.cambiarTipoMapa - Función para cambiar tipo de mapa
 * @param {Function} props.obtenerUbicacionUsuario - Función para obtener ubicación del usuario
 * @param {React.ReactNode} props.children - Componentes hijos (markers, polylines, etc.)
 * @param {React.RefObject} props.mapContainerRef - Ref del contenedor del mapa
 * @param {boolean} props.mapaFullscreen - Estado de pantalla completa
 */
export default function MapaConControles({
  mapPosition = [-12.0, -77.0],
  mapKey = 0,
  tipoMapa = "street",
  zoom = DEFAULT_MAP_ZOOM,
  getTileConfig,
  toggleFullscreen,
  cambiarTipoMapa,
  obtenerUbicacionUsuario,
  children,
  mapContainerRef,
  mapaFullscreen = false,
}) {
  return (
    <div
      style={{
        flex: mapaFullscreen ? "1 1 100%" : "1 1 400px",
        minWidth: mapaFullscreen ? "100%" : "400px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
        height: "500px",
      }}
      ref={mapContainerRef}
    >
      {/* Botones de control */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Button
          type="button"
          icon={mapaFullscreen ? "pi pi-times" : "pi pi-window-maximize"}
          className="p-button-rounded p-button-secondary"
          onClick={toggleFullscreen}
          tooltip="Pantalla completa"
          tooltipOptions={{ position: "left" }}
          style={{
            width: "35px",
            height: "35px",
            backgroundColor: "white",
            color: "#333",
            border: "2px solid #ccc",
          }}
        />
        <Button
          type="button"
          icon="pi pi-map"
          className="p-button-rounded p-button-info"
          onClick={cambiarTipoMapa}
          tooltip={`Cambiar a ${tipoMapa === "street" ? "satélite" : tipoMapa === "satellite" ? "híbrido" : "calles"}`}
          tooltipOptions={{ position: "left" }}
          style={{
            width: "35px",
            height: "35px",
            backgroundColor: "white",
            color: "#0EA5E9",
            border: "2px solid #0EA5E9",
          }}
        />
        <Button
          type="button"
          icon="pi pi-compass"
          className="p-button-rounded p-button-success"
          onClick={obtenerUbicacionUsuario}
          tooltip="Mi ubicación"
          tooltipOptions={{ position: "left" }}
          style={{
            width: "35px",
            height: "35px",
            backgroundColor: "white",
            color: "#10B981",
            border: "2px solid #10B981",
          }}
        />
      </div>

      {/* Mapa */}
      <MapContainer
        key={mapKey}
        center={mapPosition}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={tipoMapa}
          url={getTileConfig().url}
          attribution={getTileConfig().attribution}
          maxZoom={19}
        />
        {tipoMapa === "hybrid" && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            maxZoom={19}
          />
        )}
        <GraticuleLayer />
        {children}
      </MapContainer>
    </div>
  );
}