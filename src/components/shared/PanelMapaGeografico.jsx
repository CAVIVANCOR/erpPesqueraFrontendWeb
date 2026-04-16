// src/components/shared/PanelMapaGeografico.jsx
// Panel colapsable profesional que contiene mapa con controles e información geográfica
// Documentado en español técnico para mantenibilidad

import React, { useState } from "react";
import { Panel } from "primereact/panel";
import MapaConControles from "./MapaConControles";
import InformacionGeograficaPanel from "./InformacionGeograficaPanel";

/**
 * PanelMapaGeografico
 *
 * Componente wrapper profesional que encapsula el mapa con controles y el panel
 * de información geográfica en un panel colapsable de PrimeReact.
 *
 * Características:
 * - Panel colapsable/expandible con estado interno
 * - Integra MapaConControles e InformacionGeograficaPanel
 * - Configuración flexible de título y estado inicial
 * - Layout responsive automático
 * - Soporte para children (markers, polylines, etc.)
 * - Opción para ocultar el mapa y mostrar solo información
 *
 * Props:
 * - mapPosition: [lat, lng] - Posición central del mapa
 * - mapKey: number - Key para forzar re-render del mapa
 * - tipoMapa: string - Tipo de mapa (street, satellite, hybrid)
 * - getTileConfig: function - Función que retorna configuración de tiles
 * - toggleFullscreen: function - Función para alternar pantalla completa
 * - cambiarTipoMapa: function - Función para cambiar tipo de mapa
 * - obtenerUbicacionUsuario: function - Función para obtener ubicación GPS
 * - mapContainerRef: ref - Referencia al contenedor del mapa
 * - mapaFullscreen: boolean - Estado de pantalla completa
 * - infoGeografica: object - Datos de información geográfica
 * - loadingGeo: boolean - Estado de carga de información geográfica
 * - getClasificacionAguasColor: function - Función para obtener color de clasificación
 * - titulo: string - Título del panel (opcional, default: "📍 Información Geográfica")
 * - colapsadoPorDefecto: boolean - Estado inicial del panel (opcional, default: true)
 * - mostrarMapa: boolean - Si se muestra el mapa o solo la información (opcional, default: true)
 * - children: ReactNode - Componentes hijos (markers, polylines, etc.)
 */
export default function PanelMapaGeografico({
  // Props del mapa
  mapPosition,
  mapKey,
  tipoMapa,
  getTileConfig,
  toggleFullscreen,
  cambiarTipoMapa,
  obtenerUbicacionUsuario,
  mapContainerRef,
  mapaFullscreen,

  // Props del panel de información
  infoGeografica,
  loadingGeo,
  getClasificacionAguasColor,

  // Props del panel colapsable
  titulo = "📍 Información Geográfica",
  colapsadoPorDefecto = true,
  
  // NUEVO: Prop para ocultar el mapa
  mostrarMapa = true,

  // Children (markers, lines, etc.)
  children,
}) {
  // Estado interno para controlar colapso del panel
  const [collapsed, setCollapsed] = useState(colapsadoPorDefecto);

  return (
    <Panel
      header={titulo}
      toggleable
      collapsed={collapsed}
      onToggle={(e) => setCollapsed(e.value)}
      className="mb-3"
      style={{
        marginTop: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {mostrarMapa && (
          <MapaConControles
            mapPosition={mapPosition}
            mapKey={mapKey}
            tipoMapa={tipoMapa}
            getTileConfig={getTileConfig}
            toggleFullscreen={toggleFullscreen}
            cambiarTipoMapa={cambiarTipoMapa}
            obtenerUbicacionUsuario={obtenerUbicacionUsuario}
            mapContainerRef={mapContainerRef}
            mapaFullscreen={mapaFullscreen}
          >
            {children}
          </MapaConControles>
        )}

        <InformacionGeograficaPanel
          infoGeografica={infoGeografica}
          loadingGeo={loadingGeo}
          getClasificacionAguasColor={getClasificacionAguasColor}
        />
      </div>
    </Panel>
  );
}