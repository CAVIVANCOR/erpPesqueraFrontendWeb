// src/config/mapConfig.js
// Configuración global para mapas Leaflet
// Documentado en español

/**
 * Configuración de zoom para mapas
 * 
 * Niveles de zoom:
 * - 1-3: Mundo completo (continentes)
 * - 4-6: País/región (Perú completo)
 * - 7-9: Región costera (ver costa + mar) ✅ RECOMENDADO
 * - 10-12: Ciudad (detalles urbanos)
 * - 13-15: Barrio/calle (muy cerca)
 * - 16-18: Edificio (máximo detalle)
 */

/**
 * Zoom por defecto para todos los mapas del sistema
 * Cambia este valor para ajustar el zoom de TODOS los mapas
 */
export const DEFAULT_MAP_ZOOM = 9;

/**
 * Zoom mínimo permitido
 */
export const MIN_MAP_ZOOM = 1;

/**
 * Zoom máximo permitido
 */
export const MAX_MAP_ZOOM = 18;

/**
 * Incremento/decremento de zoom con botones +/-
 */
export const ZOOM_STEP = 1;

/**
 * Configuración de tiles - Múltiples proveedores disponibles
 */

// OpenStreetMap Standard (gratuito, buena calidad)
export const OSM_STANDARD = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
};

// OpenStreetMap HOT (Humanitarian, más detalles)
export const OSM_HOT = {
  url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
  maxZoom: 19,
};

// Esri World Imagery (satélite, muy detallado)
export const ESRI_SATELLITE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  maxZoom: 18,
};

// Esri World Street Map (calles detalladas)
export const ESRI_STREET = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
  maxZoom: 19,
};

// CartoDB Positron (limpio, minimalista)
export const CARTO_POSITRON = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
};

/**
 * Tile por defecto (cambiar aquí para cambiar el estilo de TODOS los mapas)
 * Opciones: OSM_STANDARD, OSM_HOT, ESRI_SATELLITE, ESRI_STREET, CARTO_POSITRON
 */
// Opción 1: OpenStreetMap con más labels (RECOMENDADO para ti)
export const DEFAULT_TILE_LAYER = OSM_HOT;

// O si prefieres satélite + labels, agrega esta nueva opción:
// export const ESRI_HYBRID = {
//   url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
//   attribution: 'Tiles &​copy; Esri',
//   maxZoom: 18,
// };
// 
// Y luego un segundo TileLayer para labels:
// export const ESRI_LABELS = {
//   url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
//   attribution: '',
//   maxZoom: 18,
// };

/**
 * Configuración de cuadrícula (graticule)
 */
export const GRATICULE_CONFIG = {
  showLabel: true,
  dashArray: [5, 5],
  weight: 1,
  opacity: 0.5,
  color: '#0EA5E9',
  interval: 0.1, // Intervalo en grados (0.1 = más líneas)
};

/**
 * Configuración por defecto para MapContainer
 */
export const DEFAULT_MAP_CONFIG = {
  zoom: DEFAULT_MAP_ZOOM,
  minZoom: MIN_MAP_ZOOM,
  maxZoom: MAX_MAP_ZOOM,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  touchZoom: true,
  zoomControl: false, // Desactivar controles por defecto (usaremos personalizados)
};

/**
 * Iconos personalizados para marcadores
 */
export const MARKER_ICONS = {
  // Embarcación (azul)
  embarcacion: {
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiMwRUE1RTkiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTE2IDI4IEwxNiA0MCIgc3Ryb2tlPSIjMEVBNUU5IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  },
  // Usuario actual (verde)
  usuario: {
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiMxMEI5ODEiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTE2IDI4IEwxNiA0MCIgc3Ryb2tlPSIjMTBCOTgxIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  },
};
