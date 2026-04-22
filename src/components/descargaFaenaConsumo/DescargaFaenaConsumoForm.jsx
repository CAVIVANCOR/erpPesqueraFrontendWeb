// src/components/descargaFaenaConsumo/DescargaFaenaConsumoForm.jsx
// Formulario profesional para DescargaFaenaConsumo - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

import {
  crearDescargaFaenaConsumo,
  actualizarDescargaFaenaConsumo,
  finalizarDescargaConsumoConMovimientos,
} from "../../api/descargaFaenaConsumo";
import { confirmDialog } from "primereact/confirmdialog";
import {
  capturarGPS,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { analizarCoordenadasConReferencia } from "../../api/geolocalizacion";
import { obtenerPlataformasPorEntidad } from "../../api/detPlataformaRecepcionPesca";
import { getCalasFaenaConsumoPorFaena } from "../../api/calaFaenaConsumo";
import { DEFAULT_MAP_ZOOM, MARKER_ICONS } from "../../config/mapConfig";
import L from "leaflet";
import PanelMapaGeografico from "../shared/PanelMapaGeografico";
import PuntoGPSInput from "../shared/PuntoGPSInput";
import { TabView, TabPanel } from "primereact/tabview";
import { getEmbarcacionPorId } from "../../api/embarcacion";
import { getPrecioCombustibleVigente } from "../../api/precioCombustible";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { formatearNumero } from "../../utils/utils";
import PDFDocumentManager from "../pdf/PDFDocumentManager";
/**
 * Formulario DescargaFaenaConsumoForm
 *
 * Formulario profesional para gestión de descargas de faena de pesca consumo.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Captura de GPS integrada
 * - Layout responsive siguiendo patrón DatosGeneralesFaenaPescaConsumo
 *
 * Props esperadas desde el componente padre:
 * - puertos: Array de puertos (todos los puertos disponibles)
 * - clientes: Array de clientes filtrados por EntidadComercial (empresaId, tipoEntidadId=8, esCliente=true, estado=true)
 * - especies: Array de especies (con precioPorKg y cubetaPesoKg)
 * - katanasTripulacion: Array de rangos de katana tripulación filtrados por empresaId
 * - empresaData: Objeto con datos de la empresa (opcional, para futuras funcionalidades)
 * - bahiaId: ID de bahía (valor fijo desde FaenaPescaConsumo)
 * - motoristaId: ID de motorista (valor fijo desde FaenaPescaConsumo)
 * - patronId: ID de patrón (valor fijo desde FaenaPescaConsumo)
 * - faenaPescaConsumoId: ID de faena de pesca consumo (valor fijo desde FaenaPescaConsumo)
 * - novedadPescaConsumoId: ID de novedad de pesca consumo (requerido para finalización)
 */
export default function DescargaFaenaConsumoForm({
  detalle,
  puertos = [],
  clientes = [],
  especies = [],
  katanasTripulacion = [],
  empresaData = null,
  bahiaId = null,
  motoristaId = null,
  patronId = null,
  faenaPescaConsumoId = null,
  novedadPescaConsumoId = null,
  onGuardadoExitoso,
  onCancelar,
}) {
  // ⭐ OBTENER USUARIO AUTENTICADO PARA VERIFICAR SI ES SUPERUSUARIO
  const usuario = useAuthStore((state) => state.usuario);
  const esSuperUsuario = usuario?.esSuperUsuario || false;

  // Estados para loading
  const [loading, setLoading] = useState(false);
  const [finalizandoDescarga, setFinalizandoDescarga] = useState(false);

  // Ref para rastrear la especie anterior y evitar sobrescribir precio editado manualmente
  const especieAnteriorRef = useRef(null);

  // Configuración del formulario
  const {
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      faenaPescaConsumoId: faenaPescaConsumoId,
      puertoDescargaId: null,
      fechaHoraArriboPuerto: null,
      fechaHoraLlegadaPuerto: null,
      clienteId: null,
      plataformaRecepcionPescaId: null,
      numPlataformaDescarga: "",
      turnoPlataformaDescarga: "DIA",
      fechaHoraInicioDescarga: null,
      fechaHoraFinDescarga: null,
      numWinchaPesaje: "",
      urlComprobanteWincha: "",
      patronId: patronId,
      motoristaId: motoristaId,
      bahiaId: bahiaId,
      latitud: 0,
      longitud: 0,
      combustibleAbastecidoGalones: 0,
      urlValeAbastecimiento: "",
      urlInformeDescargaProduce: "",
      movIngresoAlmacenId: null,
      observaciones: "",
      especieId: null,
      toneladas: 0,
      porcentajeJuveniles: 0,
      fechaHoraFondeo: null,
      latitudFondeo: 0,
      longitudFondeo: 0,
      puertoFondeoId: null,
      nroCubetas: 0,
      precioPorKgEspecie: 0,
      precioTotal: 0,
      katanaTripulacionId: null,
    },
  });

  // Observar cambios en coordenadas para mostrar formato DMS
  const latitud = watch("latitud");
  const longitud = watch("longitud");
  const latitudFondeo = watch("latitudFondeo");
  const longitudFondeo = watch("longitudFondeo");

  // Observar cambios para cálculos automáticos
  const especieIdWatched = watch("especieId");
  const toneladasWatched = watch("toneladas");
  const nroCubetasWatched = watch("nroCubetas");
  const precioPorKgEspecieWatched = watch("precioPorKgEspecie");

  // Ref para controlar qué campo se está editando (para evitar loops infinitos)
  const ultimoCambioRef = useRef(null);

  // Estados para formato DMS de descarga
  const [latGrados, setLatGrados] = useState(0);
  const [latMinutos, setLatMinutos] = useState(0);
  const [latSegundos, setLatSegundos] = useState(0);
  const [latDireccion, setLatDireccion] = useState("S");
  const [lonGrados, setLonGrados] = useState(0);
  const [lonMinutos, setLonMinutos] = useState(0);
  const [lonSegundos, setLonSegundos] = useState(0);
  const [lonDireccion, setLonDireccion] = useState("W");

  // Estados para formato DMS de fondeo
  const [latFondeoGrados, setLatFondeoGrados] = useState(0);
  const [latFondeoMinutos, setLatFondeoMinutos] = useState(0);
  const [latFondeoSegundos, setLatFondeoSegundos] = useState(0);
  const [latFondeoDireccion, setLatFondeoDireccion] = useState("S");
  const [lonFondeoGrados, setLonFondeoGrados] = useState(0);
  const [lonFondeoMinutos, setLonFondeoMinutos] = useState(0);
  const [lonFondeoSegundos, setLonFondeoSegundos] = useState(0);
  const [lonFondeoDireccion, setLonFondeoDireccion] = useState("W");

  // Estados para información geográfica
  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);

  // Estados para información geográfica de FONDEO
  const [infoGeograficaFondeo, setInfoGeograficaFondeo] = useState(null);
  const [loadingGeoFondeo, setLoadingGeoFondeo] = useState(false);
  const [errorGeoFondeo, setErrorGeoFondeo] = useState(null);

  // Estados para ubicación del usuario y pantalla completa
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const [tipoMapa, setTipoMapa] = useState("street");

  // Estados para ubicación del usuario y pantalla completa FONDEO
  const [ubicacionUsuarioFondeo, setUbicacionUsuarioFondeo] = useState(null);
  const [mapaFullscreenFondeo, setMapaFullscreenFondeo] = useState(false);
  const mapContainerRefFondeo = useRef(null);
  const [tipoMapaFondeo, setTipoMapaFondeo] = useState("street");

  // Estados para el mapa
  const [mapPosition, setMapPosition] = useState([-12.0, -77.0]);
  const [mapKey, setMapKey] = useState(0);

  // Estados para el mapa de fondeo
  const [mapPositionFondeo, setMapPositionFondeo] = useState([-12.0, -77.0]);
  const [mapKeyFondeo, setMapKeyFondeo] = useState(0);

  // Estados para plataformas de recepción
  const [plataformasRecepcion, setPlataformasRecepcion] = useState([]);
  const [loadingPlataformas, setLoadingPlataformas] = useState(false);

  // Estados para información geográfica de PLATAFORMA
  const [infoGeograficaPlataforma, setInfoGeograficaPlataforma] = useState(null);
  const [loadingGeoPlataforma, setLoadingGeoPlataforma] = useState(false);

  // Estados para cálculos de recorrido Retorno → Puerto
  const [puertoSalidaDatos, setPuertoSalidaDatos] = useState(null);
  const [distanciaRetornoPuerto, setDistanciaRetornoPuerto] = useState(null);
  const [consumoCombustible, setConsumoCombustible] = useState(null);
  const [costoCombustible, setCostoCombustible] = useState(null);
  const [precioCombustibleSoles, setPrecioCombustibleSoles] = useState(0);
  const [loadingPrecioCombustible, setLoadingPrecioCombustible] = useState(false);

  // Estados para cálculos de recorrido Descarga → Fondeo
  const [distanciaDescargaFondeo, setDistanciaDescargaFondeo] = useState(null);
  const [consumoDescargaFondeo, setConsumoDescargaFondeo] = useState(null);
  const [costoDescargaFondeo, setCostoDescargaFondeo] = useState(null);
  const [embarcacionCompleta, setEmbarcacionCompleta] = useState(null);

  /**
   * Componente de marcador de ubicación del usuario - DESCARGA
   */
  const UserLocationMarker = () => {
    if (!ubicacionUsuario) return null;

    const iconUsuario = L.icon({
      iconUrl: MARKER_ICONS.usuario.iconUrl,
      iconSize: MARKER_ICONS.usuario.iconSize,
      iconAnchor: MARKER_ICONS.usuario.iconAnchor,
      popupAnchor: MARKER_ICONS.usuario.popupAnchor,
    });

    return (
      <Marker
        position={[ubicacionUsuario.lat, ubicacionUsuario.lng]}
        icon={iconUsuario}
      >
        <Popup>
          <strong>📍 Tu Ubicación</strong>
          <br />
          Lat: {ubicacionUsuario.lat.toFixed(6)}
          <br />
          Lon: {ubicacionUsuario.lng.toFixed(6)}
          <br />
          Precisión: ±{ubicacionUsuario.accuracy.toFixed(0)}m
        </Popup>
      </Marker>
    );
  };

  /**
  * Componente de línea de distancia - DESCARGA
  */
  const DistanceLine = () => {
    const latitud = watch("latitud");
    const longitud = watch("longitud");
    if (!ubicacionUsuario || !latitud || !longitud) return null;

    const positions = [
      [ubicacionUsuario.lat, ubicacionUsuario.lng],
      [latitud, longitud],
    ];

    return (
      <Polyline
        positions={positions}
        color="#10B981"
        weight={2}
        opacity={0.6}
        dashArray="5, 10"
      />
    );
  };

  /**
   * Componente para mostrar línea desde inicio retorno hasta plataforma de recepción
   * Color azul (#3B82F6) para diferenciar del recorrido de pesca
   * PRIORIDAD: Si hay plataforma seleccionada, dibuja hacia plataforma. Sino, hacia puerto.
   */
  const LineaRetornoPlataforma = () => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");
    const puertoDescargaId = watch("puertoDescargaId");
    const latitudRetorno = watch("latitud");
    const longitudRetorno = watch("longitud");

    if (!latitudRetorno || !longitudRetorno) return null;

    let latitudDestino = null;
    let longitudDestino = null;

    // PRIORIDAD 1: Si hay plataforma seleccionada, usar coordenadas de plataforma
    if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0) {
      const plataforma = plataformasRecepcion.find(
        (p) => Number(p.value) === Number(plataformaRecepcionPescaId),
      );

      if (plataforma?.latitud && plataforma?.longitud) {
        latitudDestino = Number(plataforma.latitud);
        longitudDestino = Number(plataforma.longitud);
      }
    }

    // PRIORIDAD 2: Si no hay plataforma, usar coordenadas de puerto de descarga
    if (!latitudDestino && !longitudDestino && puertoDescargaId && puertos.length > 0) {
      const puertoDescarga = puertos.find(
        (p) => Number(p.id) === Number(puertoDescargaId),
      );

      if (puertoDescarga?.latitud && puertoDescarga?.longitud) {
        latitudDestino = Number(puertoDescarga.latitud);
        longitudDestino = Number(puertoDescarga.longitud);
      }
    }

    // Si no hay destino válido, no dibujar línea
    if (!latitudDestino || !longitudDestino) return null;

    const positions = [
      [Number(latitudRetorno), Number(longitudRetorno)],
      [latitudDestino, longitudDestino],
    ];

    return (
      <Polyline
        positions={positions}
        color="#3B82F6"
        weight={5}
        opacity={0.8}
      />
    );
  };

  /**
   * Componente de marcador de ubicación del usuario - FONDEO
   */
  const UserLocationMarkerFondeo = () => {
    if (!ubicacionUsuarioFondeo) return null;

    const iconUsuario = L.icon({
      iconUrl: MARKER_ICONS.usuario.iconUrl,
      iconSize: MARKER_ICONS.usuario.iconSize,
      iconAnchor: MARKER_ICONS.usuario.iconAnchor,
      popupAnchor: MARKER_ICONS.usuario.popupAnchor,
    });

    return (
      <Marker
        position={[ubicacionUsuarioFondeo.lat, ubicacionUsuarioFondeo.lng]}
        icon={iconUsuario}
      >
        <Popup>
          <strong>📍 Tu Ubicación</strong>
          <br />
          Lat: {ubicacionUsuarioFondeo.lat.toFixed(6)}
          <br />
          Lon: {ubicacionUsuarioFondeo.lng.toFixed(6)}
          <br />
          Precisión: ±{ubicacionUsuarioFondeo.accuracy.toFixed(0)}m
        </Popup>
      </Marker>
    );
  };

  /**
   * Componente de línea de distancia - FONDEO
   */
  const DistanceLineFondeo = () => {
    const latitudFondeo = watch("latitudFondeo");
    const longitudFondeo = watch("longitudFondeo");
    if (!ubicacionUsuarioFondeo || !latitudFondeo || !longitudFondeo)
      return null;

    const positions = [
      [ubicacionUsuarioFondeo.lat, ubicacionUsuarioFondeo.lng],
      [latitudFondeo, longitudFondeo],
    ];

    return (
      <Polyline
        positions={positions}
        color="#10B981"
        weight={2}
        opacity={0.6}
        dashArray="5, 10"
      />
    );
  };

  /**
   * Obtener ubicación actual del usuario - DESCARGA
   */
  const obtenerUbicacionUsuario = () => {
    if (!navigator.geolocation) {
      toast.current.show({
        severity: "warn",
        summary: "No disponible",
        detail: "Tu navegador no soporta geolocalización",
        life: 3000,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUbicacionUsuario({ lat: latitude, lng: longitude, accuracy });
        toast.current.show({
          severity: "success",
          summary: "Ubicación obtenida",
          detail: `Precisión: ±${accuracy.toFixed(0)}m`,
          life: 3000,
        });
      },
      (error) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo obtener tu ubicación",
          life: 3000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  /**
   * Obtener ubicación actual del usuario - FONDEO
   */
  const obtenerUbicacionUsuarioFondeo = () => {
    if (!navigator.geolocation) {
      toast.current.show({
        severity: "warn",
        summary: "No disponible",
        detail: "Tu navegador no soporta geolocalización",
        life: 3000,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUbicacionUsuarioFondeo({ lat: latitude, lng: longitude, accuracy });
        toast.current.show({
          severity: "success",
          summary: "Ubicación obtenida (Fondeo)",
          detail: `Precisión: ±${accuracy.toFixed(0)}m`,
          life: 3000,
        });
      },
      (error) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo obtener tu ubicación",
          life: 3000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  /**
   * Alternar pantalla completa del mapa - DESCARGA
   */
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.();
      setMapaFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setMapaFullscreen(false);
    }
  };

  /**
   * Alternar pantalla completa del mapa - FONDEO
   */
  const toggleFullscreenFondeo = () => {
    if (!mapContainerRefFondeo.current) return;

    if (!document.fullscreenElement) {
      mapContainerRefFondeo.current.requestFullscreen?.();
      setMapaFullscreenFondeo(true);
    } else {
      document.exitFullscreen?.();
      setMapaFullscreenFondeo(false);
    }
  };

  /**
   * Cambiar tipo de mapa - DESCARGA
   */
  const cambiarTipoMapa = () => {
    setTipoMapa((prev) => {
      if (prev === "street") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "street";
    });
  };

  /**
   * Cambiar tipo de mapa - FONDEO
   */
  const cambiarTipoMapaFondeo = () => {
    setTipoMapaFondeo((prev) => {
      if (prev === "street") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "street";
    });
  };

  /**
   * Obtener configuración del tile según tipo de mapa
   */
  const getTileConfig = () => {
    const configs = {
      street: {
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution:
          '&​copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "&​copy; Esri &​mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
      hybrid: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "&​copy; Esri &​mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    };
    return configs[tipoMapa] || configs.street;
  };

  /**
   * Obtener configuración del tile según tipo de mapa - FONDEO
   */
  const getTileConfigFondeo = () => {
    const configs = {
      street: {
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution:
          '&​copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "&​copy; Esri &​mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
      hybrid: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "&​copy; Esri &​mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    };
    return configs[tipoMapaFondeo] || configs.street;
  };

  /**
   * Obtener color según clasificación de aguas
   */
  const getClasificacionAguasColor = (clasificacion) => {
    if (!clasificacion) return "info";
    if (clasificacion.includes("Territorial")) return "danger";
    if (clasificacion.includes("Exclusiva")) return "success";
    return "info";
  };

  // Normalizar opciones de combos
  const puertosNormalizados = puertos.map((p) => ({
    label: p.nombre || p.label,
    value: Number(p.id || p.value),
  }));

  const clientesNormalizados = clientes.map((c) => ({
    label: c.razonSocial || c.label,
    value: Number(c.id || c.value),
  }));

  const especiesNormalizadas = especies.map((e) => ({
    label: e.nombre || e.label,
    value: Number(e.id || e.value),
  }));

  const katanasTripulacionNormalizadas = katanasTripulacion.map((k) => ({
    label: `${k.rangoInicialTn || 0} - ${k.rangoFinaTn || 0} Tn (${k.kgOtorgadoCalculo || 0
      } Kg)`,
    value: Number(k.id || k.value),
  }));

  // Cargar datos del registro a editar cuando cambie detalle
  useEffect(() => {
    if (detalle) {
      reset({
        faenaPescaConsumoId: detalle.faenaPescaConsumoId
          ? Number(detalle.faenaPescaConsumoId)
          : faenaPescaConsumoId,
        puertoDescargaId: detalle.puertoDescargaId
          ? Number(detalle.puertoDescargaId)
          : null,
        fechaHoraArriboPuerto: detalle.fechaHoraArriboPuerto
          ? new Date(detalle.fechaHoraArriboPuerto)
          : null,
        fechaHoraLlegadaPuerto: detalle.fechaHoraLlegadaPuerto
          ? new Date(detalle.fechaHoraLlegadaPuerto)
          : null,
        clienteId: detalle.clienteId ? Number(detalle.clienteId) : null,
        plataformaRecepcionPescaId: detalle.plataformaRecepcionPescaId ? Number(detalle.plataformaRecepcionPescaId) : null,
        numPlataformaDescarga: detalle.numPlataformaDescarga || "",
        turnoPlataformaDescarga: detalle.turnoPlataformaDescarga || "DIA",
        fechaHoraInicioDescarga: detalle.fechaHoraInicioDescarga
          ? new Date(detalle.fechaHoraInicioDescarga)
          : null,
        fechaHoraFinDescarga: detalle.fechaHoraFinDescarga
          ? new Date(detalle.fechaHoraFinDescarga)
          : null,
        numWinchaPesaje: detalle.numWinchaPesaje || "",
        urlComprobanteWincha: detalle.urlComprobanteWincha || "",
        patronId: detalle.patronId ? Number(detalle.patronId) : patronId,
        motoristaId: detalle.motoristaId
          ? Number(detalle.motoristaId)
          : motoristaId,
        bahiaId: detalle.bahiaId ? Number(detalle.bahiaId) : bahiaId,
        latitud: detalle.latitud || 0,
        longitud: detalle.longitud || 0,
        combustibleAbastecidoGalones: detalle.combustibleAbastecidoGalones || 0,
        urlValeAbastecimiento: detalle.urlValeAbastecimiento || "",
        urlInformeDescargaProduce: detalle.urlInformeDescargaProduce || "",
        movIngresoAlmacenId: detalle.movIngresoAlmacenId
          ? Number(detalle.movIngresoAlmacenId)
          : null,
        observaciones: detalle.observaciones || "",
        especieId: detalle.especieId ? Number(detalle.especieId) : null,
        toneladas: detalle.toneladas ? detalle.toneladas * 1000 : 0, // Convertir toneladas a kilogramos para mostrar
        porcentajeJuveniles: detalle.porcentajeJuveniles || 0,
        fechaHoraFondeo: detalle.fechaHoraFondeo
          ? new Date(detalle.fechaHoraFondeo)
          : null,
        latitudFondeo: detalle.latitudFondeo || 0,
        longitudFondeo: detalle.longitudFondeo || 0,
        puertoFondeoId: detalle.puertoFondeoId
          ? Number(detalle.puertoFondeoId)
          : null,
        nroCubetas: detalle.nroCubetas || 0,
        precioPorKgEspecie: detalle.precioPorKgEspecie || 0,
        precioTotal: detalle.precioTotal || 0,
        katanaTripulacionId: detalle.katanaTripulacionId
          ? Number(detalle.katanaTripulacionId)
          : null,
      });
    } else {
      // Resetear para nuevo registro con valores fijos de faena
      // Cargar coordenadas de última cala como inicio de retorno por defecto
      const cargarCoordenadasUltimaCala = async () => {
        let latitudInicio = 0;
        let longitudInicio = 0;

        if (faenaPescaConsumoId) {
          try {
            const calas = await getCalasFaenaConsumoPorFaena(faenaPescaConsumoId);
            if (calas && calas.length > 0) {
              // Ordenar por fechaHoraFin descendente para obtener la última cala
              const calasOrdenadas = calas.sort((a, b) => {
                if (!a.fechaHoraFin) return 1;
                if (!b.fechaHoraFin) return -1;
                return new Date(b.fechaHoraFin) - new Date(a.fechaHoraFin);
              });

              const ultimaCala = calasOrdenadas[0];

              // Usar latitudFin/longitudFin de la última cala si existen
              if (ultimaCala.latitudFin && ultimaCala.longitudFin) {
                latitudInicio = Number(ultimaCala.latitudFin);
                longitudInicio = Number(ultimaCala.longitudFin);
              }
            }
          } catch (error) {
            console.error("Error al cargar coordenadas de última cala:", error);
            // Continuar con valores por defecto (0, 0)
          }
        }

        reset({
          faenaPescaConsumoId: faenaPescaConsumoId,
          puertoDescargaId: null,
          fechaHoraArriboPuerto: null,
          fechaHoraLlegadaPuerto: null,
          clienteId: null,
          plataformaRecepcionPescaId: null,
          numPlataformaDescarga: "",
          turnoPlataformaDescarga: "",
          fechaHoraInicioDescarga: null,
          fechaHoraFinDescarga: null,
          numWinchaPesaje: "",
          urlComprobanteWincha: "",
          patronId: patronId,
          motoristaId: motoristaId,
          bahiaId: bahiaId,
          latitud: latitudInicio,
          longitud: longitudInicio,
          combustibleAbastecidoGalones: 0,
          urlValeAbastecimiento: "",
          urlInformeDescargaProduce: "",
          observaciones: "",
          movIngresoAlmacenId: null,
          movSalidaAlmacenId: null,
          especieId: null,
          toneladas: 0,
          porcentajeJuveniles: 0,
          fechaHoraFondeo: null,
          latitudFondeo: 0,
          longitudFondeo: 0,
          puertoFondeoId: null,
          nroCubetas: 0,
          precioPorKgEspecie: 0,
          precioTotal: 0,
          katanaTripulacionId: null,
        });

        // Actualizar posición del mapa si hay coordenadas válidas
        if (latitudInicio !== 0 && longitudInicio !== 0) {
          setMapPosition([latitudInicio, longitudInicio]);
          setMapKey((prev) => prev + 1);
        }
      };

      cargarCoordenadasUltimaCala();
    }
  }, [detalle, reset, bahiaId, motoristaId, patronId, faenaPescaConsumoId]);

  /**
   * Cargar plataformas cuando se carga un detalle existente con cliente
   */
  useEffect(() => {
    const clienteIdActual = watch("clienteId");

    if (clienteIdActual && detalle && plataformasRecepcion.length === 0) {
      // Cargar plataformas del cliente cuando se carga el detalle
      const cargarPlataformas = async () => {
        try {
          setLoadingPlataformas(true);
          const plataformas = await obtenerPlataformasPorEntidad(clienteIdActual);
          const plataformasActivas = plataformas.filter(p => p.activo);
          const plataformasOptions = plataformasActivas.map(p => ({
            label: p.nombre,
            value: Number(p.id),
            latitud: p.latitud,
            longitud: p.longitud
          }));
          setPlataformasRecepcion(plataformasOptions);
        } catch (error) {
          console.error("Error al cargar plataformas:", error);
          setPlataformasRecepcion([]);
        } finally {
          setLoadingPlataformas(false);
        }
      };

      cargarPlataformas();
    }
  }, [detalle, watch("clienteId")]); // Ejecutar cuando cambia detalle o clienteId

  // Sincronizar cambios de decimal a DMS para DESCARGA
  useEffect(() => {
    if (
      latitud !== "" &&
      latitud !== null &&
      latitud !== undefined &&
      latitud !== 0
    ) {
      const dms = descomponerDMS(Number(latitud), true);
      setLatGrados(dms.grados);
      setLatMinutos(dms.minutos);
      setLatSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatDireccion(dms.direccion);
    }
  }, [latitud]);

  useEffect(() => {
    if (
      longitud !== "" &&
      longitud !== null &&
      longitud !== undefined &&
      longitud !== 0
    ) {
      const dms = descomponerDMS(Number(longitud), false);
      setLonGrados(dms.grados);
      setLonMinutos(dms.minutos);
      setLonSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonDireccion(dms.direccion);
    }
  }, [longitud]);

  // Actualizar posición del mapa cuando cambian las coordenadas de DESCARGA
  useEffect(() => {
    if (
      latitud !== "" &&
      latitud !== null &&
      latitud !== undefined &&
      latitud !== 0 &&
      longitud !== "" &&
      longitud !== null &&
      longitud !== undefined &&
      longitud !== 0
    ) {
      setMapPosition([Number(latitud), Number(longitud)]);
      setMapKey((prev) => prev + 1);
    }
  }, [latitud, longitud]);

  // Sincronizar cambios de decimal a DMS para FONDEO
  useEffect(() => {
    if (
      latitudFondeo !== "" &&
      latitudFondeo !== null &&
      latitudFondeo !== undefined &&
      latitudFondeo !== 0
    ) {
      const dms = descomponerDMS(Number(latitudFondeo), true);
      setLatFondeoGrados(dms.grados);
      setLatFondeoMinutos(dms.minutos);
      setLatFondeoSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatFondeoDireccion(dms.direccion);
    }
  }, [latitudFondeo]);

  useEffect(() => {
    if (
      longitudFondeo !== "" &&
      longitudFondeo !== null &&
      longitudFondeo !== undefined &&
      longitudFondeo !== 0
    ) {
      const dms = descomponerDMS(Number(longitudFondeo), false);
      setLonFondeoGrados(dms.grados);
      setLonFondeoMinutos(dms.minutos);
      setLonFondeoSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonFondeoDireccion(dms.direccion);
    }
  }, [longitudFondeo]);

  // Actualizar posición del mapa cuando cambian las coordenadas de FONDEO
  useEffect(() => {
    if (
      latitudFondeo !== "" &&
      latitudFondeo !== null &&
      latitudFondeo !== undefined &&
      latitudFondeo !== 0 &&
      longitudFondeo !== "" &&
      longitudFondeo !== null &&
      longitudFondeo !== undefined &&
      longitudFondeo !== 0
    ) {
      setMapPositionFondeo([Number(latitudFondeo), Number(longitudFondeo)]);
      setMapKeyFondeo((prev) => prev + 1);
    }
  }, [latitudFondeo, longitudFondeo]);

  /**
   * useEffect para analizar coordenadas cuando ya existen en el formulario
   * (por ejemplo, al editar una descarga existente)
   */
  useEffect(() => {
    // Solo analizar si hay coordenadas válidas y no estamos ya cargando
    if (latitud && longitud && !loadingGeo) {
      // Verificar que las coordenadas sean diferentes a las ya analizadas
      const coordenadasActuales = `${latitud},${longitud}`;
      const coordenadasAnalizadas = infoGeografica
        ? `${infoGeografica.coordenadas?.latitud},${infoGeografica.coordenadas?.longitud}`
        : null;

      // Solo analizar si son coordenadas nuevas
      if (coordenadasActuales !== coordenadasAnalizadas) {
        const analizarCoordenadasExistentes = async () => {
          setLoadingGeo(true);
          setErrorGeo(null);
          try {
            const puertoSalidaId = getValues("puertoDescargaId");
            const infoGeo = await analizarCoordenadasConReferencia(
              latitud,
              longitud,
              puertoSalidaId || null,
            );
            setInfoGeografica(infoGeo);
          } catch (error) {
            console.error("Error al analizar coordenadas existentes:", error);
            setErrorGeo("No se pudo obtener la información geográfica");
          } finally {
            setLoadingGeo(false);
          }
        };

        analizarCoordenadasExistentes();
      }
    }
  }, [latitud, longitud]);

  /**
   * useEffect para analizar coordenadas de FONDEO cuando ya existen
   */
  useEffect(() => {
    // Solo analizar si hay coordenadas de fondeo válidas y no estamos ya cargando
    if (latitudFondeo && longitudFondeo && !loadingGeoFondeo) {
      // Verificar que las coordenadas sean diferentes a las ya analizadas
      const coordenadasActuales = `${latitudFondeo},${longitudFondeo}`;
      const coordenadasAnalizadas = infoGeograficaFondeo
        ? `${infoGeograficaFondeo.coordenadas?.latitud},${infoGeograficaFondeo.coordenadas?.longitud}`
        : null;

      // Solo analizar si son coordenadas nuevas
      if (coordenadasActuales !== coordenadasAnalizadas) {
        const analizarCoordenadasFondeoExistentes = async () => {
          setLoadingGeoFondeo(true);
          setErrorGeoFondeo(null);
          try {
            const puertoFondeoId = getValues("puertoFondeoId");
            const infoGeo = await analizarCoordenadasConReferencia(
              latitudFondeo,
              longitudFondeo,
              puertoFondeoId || null,
            );
            setInfoGeograficaFondeo(infoGeo);
          } catch (error) {
            console.error(
              "Error al analizar coordenadas de fondeo existentes:",
              error,
            );
            setErrorGeoFondeo(
              "No se pudo obtener la información geográfica de fondeo",
            );
          } finally {
            setLoadingGeoFondeo(false);
          }
        };

        analizarCoordenadasFondeoExistentes();
      }
    }
  }, [latitudFondeo, longitudFondeo]);

  /**
   * useEffect para analizar coordenadas de PLATAFORMA cuando ya existe en el formulario
   */
  useEffect(() => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");

    if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0 && !loadingGeoPlataforma) {
      const plataformaSeleccionada = plataformasRecepcion.find(
        (p) => Number(p.value) === Number(plataformaRecepcionPescaId)
      );

      if (plataformaSeleccionada?.latitud && plataformaSeleccionada?.longitud) {
        const coordenadasActuales = `${plataformaSeleccionada.latitud},${plataformaSeleccionada.longitud}`;
        const coordenadasAnalizadas = infoGeograficaPlataforma
          ? `${infoGeograficaPlataforma.coordenadas?.latitud},${infoGeograficaPlataforma.coordenadas?.longitud}`
          : null;

        if (coordenadasActuales !== coordenadasAnalizadas) {
          const analizarCoordenadasPlataformaExistentes = async () => {
            setLoadingGeoPlataforma(true);
            try {
              const infoGeo = await analizarCoordenadasConReferencia(
                plataformaSeleccionada.latitud,
                plataformaSeleccionada.longitud,
                null
              );
              setInfoGeograficaPlataforma(infoGeo);
            } catch (error) {
              console.error("Error al analizar coordenadas de plataforma:", error);
              setInfoGeograficaPlataforma(null);
            } finally {
              setLoadingGeoPlataforma(false);
            }
          };

          analizarCoordenadasPlataformaExistentes();
        }
      }
    }
  }, [watch("plataformaRecepcionPescaId"), plataformasRecepcion]);

  /**
   * useEffect para cargar datos completos de la embarcación
   */
  useEffect(() => {
    const cargarEmbarcacion = async () => {
      if (!faenaData?.embarcacionId) {
        setEmbarcacionCompleta(null);
        return;
      }

      try {
        const embarcacion = await getEmbarcacionPorId(faenaData.embarcacionId);
        setEmbarcacionCompleta(embarcacion);
      } catch (error) {
        console.error("Error al cargar embarcación:", error);
        setEmbarcacionCompleta(null);
      }
    };

    cargarEmbarcacion();
  }, [faenaData?.embarcacionId]);

  /**
   * useEffect para cargar datos del puerto de salida
   */
  useEffect(() => {
    if (faenaData?.puertoSalidaId && puertos.length > 0) {
      const puerto = puertos.find(
        (p) => Number(p.id) === Number(faenaData.puertoSalidaId)
      );
      setPuertoSalidaDatos(puerto || null);
    }
  }, [faenaData?.puertoSalidaId, puertos]);

  /**
   * useEffect para cargar precio de combustible vigente
   */
  useEffect(() => {
    const cargarPrecioCombustible = async () => {
      if (!temporadaData?.empresa?.entidadComercialId) return;

      try {
        setLoadingPrecioCombustible(true);
        const precio = await getPrecioCombustibleVigente(
          temporadaData.empresa.entidadComercialId
        );

        if (precio) {
          let precioSoles = Number(precio.precio);

          if (precio.moneda?.codigo === "USD" && precio.tipoCambioSunat) {
            precioSoles = precioSoles * Number(precio.tipoCambioSunat);
          }

          setPrecioCombustibleSoles(precioSoles);
        }
      } catch (error) {
        console.error("Error al cargar precio de combustible:", error);
        setPrecioCombustibleSoles(0);
      } finally {
        setLoadingPrecioCombustible(false);
      }
    };

    cargarPrecioCombustible();
  }, [temporadaData?.empresa?.entidadComercialId]);

  /**
   * useEffect para calcular distancia entre inicio retorno y puerto descarga
   */
  useEffect(() => {
    const puertoDescargaId = watch("puertoDescargaId");
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");
    const latitudRetorno = watch("latitud");
    const longitudRetorno = watch("longitud");

    if (latitudRetorno && longitudRetorno && Number(latitudRetorno) !== 0 && Number(longitudRetorno) !== 0) {
      let latitudDestino = null;
      let longitudDestino = null;

      if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0) {
        const plataforma = plataformasRecepcion.find(
          (p) => Number(p.value) === Number(plataformaRecepcionPescaId)
        );

        if (plataforma?.latitud && plataforma?.longitud) {
          latitudDestino = Number(plataforma.latitud);
          longitudDestino = Number(plataforma.longitud);
        }
      }

      if (!latitudDestino && !longitudDestino && puertoDescargaId && puertos.length > 0) {
        const puertoDescarga = puertos.find(
          (p) => Number(p.id) === Number(puertoDescargaId)
        );

        if (puertoDescarga?.latitud && puertoDescarga?.longitud) {
          latitudDestino = Number(puertoDescarga.latitud);
          longitudDestino = Number(puertoDescarga.longitud);
        }
      }

      if (latitudDestino && longitudDestino) {
        const R = 3440.065;
        const dLat = ((latitudDestino - Number(latitudRetorno)) * Math.PI) / 180;
        const dLon = ((longitudDestino - Number(longitudRetorno)) * Math.PI) / 180;
        const lat1Rad = (Number(latitudRetorno) * Math.PI) / 180;
        const lat2Rad = (latitudDestino * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1Rad) *
          Math.cos(lat2Rad) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distancia = R * c;

        setDistanciaRetornoPuerto(distancia);
      } else {
        setDistanciaRetornoPuerto(null);
      }
    } else {
      setDistanciaRetornoPuerto(null);
    }
  }, [watch("puertoDescargaId"), watch("plataformaRecepcionPescaId"), watch("latitud"), watch("longitud"), puertos, plataformasRecepcion]);

  /**
   * useEffect para calcular consumo de combustible Retorno → Puerto
   */
  useEffect(() => {
    if (
      distanciaRetornoPuerto !== null &&
      embarcacionCompleta?.millasNauticasPorGalon
    ) {
      const consumo =
        distanciaRetornoPuerto /
        Number(embarcacionCompleta.millasNauticasPorGalon);
      setConsumoCombustible(consumo);
    } else {
      setConsumoCombustible(null);
    }
  }, [distanciaRetornoPuerto, embarcacionCompleta?.millasNauticasPorGalon]);

  /**
   * useEffect para calcular costo de combustible Retorno → Puerto
   */
  useEffect(() => {
    if (consumoCombustible !== null && precioCombustibleSoles > 0) {
      const costo = consumoCombustible * precioCombustibleSoles;
      setCostoCombustible(costo);
    } else {
      setCostoCombustible(null);
    }
  }, [consumoCombustible, precioCombustibleSoles]);

  /**
   * useEffect para calcular distancia entre puerto descarga y fondeo
   */
  useEffect(() => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");
    const puertoDescargaId = watch("puertoDescargaId");
    const latitudFondeo = watch("latitudFondeo");
    const longitudFondeo = watch("longitudFondeo");

    if (latitudFondeo && longitudFondeo && Number(latitudFondeo) !== 0 && Number(longitudFondeo) !== 0) {
      let latitudPlataforma = null;
      let longitudPlataforma = null;

      if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0) {
        const plataforma = plataformasRecepcion.find(
          (p) => Number(p.value) === Number(plataformaRecepcionPescaId)
        );

        if (plataforma?.latitud && plataforma?.longitud) {
          latitudPlataforma = Number(plataforma.latitud);
          longitudPlataforma = Number(plataforma.longitud);
        }
      }

      if (!latitudPlataforma && !longitudPlataforma && puertoDescargaId && puertos.length > 0) {
        const puertoDescarga = puertos.find(
          (p) => Number(p.id) === Number(puertoDescargaId)
        );

        if (puertoDescarga?.latitud && puertoDescarga?.longitud) {
          latitudPlataforma = Number(puertoDescarga.latitud);
          longitudPlataforma = Number(puertoDescarga.longitud);
        }
      }

      if (latitudPlataforma && longitudPlataforma) {
        const R = 3440.065;
        const dLat = ((Number(latitudFondeo) - latitudPlataforma) * Math.PI) / 180;
        const dLon = ((Number(longitudFondeo) - longitudPlataforma) * Math.PI) / 180;
        const lat1Rad = (latitudPlataforma * Math.PI) / 180;
        const lat2Rad = (Number(latitudFondeo) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1Rad) *
          Math.cos(lat2Rad) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distancia = R * c;

        setDistanciaDescargaFondeo(distancia);
      } else {
        setDistanciaDescargaFondeo(null);
      }
    } else {
      setDistanciaDescargaFondeo(null);
    }
  }, [
    watch("plataformaRecepcionPescaId"),
    watch("puertoDescargaId"),
    watch("latitudFondeo"),
    watch("longitudFondeo"),
    plataformasRecepcion,
    puertos,
  ]);

  /**
   * useEffect para calcular consumo de combustible Descarga → Fondeo
   */
  useEffect(() => {
    if (
      distanciaDescargaFondeo !== null &&
      embarcacionCompleta?.millasNauticasPorGalon
    ) {
      const consumo =
        distanciaDescargaFondeo /
        Number(embarcacionCompleta.millasNauticasPorGalon);
      setConsumoDescargaFondeo(consumo);
    } else {
      setConsumoDescargaFondeo(null);
    }
  }, [distanciaDescargaFondeo, embarcacionCompleta?.millasNauticasPorGalon]);

  /**
   * useEffect para calcular costo de combustible Descarga → Fondeo
   */
  useEffect(() => {
    if (consumoDescargaFondeo !== null && precioCombustibleSoles > 0) {
      const costo = consumoDescargaFondeo * precioCombustibleSoles;
      setCostoDescargaFondeo(costo);
    } else {
      setCostoDescargaFondeo(null);
    }
  }, [consumoDescargaFondeo, precioCombustibleSoles]);

  // Cálculos automáticos al cambiar especie, toneladas, cubetas o precio
  useEffect(() => {
    const realizarCalculos = () => {
      // Solo calcular si hay especie seleccionada
      if (!especieIdWatched) {
        return;
      }

      // 1. Obtener especie seleccionada
      const especieSeleccionada = especies.find(
        (e) => Number(e.id) === Number(especieIdWatched),
      );

      if (!especieSeleccionada) {
        return;
      }

      // 2. Cargar precio por Kg SOLO si cambió la especie
      const especiaCambio = especieAnteriorRef.current !== especieIdWatched;
      if (especiaCambio && especieSeleccionada.precioPorKg) {
        const precioDB = Number(especieSeleccionada.precioPorKg);
        setValue("precioPorKgEspecie", precioDB);
        especieAnteriorRef.current = especieIdWatched;
      }

      const cubetaPesoKg = Number(especieSeleccionada.cubetaPesoKg || 0);

      // 3. Calcular según qué campo cambió (para evitar loops infinitos)
      // Si el usuario cambió kilogramos, calcular cubetas
      if (
        ultimoCambioRef.current === "toneladas" &&
        toneladasWatched &&
        cubetaPesoKg > 0
      ) {
        const nroCubetas = toneladasWatched / cubetaPesoKg;
        setValue("nroCubetas", Number(nroCubetas.toFixed(2)));
        ultimoCambioRef.current = null; // Reset
      }
      // Si el usuario cambió cubetas, calcular kilogramos
      else if (
        ultimoCambioRef.current === "cubetas" &&
        nroCubetasWatched &&
        cubetaPesoKg > 0
      ) {
        const toneladas = nroCubetasWatched * cubetaPesoKg;
        setValue("toneladas", Number(toneladas.toFixed(2)));
        ultimoCambioRef.current = null; // Reset
      }
      // Si cambió la especie, calcular cubetas basado en kilogramos actuales
      else if (especiaCambio && toneladasWatched && cubetaPesoKg > 0) {
        const nroCubetas = toneladasWatched / cubetaPesoKg;
        setValue("nroCubetas", Number(nroCubetas.toFixed(2)));
      }

      // 4. Calcular katana y precio total (SIEMPRE, con o sin katana)
      const kgActuales = Number(toneladasWatched || 0);
      if (kgActuales > 0) {
        // Encontrar katana según rango de toneladas (convertir Kg a Tn)
        const toneladasEnTn = kgActuales / 1000;
        const katanaEncontrada = katanasTripulacion.find((k) => {
          const rangoInicial = Number(k.rangoInicialTn || 0);
          const rangoFinal = Number(k.rangoFinaTn || 0);
          return toneladasEnTn >= rangoInicial && toneladasEnTn <= rangoFinal;
        });

        // Asignar katana si se encontró
        if (katanaEncontrada) {
          setValue("katanaTripulacionId", Number(katanaEncontrada.id));
        } else {
          setValue("katanaTripulacionId", null);
        }

        // CALCULAR PRECIO TOTAL SIEMPRE (con o sin katana)
        const kgOtorgado = katanaEncontrada
          ? Number(katanaEncontrada.kgOtorgadoCalculo || 0)
          : 0;
        const precioPorKg = Number(precioPorKgEspecieWatched || 0);

        if (precioPorKg > 0) {
          const precioTotal = (kgActuales - kgOtorgado) * precioPorKg;
          setValue("precioTotal", Number(precioTotal.toFixed(2)));
        } else {
          setValue("precioTotal", 0);
        }
      } else {
        // Si no hay kilogramos, resetear valores calculados
        setValue("nroCubetas", 0);
        setValue("katanaTripulacionId", null);
        setValue("precioTotal", 0);
      }
    };

    realizarCalculos();
  }, [
    especieIdWatched,
    toneladasWatched,
    nroCubetasWatched,
    precioPorKgEspecieWatched,
    especies,
    katanasTripulacion,
    setValue,
  ]);

  // Funciones para actualizar decimal cuando cambia DMS - DESCARGA
  const actualizarLatitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latGrados,
      latMinutos,
      latSegundos,
      latDireccion,
    );
    setValue("latitud", decimal);
  };

  const actualizarLongitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonGrados,
      lonMinutos,
      lonSegundos,
      lonDireccion,
    );
    setValue("longitud", decimal);
  };

  // Funciones para actualizar decimal cuando cambia DMS - FONDEO
  const actualizarLatitudFondeoDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latFondeoGrados,
      latFondeoMinutos,
      latFondeoSegundos,
      latFondeoDireccion,
    );
    setValue("latitudFondeo", decimal);
  };

  const actualizarLongitudFondeoDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonFondeoGrados,
      lonFondeoMinutos,
      lonFondeoSegundos,
      lonFondeoDireccion,
    );
    setValue("longitudFondeo", decimal);
  };

  /**
* Componente de marker draggable para el mapa de DESCARGA
* 🔵 AZUL - Representa el INICIO DE RETORNO (coordenadas donde inicia el viaje hacia puerto)
*/
  const DraggableMarker = () => {
    const markerRef = useRef(null);

    const eventHandlers = {
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setValue("latitud", lat);
          setValue("longitud", lng);
          setMapPosition([lat, lng]);
        }
      },
    };

    // Icono AZUL para Inicio de Retorno
    const iconInicioRetorno = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    return (
      <Marker
        position={mapPosition}
        draggable={!loading}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={iconInicioRetorno}
      >
        <Popup>
          <strong>🔵 Inicio de Retorno</strong>
          <br />
          Coordenadas donde inicia el viaje hacia puerto
          <br />
          Lat: {Number(latitud).toFixed(6)}
          <br />
          Lon: {Number(longitud).toFixed(6)}
        </Popup>
      </Marker>
    );
  };

  /**
 * Componente de marker fijo para mostrar la plataforma de recepción
 * 🔴 ROJO - Muestra la ubicación de la plataforma de recepción donde se descarga
 * SOLO muestra la plataforma de recepción (NO el puerto de descarga)
 */
  const MarkerPuertoDescarga = () => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");

    // Solo mostrar si hay plataforma seleccionada
    if (!plataformaRecepcionPescaId || !plataformasRecepcion.length) return null;

    const plataforma = plataformasRecepcion.find(
      (p) => Number(p.value) === Number(plataformaRecepcionPescaId),
    );

    if (!plataforma?.latitud || !plataforma?.longitud) return null;

    const iconPlataforma = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    return (
      <Marker
        position={[
          Number(plataforma.latitud),
          Number(plataforma.longitud),
        ]}
        icon={iconPlataforma}
      >
        <Popup>
          <strong>🔴 {plataforma.label}</strong>
          <br />
          Plataforma de Recepción
          <br />
          Lat: {Number(plataforma.latitud).toFixed(6)}
          <br />
          Lon: {Number(plataforma.longitud).toFixed(6)}
        </Popup>
      </Marker>
    );
  };

    /**
   * Componente de marker draggable para el mapa de FONDEO
   * 🟠 NARANJA - Representa el punto de FONDEO
   */
  const DraggableMarkerFondeo = () => {
    const markerRef = useRef(null);
    const nombrePuerto = watch("puertoFondeoId")
      ? puertos.find((p) => Number(p.id) === Number(watch("puertoFondeoId")))
        ?.nombre || "Puerto"
      : "Fondeo";

    const iconoNaranja = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const eventHandlers = {
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setValue("latitudFondeo", lat);
          setValue("longitudFondeo", lng);
          setMapPositionFondeo([lat, lng]);
        }
      },
    };

    return (
      <Marker
        position={mapPositionFondeo}
        draggable={!loading}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={iconoNaranja}
      >
        <Popup>
          <strong>Fondeo: {nombrePuerto}</strong>
          <br />
          Lat: {Number(latitudFondeo).toFixed(6)}
          <br />
          Lon: {Number(longitudFondeo).toFixed(6)}
        </Popup>
      </Marker>
    );
  };

  /**
   * Manejar cambio de cliente
   * Carga las plataformas de recepción asociadas al cliente seleccionado
   */
  const handleClienteChange = async (clienteId) => {
    setValue("clienteId", clienteId);
    setValue("plataformaRecepcionPescaId", null);

    if (clienteId) {
      try {
        setLoadingPlataformas(true);
        const plataformas = await obtenerPlataformasPorEntidad(clienteId);
        const plataformasActivas = plataformas.filter(p => p.activo);
        const plataformasOptions = plataformasActivas.map(p => ({
          label: p.nombre,
          value: Number(p.id),
          latitud: p.latitud,
          longitud: p.longitud
        }));
        setPlataformasRecepcion(plataformasOptions);
      } catch (error) {
        console.error("Error al cargar plataformas:", error);
        setPlataformasRecepcion([]);
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No se pudieron cargar las plataformas de recepción",
          life: 3000,
        });
      } finally {
        setLoadingPlataformas(false);
      }
    } else {
      setPlataformasRecepcion([]);
    }
  };

  /**
   * Manejar cambio de plataforma de recepción
   * Auto-asigna las coordenadas de la plataforma seleccionada y su nombre
   */
  const handlePlataformaChange = (plataformaId) => {
    setValue("plataformaRecepcionPescaId", plataformaId);

    if (plataformaId) {
      const plataformaSeleccionada = plataformasRecepcion.find(
        (p) => Number(p.value) === Number(plataformaId),
      );

      if (plataformaSeleccionada) {
        // Asignar nombre de la plataforma al campo numPlataformaDescarga
        setValue("numPlataformaDescarga", plataformaSeleccionada.label);

        // ✅ NO asignar coordenadas a latitud/longitud
        // Esos campos son para INICIO DE RETORNO, no para la plataforma
        // La plataforma se marca en el mapa usando sus propias coordenadas desde plataformasRecepcion
      }
    }
  };

  /**
   * Maneja el guardado del formulario
   */
  const handleGuardar = async () => {
    // Obtener datos del formulario manualmente
    const data = getValues();

    try {
      setLoading(true);

      const payload = {
        faenaPescaConsumoId: data.faenaPescaConsumoId
          ? Number(data.faenaPescaConsumoId)
          : null,
        puertoDescargaId: data.puertoDescargaId
          ? Number(data.puertoDescargaId)
          : null,
        fechaHoraArriboPuerto: data.fechaHoraArriboPuerto
          ? data.fechaHoraArriboPuerto.toISOString()
          : null,
        fechaHoraLlegadaPuerto: data.fechaHoraLlegadaPuerto
          ? data.fechaHoraLlegadaPuerto.toISOString()
          : null,
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        plataformaRecepcionPescaId: data.plataformaRecepcionPescaId
          ? Number(data.plataformaRecepcionPescaId)
          : null,
        numPlataformaDescarga: data.numPlataformaDescarga?.trim() || null,
        turnoPlataformaDescarga: data.turnoPlataformaDescarga?.trim() || null,
        fechaHoraInicioDescarga: data.fechaHoraInicioDescarga
          ? data.fechaHoraInicioDescarga.toISOString()
          : null,
        fechaHoraFinDescarga: data.fechaHoraFinDescarga
          ? data.fechaHoraFinDescarga.toISOString()
          : null,
        numWinchaPesaje: data.numWinchaPesaje?.trim() || null,
        urlComprobanteWincha: data.urlComprobanteWincha?.trim() || null,
        patronId: data.patronId ? Number(data.patronId) : null,
        motoristaId: data.motoristaId ? Number(data.motoristaId) : null,
        bahiaId: data.bahiaId ? Number(data.bahiaId) : null,
        latitud: data.latitud || 0,
        longitud: data.longitud || 0,
        combustibleAbastecidoGalones: data.combustibleAbastecidoGalones || 0,
        urlValeAbastecimiento: data.urlValeAbastecimiento?.trim() || null,
        urlInformeDescargaProduce:
          data.urlInformeDescargaProduce?.trim() || null,
        movIngresoAlmacenId: data.movIngresoAlmacenId
          ? Number(data.movIngresoAlmacenId)
          : null,
        observaciones: data.observaciones?.trim() || null,
        especieId: data.especieId ? Number(data.especieId) : null,
        toneladas: data.toneladas ? Number(data.toneladas) / 1000 : 0, // Convertir kilogramos a toneladas para guardar
        porcentajeJuveniles: 0,
        fechaHoraFondeo: data.fechaHoraFondeo
          ? data.fechaHoraFondeo.toISOString()
          : null,
        latitudFondeo: data.latitudFondeo || 0,
        longitudFondeo: data.longitudFondeo || 0,
        puertoFondeoId: data.puertoFondeoId
          ? Number(data.puertoFondeoId)
          : null,
        nroCubetas: data.nroCubetas || 0,
        precioPorKgEspecie: data.precioPorKgEspecie || 0,
        precioTotal: data.precioTotal || 0,
        katanaTripulacionId: data.katanaTripulacionId
          ? Number(data.katanaTripulacionId)
          : null,
      };

      // 1. Guardar la descarga
      if (detalle?.id) {
        await actualizarDescargaFaenaConsumo(detalle.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearDescargaFaenaConsumo(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga creada correctamente",
          life: 3000,
        });
      }

      onGuardadoExitoso?.();
    } catch (error) {
      console.error("Error al guardar descarga:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar la descarga",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toast = useRef(null);

  /**
   * Maneja la finalización de descarga con generación de movimientos de almacén
   */
  const handleFinalizarDescarga = () => {
    // Prevenir si ya está procesando
    if (finalizandoDescarga) {
      return;
    }

    // Validar que la descarga esté guardada
    if (!detalle?.id) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la descarga antes de finalizarla",
        life: 4000,
      });
      return;
    }

    // Validar que exista novedadPescaConsumoId
    if (!novedadPescaConsumoId) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se encontró la novedad de pesca consumo asociada",
        life: 4000,
      });
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de finalizar esta descarga? Esta acción generará automáticamente los movimientos de almacén (ingreso y salida) con sus respectivos kardex y PreFactura.",
      header: "Confirmar Finalización de Descarga",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-info",
      rejectClassName: "p-button-secondary",
      acceptLabel: "Sí, Finalizar y Generar Movimientos",
      rejectLabel: "Cancelar",
      accept: async () => {
        setFinalizandoDescarga(true);

        try {
          // Mostrar mensaje de inicio
          toast.current?.show({
            severity: "info",
            summary: "Procesando",
            detail: "Generando movimientos de almacén y PreFactura...",
            life: 3000,
          });

          // Llamar al backend para finalizar y generar movimientos de almacén
          const resultado = await finalizarDescargaConsumoConMovimientos(
            detalle.id,
            novedadPescaConsumoId,
          );

          // Mostrar mensaje de éxito con detalles
          const mensajeDetalle = resultado.preFactura
            ? `Movimientos generados: Ingreso (${resultado.movimientoIngreso.numeroDocumento}) y Salida (${resultado.movimientoSalida.numeroDocumento}). PreFactura: ${resultado.preFactura.codigo}`
            : `Movimientos generados: Ingreso (${resultado.movimientoIngreso.numeroDocumento}) y Salida (${resultado.movimientoSalida.numeroDocumento})`;

          toast.current?.show({
            severity: "success",
            summary: "Descarga Finalizada",
            detail: mensajeDetalle,
            life: 6000,
          });

          // Notificar al padre para refrescar datos
          if (onGuardadoExitoso) {
            onGuardadoExitoso(resultado);
          }
        } catch (error) {
          console.error("Error al finalizar descarga:", error);
          const mensajeError =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Error al finalizar la descarga";
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: mensajeError,
            life: 5000,
          });
        } finally {
          setFinalizandoDescarga(false);
        }
      },
    });
  };

  /**
   * Maneja la captura de GPS usando las funciones genéricas
   */
  const handleCapturarGPS = async () => {
    try {
      await capturarGPS(
        async (latitude, longitude, accuracy) => {
          // Callback de éxito
          setValue("latitud", latitude);
          setValue("longitud", longitude);

          toast.current?.show({
            severity: "success",
            summary: "GPS capturado",
            detail: `GPS capturado con precisión de ${accuracy.toFixed(1)}m`,
            life: 3000,
          });

          // Analizar coordenadas para obtener información geográfica
          setLoadingGeo(true);
          setErrorGeo(null);
          try {
            const puertoSalidaId = getValues("puertoDescargaId");
            const infoGeo = await analizarCoordenadasConReferencia(
              latitude,
              longitude,
              puertoSalidaId || null,
            );
            setInfoGeografica(infoGeo);

            toast.current?.show({
              severity: "info",
              summary: "Información geográfica obtenida",
              detail: `Ubicación: ${infoGeo.ubicacion?.ciudad || "N/A"}`,
              life: 3000,
            });
          } catch (error) {
            console.error("Error al analizar coordenadas:", error);
            setErrorGeo("No se pudo obtener la información geográfica");
            toast.current?.show({
              severity: "warn",
              summary: "Advertencia",
              detail:
                "GPS capturado pero no se pudo obtener información geográfica",
              life: 3000,
            });
          } finally {
            setLoadingGeo(false);
          }
        },
        (errorMessage) => {
          // Callback de error
          toast.current?.show({
            severity: "error",
            summary: "Error GPS",
            detail: errorMessage,
            life: 3000,
          });
        },
      );
    } catch (error) {
      console.error("Error capturando GPS:", error);
    }
  };

  const handleCapturarGPSFondeo = async () => {
    try {
      await capturarGPS(
        async (latitude, longitude, accuracy) => {
          // Callback de éxito
          setValue("latitudFondeo", latitude);
          setValue("longitudFondeo", longitude);

          toast.current?.show({
            severity: "success",
            summary: "GPS Fondeo capturado",
            detail: `GPS Fondeo capturado con precisión de ${accuracy.toFixed(
              1,
            )}m`,
            life: 3000,
          });

          // Analizar coordenadas de fondeo para obtener información geográfica
          setLoadingGeoFondeo(true);
          setErrorGeoFondeo(null);
          try {
            const puertoFondeoId = getValues("puertoFondeoId");
            const infoGeo = await analizarCoordenadasConReferencia(
              latitude,
              longitude,
              puertoFondeoId || null,
            );
            setInfoGeograficaFondeo(infoGeo);

            toast.current?.show({
              severity: "info",
              summary: "Información geográfica de fondeo obtenida",
              detail: `Ubicación: ${infoGeo.ubicacion?.ciudad || "N/A"}`,
              life: 3000,
            });
          } catch (error) {
            console.error("Error al analizar coordenadas de fondeo:", error);
            setErrorGeoFondeo(
              "No se pudo obtener la información geográfica de fondeo",
            );
            toast.current?.show({
              severity: "warn",
              summary: "Advertencia",
              detail:
                "GPS Fondeo capturado pero no se pudo obtener información geográfica",
              life: 3000,
            });
          } finally {
            setLoadingGeoFondeo(false);
          }
        },
        (errorMessage) => {
          // Callback de error
          toast.current?.show({
            severity: "error",
            summary: "Error GPS Fondeo",
            detail: errorMessage,
            life: 3000,
          });
        },
      );
    } catch (error) {
      console.error("Error capturando GPS Fondeo:", error);
    }
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <TabView>
        {/* TAB 1: DATOS DE DESCARGA */}
        <TabPanel header="📋 Datos de Descarga">
          {/* Primera fila: Datos básicos */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              marginBottom: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="puertoDescargaId">Puerto Descarga*</label>
              <Controller
                name="puertoDescargaId"
                control={control}
                rules={{ required: "El puerto de descarga es obligatorio" }}
                render={({ field }) => (
                  <Dropdown
                    id="puertoDescargaId"
                    {...field}
                    value={field.value}
                    options={puertosNormalizados}
                    optionLabel="label"
                    optionValue="value"
                    style={{ fontWeight: "bold" }}
                    placeholder="Seleccione puerto"
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.puertoDescargaId })}
                  />
                )}
              />
              {errors.puertoDescargaId && (
                <Message severity="error" text={errors.puertoDescargaId.message} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Retorno a Puerto"
                icon="pi pi-clock"
                className="p-button-info"
                onClick={() => setValue("fechaHoraArriboPuerto", new Date())}
                disabled={loading}
                severity="info"
                raised
                size="small"
                style={{ marginTop: "5px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraArriboPuerto" style={{ color: "#2c32d3" }}>
                Retorno a Puerto*
              </label>
              <Controller
                name="fechaHoraArriboPuerto"
                control={control}
                rules={{ required: "La fecha de arribo es obligatoria" }}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraArriboPuerto"
                    {...field}
                    showIcon
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    inputStyle={{ fontWeight: "bold", color: "#2c32d3" }}
                    disabled={loading}
                    className={classNames({
                      "p-invalid": errors.fechaHoraArriboPuerto,
                    })}
                  />
                )}
              />
              {errors.fechaHoraArriboPuerto && (
                <Message
                  severity="error"
                  text={errors.fechaHoraArriboPuerto.message}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Arribo a Puerto"
                icon="pi pi-clock"
                className="p-button-info"
                onClick={() => setValue("fechaHoraLlegadaPuerto", new Date())}
                disabled={loading}
                severity="info"
                raised
                size="small"
                style={{ marginTop: "5px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraLlegadaPuerto" style={{ color: "#2c32d3" }}>
                Arribo a Puerto*
              </label>
              <Controller
                name="fechaHoraLlegadaPuerto"
                control={control}
                rules={{ required: "La fecha de llegada es obligatoria" }}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraLlegadaPuerto"
                    {...field}
                    showIcon
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    inputStyle={{ fontWeight: "bold", color: "#2c32d3" }}
                    disabled={loading}
                    className={classNames({
                      "p-invalid": errors.fechaHoraLlegadaPuerto,
                    })}
                  />
                )}
              />
              {errors.fechaHoraLlegadaPuerto && (
                <Message
                  severity="error"
                  text={errors.fechaHoraLlegadaPuerto.message}
                />
              )}
            </div>
          </div>
          {/* Cuarta fila: Coordenadas GPS */}
          <div
            style={{
              border: "6px solid #0EA5E9",
              padding: "0.5rem",
              borderRadius: "8px",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "self-end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
                       <PuntoGPSInput
              latitud={latitud}
              longitud={longitud}
              onLatitudChange={(valor) => setValue("latitud", valor)}
              onLongitudChange={(valor) => setValue("longitud", valor)}
              onCapturarGPS={async () => {
                try {
                  await capturarGPS(
                    async (latitude, longitude, accuracy) => {
                      setValue("latitud", latitude);
                      setValue("longitud", longitude);

                      toast.current?.show({
                        severity: "success",
                        summary: "GPS capturado",
                        detail: `GPS capturado con precisión de ${accuracy.toFixed(1)}m`,
                        life: 3000,
                      });

                      setLoadingGeo(true);
                      setErrorGeo(null);
                      try {
                        const puertoSalidaId = getValues("puertoDescargaId");
                        const infoGeo = await analizarCoordenadasConReferencia(
                          latitude,
                          longitude,
                          puertoSalidaId || null
                        );
                        setInfoGeografica(infoGeo);

                        toast.current?.show({
                          severity: "info",
                          summary: "Información geográfica obtenida",
                          detail: `Ubicación: ${infoGeo.ubicacion?.ciudad || "N/A"}`,
                          life: 3000,
                        });
                      } catch (error) {
                        console.error("Error al analizar coordenadas:", error);
                        setErrorGeo("No se pudo obtener la información geográfica");
                        toast.current?.show({
                          severity: "warn",
                          summary: "Advertencia",
                          detail: "GPS capturado pero no se pudo obtener información geográfica",
                          life: 3000,
                        });
                      } finally {
                        setLoadingGeo(false);
                      }
                    },
                    (errorMessage) => {
                      toast.current?.show({
                        severity: "error",
                        summary: "Error GPS",
                        detail: errorMessage,
                        life: 3000,
                      });
                    }
                  );
                } catch (error) {
                  console.error("Error capturando GPS:", error);
                }
              }}
              readOnly={false}
              disabled={loading}
              loading={loading}
              labelBotonGPS="🔵 Capturar GPS Inicio Retorno"
              colorBoton="info"
            />
          </div>

                  {/* MAPA UNIFICADO CON MODO MÚLTIPLE */}
          <PanelMapaGeografico
            mapPosition={mapPosition}
            mapKey={mapKey}
            tipoMapa={tipoMapa}
            getTileConfig={getTileConfig}
            toggleFullscreen={toggleFullscreen}
            cambiarTipoMapa={cambiarTipoMapa}
            obtenerUbicacionUsuario={obtenerUbicacionUsuario}
            mapContainerRef={mapContainerRef}
            mapaFullscreen={mapaFullscreen}
            getClasificacionAguasColor={getClasificacionAguasColor}
            titulo="📍 Información Geográfica"
            colapsadoPorDefecto={true}
            usarModoMultiple={true}
            infoInicioRetorno={infoGeografica}
            infoPlataforma={infoGeograficaPlataforma}
            infoFondeo={infoGeograficaFondeo}
            loadingInicioRetorno={loadingGeo}
            loadingPlataforma={loadingGeoPlataforma}
            loadingFondeo={loadingGeoFondeo}
            distanciaRetornoPuerto={distanciaRetornoPuerto}
            consumoRetornoPuerto={consumoCombustible}
            costoRetornoPuerto={costoCombustible}
            distanciaDescargaFondeo={distanciaDescargaFondeo}
            consumoDescargaFondeo={consumoDescargaFondeo}
            costoDescargaFondeo={costoDescargaFondeo}
            loadingRetornoPuerto={false}
            loadingDescargaFondeo={false}
            zoom={9}
          >
            <LineaRetornoPlataforma />
            <MarkerPuertoDescarga />
            <DraggableMarker />
            <DraggableMarkerFondeo />
            <UserLocationMarker />
            <DistanceLine />
          </PanelMapaGeografico>

          {/* Segunda fila: Fechas y horas */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor="clienteId">Cliente*</label>
              <Controller
                name="clienteId"
                control={control}
                rules={{ required: "El cliente es obligatorio" }}
                render={({ field }) => (
                  <Dropdown
                    id="clienteId"
                    {...field}
                    value={field.value}
                    options={clientesNormalizados}
                    filter
                    optionLabel="label"
                    optionValue="value"
                    style={{ fontWeight: "bold" }}
                    placeholder="Seleccione cliente"
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.clienteId })}
                    onChange={(e) => handleClienteChange(e.value)}
                  />
                )}
              />
              {errors.clienteId && (
                <Message severity="error" text={errors.clienteId.message} />
              )}
            </div>

            <div style={{ flex: 2 }}>
              <label htmlFor="plataformaRecepcionPescaId">
                Plataforma de Recepción
              </label>
              <Controller
                name="plataformaRecepcionPescaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="plataformaRecepcionPescaId"
                    {...field}
                    value={field.value}
                    options={plataformasRecepcion}
                    filter
                    optionLabel="label"
                    optionValue="value"
                    placeholder={
                      loadingPlataformas
                        ? "Cargando plataformas..."
                        : watch("clienteId")
                          ? "Seleccione plataforma"
                          : "Primero seleccione un cliente"
                    }
                    disabled={loading || loadingPlataformas || !watch("clienteId")}
                    style={{ fontWeight: "bold" }}
                    onChange={(e) => handlePlataformaChange(e.value)}
                    className={classNames({
                      "p-invalid": errors.plataformaRecepcionPescaId,
                    })}
                  />
                )}
              />
              {errors.plataformaRecepcionPescaId && (
                <Message
                  severity="error"
                  text={errors.plataformaRecepcionPescaId.message}
                />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="numPlataformaDescarga">Número Plataforma Descarga</label>
              <Controller
                name="numPlataformaDescarga"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numPlataformaDescarga"
                    {...field}
                    placeholder="Número plataforma"
                    disabled={loading}
                    style={{ fontWeight: "bold" }}
                    maxLength={20}
                  />
                )}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="turnoPlataformaDescarga">Turno</label>
              <Controller
                name="turnoPlataformaDescarga"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="turnoPlataformaDescarga"
                    {...field}
                    value={field.value || "DIA"}
                    options={[
                      { label: "DIA", value: "DIA" },
                      { label: "NOCHE", value: "NOCHE" },
                    ]}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione turno"
                    disabled={loading}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="combustibleAbastecidoGalones">Combustible*</label>
              <Controller
                name="combustibleAbastecidoGalones"
                control={control}
                rules={{ required: "El combustible es obligatorio" }}
                render={({ field }) => (
                  <InputNumber
                    id="combustibleAbastecidoGalones"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" Gal"
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={loading}
                    className={classNames({
                      "p-invalid": errors.combustibleAbastecidoGalones,
                    })}
                  />
                )}
              />
              {errors.combustibleAbastecidoGalones && (
                <Message
                  severity="error"
                  text={errors.combustibleAbastecidoGalones.message}
                />
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              marginBottom: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Inicia Descarga"
                icon="pi pi-clock"
                className="p-button-success"
                onClick={() => setValue("fechaHoraInicioDescarga", new Date())}
                disabled={loading}
                severity="success"
                raised
                size="small"
                style={{ marginTop: "5px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraInicioDescarga" style={{ color: "#21962e" }}>
                Inicio Descarga*
              </label>
              <Controller
                name="fechaHoraInicioDescarga"
                control={control}
                rules={{ required: "La fecha de inicio es obligatoria" }}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraInicioDescarga"
                    {...field}
                    showIcon
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    inputStyle={{ fontWeight: "bold", color: "#21962e" }}
                    disabled={loading}
                    className={classNames({
                      "p-invalid": errors.fechaHoraInicioDescarga,
                    })}
                  />
                )}
              />
              {errors.fechaHoraInicioDescarga && (
                <Message
                  severity="error"
                  text={errors.fechaHoraInicioDescarga.message}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Fin Descarga"
                icon="pi pi-clock"
                className="p-button-success"
                onClick={() => setValue("fechaHoraFinDescarga", new Date())}
                disabled={loading}
                size="small"
                severity="success"
                raised
                style={{ marginTop: "5px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraFinDescarga" style={{ color: "#21962e" }}>
                Fin Descarga*
              </label>
              <Controller
                name="fechaHoraFinDescarga"
                control={control}
                rules={{ required: "La fecha de fin es obligatoria" }}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraFinDescarga"
                    {...field}
                    showIcon
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    inputStyle={{ fontWeight: "bold", color: "#21962e" }}
                    disabled={loading}
                    className={classNames({
                      "p-invalid": errors.fechaHoraFinDescarga,
                    })}
                  />
                )}
              />
              {errors.fechaHoraFinDescarga && (
                <Message
                  severity="error"
                  text={errors.fechaHoraFinDescarga.message}
                />
              )}
            </div>
          </div>

          {/* Tercera fila: Datos numéricos */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          ></div>

          {/* Quinta fila: Especie */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="especieId">Especie*</label>
              <Controller
                name="especieId"
                control={control}
                rules={{ required: "La especie es obligatoria" }}
                render={({ field }) => (
                  <Dropdown
                    id="especieId"
                    {...field}
                    value={field.value}
                    options={especiesNormalizadas}
                    optionLabel="label"
                    optionValue="value"
                    filter
                    style={{ fontWeight: "bold" }}
                    placeholder="Seleccione especie"
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.especieId })}
                  />
                )}
              />
              {errors.especieId && (
                <Message severity="error" text={errors.especieId.message} />
              )}
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="toneladas">Kilogramos*</label>
              <Controller
                name="toneladas"
                control={control}
                rules={{ required: "Los kilogramos son obligatorios" }}
                render={({ field }) => (
                  <InputNumber
                    id="toneladas"
                    value={field.value}
                    onValueChange={(e) => {
                      field.onChange(e.value);
                      ultimoCambioRef.current = "toneladas";
                    }}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={3}
                    suffix=" Kg"
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.toneladas })}
                  />
                )}
              />
              {errors.toneladas && (
                <Message severity="error" text={errors.toneladas.message} />
              )}
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="nroCubetas"># Cubetas</label>
              <Controller
                name="nroCubetas"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="nroCubetas"
                    value={field.value}
                    onValueChange={(e) => {
                      field.onChange(e.value);
                      ultimoCambioRef.current = "cubetas";
                    }}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    min={0}
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.nroCubetas })}
                  />
                )}
              />
              {errors.nroCubetas && (
                <Message severity="error" text={errors.nroCubetas.message} />
              )}
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="precioPorKgEspecie">Precio Kg</label>
              <Controller
                name="precioPorKgEspecie"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioPorKgEspecie"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="S/ "
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={loading}
                    className={classNames({
                      "p-invalid": errors.precioPorKgEspecie,
                    })}
                  />
                )}
              />
              {errors.precioPorKgEspecie && (
                <Message
                  severity="error"
                  text={errors.precioPorKgEspecie.message}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="precioTotal">Precio Total</label>
              <Controller
                name="precioTotal"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioTotal"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    prefix="S/ "
                    inputStyle={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    disabled={true}
                    className={classNames({ "p-invalid": errors.precioTotal })}
                  />
                )}
              />
              {errors.precioTotal && (
                <Message severity="error" text={errors.precioTotal.message} />
              )}
            </div>
            <div style={{ flex: 1.5 }}>
              <label htmlFor="katanaTripulacionId">Katana Tripulación</label>
              <Controller
                name="katanaTripulacionId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="katanaTripulacionId"
                    value={field.value}
                    options={katanasTripulacionNormalizadas}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccionado automáticamente"
                    filter
                    showClear
                    disabled={true}
                    style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                    className={classNames({
                      "p-invalid": errors.katanaTripulacionId,
                    })}
                  />
                )}
              />
              {errors.katanaTripulacionId && (
                <Message
                  severity="error"
                  text={errors.katanaTripulacionId.message}
                />
              )}
            </div>
          </div>
          {/* Fila: Katana Tripulación */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          ></div>

          {/* Fila: Observaciones */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor="observaciones">Observaciones</label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    {...field}
                    rows={1}
                    placeholder="Observaciones adicionales"
                    style={{
                      fontWeight: "bold",
                      color: "red",
                      fontStyle: "italic",
                      textTransform: "uppercase",
                    }}
                    disabled={loading}
                  />
                )}
              />
            </div>
          </div>
          {/* Quinta fila: Coordenadas GPS Fondeo */}
          <div
            style={{
              border: "6px solid #ff9800",
              padding: "0.5rem",
              borderRadius: "8px",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "self-end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Fecha Hora Fondeo"
                icon="pi pi-clock"
                className="p-button-warning"
                onClick={() => setValue("fechaHoraFondeo", new Date())}
                disabled={loading}
                size="small"
                severity="warning"
                raised
                style={{ width: "100%", marginBottom: "4px" }}
              />
              <Controller
                name="fechaHoraFondeo"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraFondeo"
                    {...field}
                    showIcon
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.fechaHoraFondeo })}
                    style={{ width: "100%" }}
                  />
                )}
              />
              {errors.fechaHoraFondeo && (
                <Message severity="error" text={errors.fechaHoraFondeo.message} />
              )}
            </div>

                       <PuntoGPSInput
              latitud={latitudFondeo}
              longitud={longitudFondeo}
              onLatitudChange={(valor) => setValue("latitudFondeo", valor)}
              onLongitudChange={(valor) => setValue("longitudFondeo", valor)}
              onCapturarGPS={async () => {
                try {
                  await capturarGPS(
                    async (latitude, longitude, accuracy) => {
                      setValue("latitudFondeo", latitude);
                      setValue("longitudFondeo", longitude);

                      toast.current?.show({
                        severity: "success",
                        summary: "GPS Fondeo capturado",
                        detail: `GPS capturado con precisión de ${accuracy.toFixed(1)}m`,
                        life: 3000,
                      });

                      setLoadingGeoFondeo(true);
                      setErrorGeoFondeo(null);
                      try {
                        const puertoFondeoId = getValues("puertoFondeoId");
                        const infoGeo = await analizarCoordenadasConReferencia(
                          latitude,
                          longitude,
                          puertoFondeoId || null
                        );
                        setInfoGeograficaFondeo(infoGeo);

                        toast.current?.show({
                          severity: "info",
                          summary: "Información geográfica obtenida",
                          detail: `Ubicación: ${infoGeo.ubicacion?.ciudad || "N/A"}`,
                          life: 3000,
                        });
                      } catch (error) {
                        console.error("Error al analizar coordenadas fondeo:", error);
                        setErrorGeoFondeo("No se pudo obtener la información geográfica");
                        toast.current?.show({
                          severity: "warn",
                          summary: "Advertencia",
                          detail: "GPS capturado pero no se pudo obtener información geográfica",
                          life: 3000,
                        });
                      } finally {
                        setLoadingGeoFondeo(false);
                      }
                    },
                    (errorMessage) => {
                      toast.current?.show({
                        severity: "error",
                        summary: "Error GPS",
                        detail: errorMessage,
                        life: 3000,
                      });
                    }
                  );
                } catch (error) {
                  console.error("Error capturando GPS Fondeo:", error);
                }
              }}
              readOnly={false}
              disabled={loading}
              loading={loading}
              labelBotonGPS="🟠 Capturar GPS Fondeo"
              colorBoton="warning"
            />

            <div style={{ flex: 1, marginTop: "0.5rem" }}>
              <label htmlFor="puertoFondeoId">Puerto Fondeo</label>
              <Controller
                name="puertoFondeoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="puertoFondeoId"
                    {...field}
                    value={field.value}
                    options={puertosNormalizados}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Puerto Fondeo"
                    filter
                    disabled={loading}
                  />
                )}
              />
              {errors.puertoFondeoId && (
                <Message severity="error" text={errors.puertoFondeoId.message} />
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 18,
            }}
          >
            {/* Botón Finalizar Descarga - Lado izquierdo */}
            <Button
              type="button"
              label={finalizandoDescarga ? "Finalizando..." : "Finalizar Descarga"}
              icon={
                finalizandoDescarga ? "pi pi-spin pi-spinner" : "pi pi-check-circle"
              }
              severity="info"
              onClick={handleFinalizarDescarga}
              disabled={!detalle?.id || loading || finalizandoDescarga}
              loading={finalizandoDescarga}
              raised
              size="small"
              tooltip={
                !detalle?.id
                  ? "Debe guardar la descarga antes de finalizarla"
                  : "Finalizar descarga y generar movimientos de almacén"
              }
              tooltipOptions={{ position: "top" }}
            />

            {/* Botones Cancelar y Guardar - Lado derecho */}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="button"
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-warning"
                onClick={onCancelar}
                disabled={loading}
                severity="warning"
                raised
                size="small"
              />
              <Button
                onClick={handleGuardar}
                label={detalle?.id ? "Actualizar" : "Guardar"}
                icon="pi pi-check"
                loading={loading}
                className="p-button-success"
                severity="success"
                raised
                size="small"
              />
            </div>
          </div>
        </TabPanel>

        {/* TAB 2: COMPROBANTE WINCHA PDF */}
        <TabPanel header="📄 Comprobante Wincha">
          <PDFDocumentManager
            pdfUrl={detalle?.urlComprobanteWincha}
            pdfType="descargaFaenaConsumoPDF"
            recordId={detalle?.id}
            onUploadSuccess={(url) => {
              toast.current?.show({
                severity: "success",
                summary: "PDF Cargado",
                detail: "Comprobante de wincha actualizado correctamente",
                life: 3000,
              });
            }}
          />
        </TabPanel>
      </TabView>
    </div>
  );
}
