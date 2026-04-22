// src/components/descargaFaenaPesca/DescargaFaenaPescaForm.jsx
// Formulario profesional para DescargaFaenaPesca - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { formatearNumero } from "../../utils/utils";
import {
  crearDescargaFaenaPesca,
  actualizarDescargaFaenaPesca,
  finalizarDescargaConMovimientos,
} from "../../api/descargaFaenaPesca";
import { obtenerPlataformasPorEntidad } from "../../api/detPlataformaRecepcionPesca";
import { getCalasPorFaena } from "../../api/cala";
import { confirmDialog } from "primereact/confirmdialog";
import { getPrecioCombustibleVigente } from "../../api/precioCombustible";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { getEmbarcacionPorId } from "../../api/embarcacion";
import { Polyline } from "react-leaflet";
import {
  capturarGPS,
  formatearCoordenadas,
  convertirDecimalADMS,
  crearInputCoordenadas,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";
import { analizarCoordenadasConReferencia } from "../../api/geolocalizacion";
import { DEFAULT_MAP_ZOOM, MARKER_ICONS } from "../../config/mapConfig";
import L from "leaflet";
import PanelMapaGeografico from "../shared/PanelMapaGeografico";
import PDFDocumentManager from "../pdf/PDFDocumentManager";
import PuntoGPSInput from "../shared/PuntoGPSInput";


/**
 * Formulario DescargaFaenaPescaForm
 *
 * Formulario profesional para gestión de descargas de faena de pesca.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Captura de GPS integrada
 * - Layout responsive siguiendo patrón DatosGeneralesFaenaPesca
 *
 * Props esperadas desde el componente padre:
 * - puertos: Array de puertos (todos los puertos disponibles)
 * - clientes: Array de clientes filtrados por EntidadComercial (empresaId, tipoEntidadId=8, esCliente=true, estado=true)
 * - especies: Array de especies
 * - bahiaId: ID de bahía (valor fijo desde FaenaPesca)
 * - motoristaId: ID de motorista (valor fijo desde FaenaPesca)
 * - patronId: ID de patrón (valor fijo desde FaenaPesca)
 * - faenaPescaId: ID de faena de pesca (valor fijo desde FaenaPesca)
 * - temporadaPescaId: ID de temporada de pesca (valor fijo desde FaenaPesca)
 */
export default function DescargaFaenaPescaForm({
  detalle,
  puertos = [],
  clientes = [],
  especies = [],
  bahiaId = null,
  motoristaId = null,
  patronId = null,
  faenaPescaId = null,
  temporadaPescaId = null,
  temporadaData = null,
  faenaData = null,
  onGuardadoExitoso,
  onCancelar,
}) {
  // ⭐ OBTENER USUARIO AUTENTICADO PARA VERIFICAR SI ES SUPERUSUARIO
  const usuario = useAuthStore((state) => state.usuario);
  const esSuperUsuario = usuario?.esSuperUsuario || false;

  // ⭐ LÓGICA DE PERMISOS PARA EDICIÓN
  const estadosCerrados = ["FINALIZADA", "CANCELADA"];
  const estadoTemporada = temporadaData?.estadoTemporada?.descripcion || "";
  const temporadaCerrada = estadosCerrados.includes(estadoTemporada);
  const camposDeshabilitados = temporadaCerrada && !esSuperUsuario;

  // Estados para loading
  const [loading, setLoading] = useState(false);
  const [finalizandoDescarga, setFinalizandoDescarga] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Ref para Toast
  const toast = useRef(null);
  // Estados para información geográfica
  // Estados para información geográfica INICIO RETORNO
  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);
  // Estados para información geográfica PLATAFORMA
  const [infoGeograficaPlataforma, setInfoGeograficaPlataforma] = useState(null);
  const [loadingGeoPlataforma, setLoadingGeoPlataforma] = useState(false);
  // Estados para información geográfica FONDEO
  const [infoGeograficaFondeo, setInfoGeograficaFondeo] = useState(null);
  const [loadingGeoFondeo, setLoadingGeoFondeo] = useState(false);

  // Estados para plataformas de recepción
  const [plataformasRecepcion, setPlataformasRecepcion] = useState([]);
  const [loadingPlataformas, setLoadingPlataformas] = useState(false);

  const [errorGeoFondeo, setErrorGeoFondeo] = useState(null);

  // Estados para cálculos de recorrido
  const [puertoSalidaDatos, setPuertoSalidaDatos] = useState(null);
   const [distanciaRetornoPuerto, setDistanciaRetornoPuerto] = useState(null);
  const [consumoCombustible, setConsumoCombustible] = useState(null);
  const [costoCombustible, setCostoCombustible] = useState(null);
  const [precioCombustibleSoles, setPrecioCombustibleSoles] = useState(0);
  const [loadingPrecioCombustible, setLoadingPrecioCombustible] =
    useState(false);
  
  // Estados para cálculos de recorrido Descarga → Fondeo
  const [distanciaDescargaFondeo, setDistanciaDescargaFondeo] = useState(null);
  const [consumoDescargaFondeo, setConsumoDescargaFondeo] = useState(null);
  const [costoDescargaFondeo, setCostoDescargaFondeo] = useState(null);
  const [embarcacionCompleta, setEmbarcacionCompleta] = useState(null);

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
      faenaPescaId: null,
      temporadaPescaId: null,
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
      numReporteRecepcion: "",
      fechaHoraFondeo: null,
      latitudFondeo: 0,
      longitudFondeo: 0,
      puertoFondeoId: null,
      precioPorTonComisionFidelizacion: 0.0,
    },
  });

  // Observar cambios en coordenadas para mostrar formato DMS
  const latitud = watch("latitud");
  const longitud = watch("longitud");
  const latitudFondeo = watch("latitudFondeo");
  const longitudFondeo = watch("longitudFondeo");

  // Estados para el mapa de DESCARGA
  const [mapPosition, setMapPosition] = useState([-12.0, -77.0]);
  const [mapKey, setMapKey] = useState(0);

  // Estados adicionales para controles de mapa DESCARGA
  const [tipoMapa, setTipoMapa] = useState("street");
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);

  // Cargar datos del registro a editar cuando cambie detalle
  useEffect(() => {
    if (detalle) {
      reset({
        faenaPescaId: detalle.faenaPescaId
          ? Number(detalle.faenaPescaId)
          : faenaPescaId,
        temporadaPescaId: detalle.temporadaPescaId
          ? Number(detalle.temporadaPescaId)
          : temporadaPescaId,
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
        porcentajeJuveniles: detalle.porcentajeJuveniles ?? 0,
        numReporteRecepcion: detalle.numReporteRecepcion || "",
        fechaHoraFondeo: detalle.fechaHoraFondeo
          ? new Date(detalle.fechaHoraFondeo)
          : null,
        latitudFondeo: detalle.latitudFondeo || 0,
        longitudFondeo: detalle.longitudFondeo || 0,
        puertoFondeoId: detalle.puertoFondeoId
          ? Number(detalle.puertoFondeoId)
          : null,
        precioPorTonComisionFidelizacion:
          detalle.precioPorTonComisionFidelizacion || 0.0,
      });
    } else {
      // Resetear para nuevo registro con valores fijos de faena
      // Cargar coordenadas de última cala como inicio de retorno por defecto
      const cargarCoordenadasUltimaCala = async () => {
        let latitudInicio = 0;
        let longitudInicio = 0;

        if (faenaPescaId) {
          try {
            const calas = await getCalasPorFaena(faenaPescaId);
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
          faenaPescaId: faenaPescaId,
          puertoDescargaId: null,
          fechaHoraArriboPuerto: null,
          fechaHoraLlegadaPuerto: null,
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
          observaciones: "",
          temporadaPescaId: temporadaPescaId,
          clienteId: null,
          plataformaRecepcionPescaId: null,
          urlInformeDescargaProduce: "",
          movIngresoAlmacenId: null,
          movSalidaAlmacenId: null,
          especieId: null,
          toneladas: 0,
          porcentajeJuveniles: 0,
          numReporteRecepcion: "",
          fechaHoraFondeo: null,
          latitudFondeo: 0,
          longitudFondeo: 0,
          puertoFondeoId: null,
          precioPorTonComisionFidelizacion: 0,
        });

        // Actualizar posición del mapa si hay coordenadas válidas
        if (latitudInicio !== 0 && longitudInicio !== 0) {
          setMapPosition([latitudInicio, longitudInicio]);
          setMapKey((prev) => prev + 1);
        }
      };

      cargarCoordenadasUltimaCala();
    }
  }, [
    detalle,
    reset,
    bahiaId,
    motoristaId,
    patronId,
    faenaPescaId,
    temporadaPescaId,
  ]);


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

  /**
   * Manejar cambio de cliente
   * Auto-asigna el precioPorTonComisionFidelizacion desde EntidadComercial
   */
  const handleClienteChange = async (clienteId) => {
    setValue("clienteId", clienteId);
    setValue("plataformaRecepcionPescaId", null); // Limpiar plataforma al cambiar cliente

    if (clienteId) {
      // Buscar el cliente seleccionado en el array de clientes
      const clienteSeleccionado = clientes.find(
        (c) => Number(c.value) === Number(clienteId),
      );

      if (
        clienteSeleccionado &&
        clienteSeleccionado.precioPorTonComisionFidelizacion !== undefined
      ) {
        setValue(
          "precioPorTonComisionFidelizacion",
          Number(clienteSeleccionado.precioPorTonComisionFidelizacion),
        );
      }

      // Cargar plataformas de recepción del cliente
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

        // Obtener información geográfica de la plataforma
        if (plataformaSeleccionada.latitud && plataformaSeleccionada.longitud) {
          setLoadingGeoPlataforma(true);
          analizarCoordenadasConReferencia(
            plataformaSeleccionada.latitud,
            plataformaSeleccionada.longitud,
            null
          )
            .then((infoGeo) => {
              setInfoGeograficaPlataforma(infoGeo);
            })
            .catch((error) => {
              console.error("Error al analizar coordenadas de plataforma:", error);
              setInfoGeograficaPlataforma(null);
            })
            .finally(() => {
              setLoadingGeoPlataforma(false);
            });
        }
      }
    } else {
      // Si se limpia la plataforma, limpiar su info geográfica
      setInfoGeograficaPlataforma(null);
    }
  };


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
        draggable={!loading && !camposDeshabilitados}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={iconInicioRetorno}
      >
        <Popup>
          <strong>🔵 Inicio de Retorno</strong>
          <br />
          Coordenadas donde inicia el viaje hacia puerto
          <br />
          Lat: {formatearNumero(Number(latitud), 6)}
          <br />
          Lon: {formatearNumero(Number(longitud), 6)}
        </Popup>
      </Marker>
    );
  };

  /**
   * Componente de marker draggable para el mapa de FONDEO
   */
  const DraggableMarkerFondeo = () => {
    const markerRef = useRef(null);
    const latitudFondeo = watch("latitudFondeo");
    const longitudFondeo = watch("longitudFondeo");
    const nombrePuerto = watch("puertoFondeoId")
      ? puertos.find((p) => Number(p.id) === Number(watch("puertoFondeoId")))
        ?.nombre || "Puerto"
      : "Puerto de Fondeo";

    // No mostrar si no hay coordenadas de fondeo
    if (!latitudFondeo || !longitudFondeo || latitudFondeo === 0 || longitudFondeo === 0) {
      return null;
    }

    const eventHandlers = {
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setValue("latitudFondeo", lat);
          setValue("longitudFondeo", lng);
        }
      },
    };

    // Icono NARANJA para Fondeo
    const iconFondeo = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    return (
      <Marker
        position={[Number(latitudFondeo), Number(longitudFondeo)]}
        draggable={!loading}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={iconFondeo}
      >
        <Popup>
          <strong>Fondeo: {nombrePuerto}</strong>
          <br />
          Lat: {formatearNumero(Number(latitudFondeo), 6)}
          <br />
          Lon: {formatearNumero(Number(longitudFondeo), 6)}
        </Popup>
      </Marker>
    );
  };

  /**
 * Componente para mostrar línea desde inicio retorno hasta plataforma de recepción
 * Color azul (#3B82F6) para diferenciar del recorrido de pesca
 * PRIORIDAD: Si hay plataforma seleccionada, dibuja hacia plataforma. Sino, hacia puerto.
 */
  const LineaRetornoPuerto = () => {
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
   * Componente para mostrar línea desde plataforma de descarga hasta fondeo
   * Color naranja (#ff9800) según estándar del sistema
   * SOLO se muestra si hay coordenadas de fondeo
   */
  const LineaRetornoFondeo = () => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");
    const puertoDescargaId = watch("puertoDescargaId");
    const latitudFondeo = watch("latitudFondeo");
    const longitudFondeo = watch("longitudFondeo");

    // No mostrar si no hay coordenadas de fondeo
    if (!latitudFondeo || !longitudFondeo || latitudFondeo === 0 || longitudFondeo === 0) {
      return null;
    }

    let latitudPlataforma = null;
    let longitudPlataforma = null;

    // PRIORIDAD 1: Si hay plataforma seleccionada, usar sus coordenadas
    if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0) {
      const plataforma = plataformasRecepcion.find(
        (p) => Number(p.value) === Number(plataformaRecepcionPescaId),
      );

      if (plataforma?.latitud && plataforma?.longitud) {
        latitudPlataforma = Number(plataforma.latitud);
        longitudPlataforma = Number(plataforma.longitud);
      }
    }

    // PRIORIDAD 2: Si no hay plataforma, usar coordenadas de puerto de descarga
    if (!latitudPlataforma && !longitudPlataforma && puertoDescargaId && puertos.length > 0) {
      const puertoDescarga = puertos.find(
        (p) => Number(p.id) === Number(puertoDescargaId),
      );

      if (puertoDescarga?.latitud && puertoDescarga?.longitud) {
        latitudPlataforma = Number(puertoDescarga.latitud);
        longitudPlataforma = Number(puertoDescarga.longitud);
      }
    }

    // No mostrar si no hay coordenadas de plataforma/puerto
    if (!latitudPlataforma || !longitudPlataforma) {
      return null;
    }

    return (
      <Polyline
        positions={[
          [latitudPlataforma, longitudPlataforma],
          [Number(latitudFondeo), Number(longitudFondeo)],
        ]}
        color="#ff9800"
        weight={3}
        opacity={0.7}
        dashArray="10, 10"
      >
        <Popup>
          <strong>Recorrido a Fondeo</strong>
          <br />
          Desde Plataforma hasta Fondeo
        </Popup>
      </Polyline>
    );
  };

  /**
  * Componente para mostrar marcador de plataforma de recepción
  * 🔴 ROJO - Representa la plataforma de recepción donde se descarga
  * Color rojo según estándar del sistema
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
   * Panel de resumen con información de recorrido, consumo y costos
   * Muestra distancia, galones y soles del trayecto retorno-puerto
   */
  const PanelResumenRecorrido = () => {
    const hayDatos =
      distanciaRetornoPuerto !== null ||
      consumoCombustible !== null ||
      costoCombustible !== null;

    if (!hayDatos) return null;

    return (
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f0f9ff",
          borderRadius: "8px",
          border: "2px solid #3B82F6",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            color: "#1e40af",
            fontSize: "1.1rem",
          }}
        >
          📊 Resumen de Recorrido - Retorno a Puerto
        </h3>

        {distanciaRetornoPuerto !== null && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              marginBottom: "0.5rem",
            }}
          >
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e40af" }}>
              🔵 Inicio Retorno → 🔴 Puerto Descarga
            </h4>
            <p
              style={{
                margin: "0.25rem 0",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#1e40af",
              }}
            >
              {formatearNumero(distanciaRetornoPuerto, 2)} MN
            </p>
            {embarcacionCompleta?.millasNauticasPorGalon && (
              <>
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  ⛽{" "}
                  {formatearNumero(
                    distanciaRetornoPuerto /
                    Number(embarcacionCompleta.millasNauticasPorGalon),
                    2
                  )}{" "}
                  Galones
                </p>
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  💰 S/{" "}
                  {formatearNumero(
                    (distanciaRetornoPuerto /
                      Number(embarcacionCompleta.millasNauticasPorGalon)) *
                    precioCombustibleSoles,
                    2
                  )}
                </p>
              </>
            )}
            {!embarcacionCompleta?.millasNauticasPorGalon && (
              <p
                style={{
                  margin: "0.5rem 0",
                  fontSize: "0.85rem",
                  color: "#dc2626",
                  fontStyle: "italic",
                }}
              >
                ⚠️ Configure millasNauticasPorGalon en la embarcación para
                calcular consumo
              </p>
            )}
          </div>
        )}

        {loadingPrecioCombustible && (
          <p
            style={{
              margin: "0.5rem 0",
              fontSize: "0.85rem",
              color: "#6b7280",
            }}
          >
            ⏳ Cargando precio de combustible...
          </p>
        )}
      </div>
    );
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
        faenaPescaId: data.faenaPescaId ? Number(data.faenaPescaId) : null,
        temporadaPescaId: data.temporadaPescaId
          ? Number(data.temporadaPescaId)
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
        plataformaRecepcionPescaId: data.plataformaRecepcionPescaId ? Number(data.plataformaRecepcionPescaId) : null,
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
        patronId: patronId ? Number(patronId) : null,
        motoristaId: motoristaId ? Number(motoristaId) : null,
        bahiaId: bahiaId ? Number(bahiaId) : null,
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
        numReporteRecepcion: data.numReporteRecepcion?.trim() || null,
        fechaHoraFondeo: data.fechaHoraFondeo
          ? data.fechaHoraFondeo.toISOString()
          : null,
        latitudFondeo: data.latitudFondeo || 0,
        longitudFondeo: data.longitudFondeo || 0,
        puertoFondeoId: data.puertoFondeoId
          ? Number(data.puertoFondeoId)
          : null,
        precioPorTonComisionFidelizacion:
          data.precioPorTonComisionFidelizacion || 0.0,
      };

      if (detalle?.id) {
        await actualizarDescargaFaenaPesca(detalle.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearDescargaFaenaPesca(payload);
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
      // Extraer mensaje de error del backend
      let errorMessage = "Error desconocido al guardar la descarga";

      if (error?.response?.data?.mensaje) {
        // Error del backend con campo 'mensaje'
        errorMessage = error.response.data.mensaje;
      } else if (error?.response?.data?.message) {
        // Error del backend con campo 'message'
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        // Algunos backends envían el error en 'error'
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        // Error de axios o JavaScript
        errorMessage = error.message;
      } else if (typeof error === "string") {
        // Error como string directo
        errorMessage = error;
      }

      toast.current?.show({
        severity: "error",
        summary: "Error de Validación",
        detail: errorMessage,
        life: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la finalización de descarga con generación de movimientos de almacén
   */
  const handleFinalizarDescarga = () => {
    // Prevenir si ya está procesando
    if (finalizandoDescarga) {
      return;
    }

    if (!detalle?.id) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la descarga antes de finalizarla",
        life: 4000,
      });
      return;
    }

    if (!temporadaPescaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se pudo obtener el ID de la temporada de pesca",
        life: 4000,
      });
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de finalizar esta descarga? Esta acción generará automáticamente los movimientos de almacén (ingreso y salida) con sus respectivos kardex.",
      header: "Confirmar Finalización de Descarga",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-info",
      rejectClassName: "p-button-secondary",
      acceptLabel: "Sí, Finalizar y Generar Movimientos",
      rejectLabel: "Cancelar",
      accept: async () => {
        setFinalizandoDescarga(true);
        try {
          toast.current?.show({
            severity: "info",
            summary: "Procesando",
            detail:
              "Finalizando descarga y generando movimientos de almacén, por favor espere...",
            life: 3000,
          });

          // Llamar al backend para finalizar y generar movimientos de almacén
          const resultado = await finalizarDescargaConMovimientos(
            detalle.id,
            temporadaPescaId,
          );

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Descarga finalizada correctamente. Se generaron los documentos ${resultado.movimientoIngreso?.numeroDocumento || ""
              } (Ingreso) y ${resultado.movimientoSalida?.numeroDocumento || ""
              } (Salida).`,
            life: 6000,
          });

          // Notificar cambios y cerrar
          if (onGuardadoExitoso) {
            onGuardadoExitoso();
          }
        } catch (error) {
          console.error("Error finalizando descarga:", error);
          const errorMsg =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Error al finalizar la descarga";
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: errorMsg,
            life: 5000,
          });
        } finally {
          setFinalizandoDescarga(false);
        }
      },
    });
  };

  /**
   * Funciones de control de mapa DESCARGA
   */
  const getTileConfig = () => {
    const configs = {
      street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '&​copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "&​copy; Esri &​mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
      hybrid: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "&​copy; Esri",
      },
    };
    return configs[tipoMapa] || configs.street;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setMapaFullscreen(true);
    } else {
      document.exitFullscreen();
      setMapaFullscreen(false);
    }
  };

  const cambiarTipoMapa = () => {
    setTipoMapa((prev) => {
      if (prev === "street") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "street";
    });
  };

  const obtenerUbicacionUsuario = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapPosition([latitude, longitude]);
          setMapKey((prev) => prev + 1);
          toast.current?.show({
            severity: "success",
            summary: "Ubicación obtenida",
            detail: `Lat: ${formatearNumero(latitude, 6)}, Lon: ${formatearNumero(longitude, 6)}`,
            life: 3000,
          });
        },
        (error) => {
          toast.current?.show({
            severity: "error",
            summary: "Error de geolocalización",
            detail: "No se pudo obtener la ubicación",
            life: 3000,
          });
        },
      );
    }
  };

  /**
   * Función auxiliar para clasificación de aguas
   */
  const getClasificacionAguasColor = (clasificacion) => {
    const colores = {
      "Aguas Jurisdiccionales": "info",
      "Aguas Internacionales": "warning",
      "Alta Mar": "danger",
    };
    return colores[clasificacion] || "secondary";
  };


  /**
 * useEffect para analizar coordenadas cuando ya existen en el formulario
 */
  useEffect(() => {
    const latitud = watch("latitud");
    const longitud = watch("longitud");

    if (latitud && longitud && Number(latitud) !== 0 && Number(longitud) !== 0 && !loadingGeo) {
      const coordenadasActuales = `${latitud},${longitud}`;
      const coordenadasAnalizadas = infoGeografica
        ? `${infoGeografica.coordenadas?.latitud},${infoGeografica.coordenadas?.longitud}`
        : null;

      if (coordenadasActuales !== coordenadasAnalizadas) {
        const analizarCoordenadasExistentes = async () => {
          setLoadingGeo(true);
          setErrorGeo(null);
          try {
            const infoGeo = await analizarCoordenadasConReferencia(
              latitud,
              longitud,
              null,
            );
            setInfoGeografica(infoGeo);
          } catch (error) {
            console.error("❌ Error al analizar coordenadas existentes:", error);
            setErrorGeo("No se pudo obtener la información geográfica");
          } finally {
            setLoadingGeo(false);
          }
        };

        analizarCoordenadasExistentes();
      } else {
        console.log("⏭️ SKIP: Coordenadas ya analizadas");
      }
    } else {
      console.log("⏭️ SKIP: Condiciones no cumplidas");
    }
  }, [watch("latitud"), watch("longitud")]);

  /**
  * useEffect para analizar coordenadas FONDEO cuando ya existen en el formulario
  */
  useEffect(() => {
    const latitudFondeo = watch("latitudFondeo");
    const longitudFondeo = watch("longitudFondeo");

    if (latitudFondeo && longitudFondeo && Number(latitudFondeo) !== 0 && Number(longitudFondeo) !== 0 && !loadingGeoFondeo) {
      const coordenadasActuales = `${latitudFondeo},${longitudFondeo}`;
      const coordenadasAnalizadas = infoGeograficaFondeo
        ? `${infoGeograficaFondeo.coordenadas?.latitud},${infoGeograficaFondeo.coordenadas?.longitud}`
        : null;


      if (coordenadasActuales !== coordenadasAnalizadas) {
        const analizarCoordenadasFondeoExistentes = async () => {
          setLoadingGeoFondeo(true);
          setErrorGeoFondeo(null);
          try {
            const infoGeo = await analizarCoordenadasConReferencia(
              latitudFondeo,
              longitudFondeo,
              null,
            );
            setInfoGeograficaFondeo(infoGeo);
          } catch (error) {
            setErrorGeoFondeo("No se pudo obtener la información geográfica de fondeo");
          } finally {
            setLoadingGeoFondeo(false);
          }
        };

        analizarCoordenadasFondeoExistentes();
      } else {
        console.log("⏭️ SKIP FONDEO: Coordenadas ya analizadas");
      }
    } else {
      console.log("⏭️ SKIP FONDEO: Condiciones no cumplidas");
    }
    }, [watch("latitudFondeo"), watch("longitudFondeo")]);

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
        } else {
          console.log("⏭️ SKIP PLATAFORMA: Coordenadas ya analizadas");
        }
      }
    } else {
      console.log("⏭️ SKIP PLATAFORMA: Condiciones no cumplidas");
    }
  }, [watch("plataformaRecepcionPescaId"), plataformasRecepcion]);

  /**
   * useEffect para cargar datos completos de la embarcación
   * Necesario para obtener millasNauticasPorGalon
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
   * Necesario para calcular distancia desde inicio retorno hasta puerto descarga
   */
  useEffect(() => {
    if (faenaData?.puertoSalidaId && puertos.length > 0) {
      const puerto = puertos.find(
        (p) => Number(p.id) === Number(faenaData.puertoSalidaId),
      );
      if (puerto) {
        setPuertoSalidaDatos(puerto);
      }
    }
  }, [faenaData?.puertoSalidaId, puertos]);

  /**
   * useEffect para cargar precio de combustible vigente
   * Convierte a soles si está en dólares usando tipo de cambio SUNAT
   */
  useEffect(() => {
    const cargarPrecioCombustible = async () => {
      if (!temporadaData?.empresa?.entidadComercialId) return;

      setLoadingPrecioCombustible(true);
      try {
        const fechaReferencia = detalle?.fechaHoraArriboPuerto
          ? new Date(detalle.fechaHoraArriboPuerto)
          : new Date();

        const precioCombustible = await getPrecioCombustibleVigente(
          Number(temporadaData.empresa.entidadComercialId),
          fechaReferencia,
        );

        if (!precioCombustible) {
          console.warn(
            "No se encontró precio de combustible vigente, usando precio por defecto",
          );
          return;
        }

        let precioEnSoles = Number(precioCombustible.precioUnitario);

        // Si está en dólares (ID = 2), convertir a soles
        if (Number(precioCombustible.monedaId) === 2) {
          try {
            const fecha = new Date(fechaReferencia);
            const tipoCambio = await consultarTipoCambioSunat({
              date: fecha.getDate(),
              month: fecha.getMonth() + 1,
              year: fecha.getFullYear(),
            });
            if (tipoCambio?.venta) {
              precioEnSoles = precioEnSoles * Number(tipoCambio.venta);
            }
          } catch (error) {
            console.error("Error obteniendo tipo de cambio:", error);
          }
        }

        setPrecioCombustibleSoles(precioEnSoles);
      } catch (error) {
        console.error("Error obteniendo precio de combustible:", error);
      } finally {
        setLoadingPrecioCombustible(false);
      }
    };

    cargarPrecioCombustible();
  }, [
    temporadaData?.empresa?.entidadComercialId,
    detalle?.fechaHoraArriboPuerto,
  ]);

  /**
   * useEffect para calcular distancia entre inicio retorno y puerto descarga
   * Usa fórmula de Haversine para calcular distancia en millas náuticas
   */
  useEffect(() => {
    const puertoDescargaId = watch("puertoDescargaId");
    const latitudRetorno = watch("latitud");
    const longitudRetorno = watch("longitud");

    if (
      puertoDescargaId &&
      latitudRetorno &&
      longitudRetorno &&
      puertos.length > 0
    ) {
      const puertoDescarga = puertos.find(
        (p) => Number(p.id) === Number(puertoDescargaId),
      );

      if (puertoDescarga && puertoDescarga.latitud && puertoDescarga.longitud) {
        // Fórmula de Haversine
        const R = 3440.065; // Radio de la Tierra en millas náuticas
        const lat1 = (Number(latitudRetorno) * Math.PI) / 180;
        const lat2 = (Number(puertoDescarga.latitud) * Math.PI) / 180;
        const deltaLat =
          ((Number(puertoDescarga.latitud) - Number(latitudRetorno)) *
            Math.PI) /
          180;
        const deltaLon =
          ((Number(puertoDescarga.longitud) - Number(longitudRetorno)) *
            Math.PI) /
          180;

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLon / 2) *
          Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distancia = R * c;

        setDistanciaRetornoPuerto(distancia);
      } else {
        setDistanciaRetornoPuerto(null);
      }
    } else {
      setDistanciaRetornoPuerto(null);
    }
  }, [watch("puertoDescargaId"), watch("latitud"), watch("longitud"), puertos]);

  /**
   * useEffect para calcular consumo de combustible
   * consumo = distancia / millasNauticasPorGalon
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
   * useEffect para calcular costo de combustible
   * costo = consumo * precioCombustibleSoles
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
   * Usa fórmula de Haversine para calcular distancia en millas náuticas
   */
  useEffect(() => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");
    const puertoDescargaId = watch("puertoDescargaId");
    const latitudFondeo = watch("latitudFondeo");
    const longitudFondeo = watch("longitudFondeo");

    if (latitudFondeo && longitudFondeo && Number(latitudFondeo) !== 0 && Number(longitudFondeo) !== 0) {
      let latitudPlataforma = null;
      let longitudPlataforma = null;

      // PRIORIDAD 1: Si hay plataforma seleccionada, usar sus coordenadas
      if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0) {
        const plataforma = plataformasRecepcion.find(
          (p) => Number(p.value) === Number(plataformaRecepcionPescaId)
        );

        if (plataforma?.latitud && plataforma?.longitud) {
          latitudPlataforma = Number(plataforma.latitud);
          longitudPlataforma = Number(plataforma.longitud);
        }
      }

      // PRIORIDAD 2: Si no hay plataforma, usar coordenadas de puerto de descarga
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
        // Fórmula de Haversine
        const R = 3440.065; // Radio de la Tierra en millas náuticas
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
   * consumo = distancia / millasNauticasPorGalon
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
   * costo = consumo * precioCombustibleSoles
   */
  useEffect(() => {
    if (consumoDescargaFondeo !== null && precioCombustibleSoles > 0) {
      const costo = consumoDescargaFondeo * precioCombustibleSoles;
      setCostoDescargaFondeo(costo);
    } else {
      setCostoDescargaFondeo(null);
    }
  }, [consumoDescargaFondeo, precioCombustibleSoles]);

  // Crear configuración de inputs de coordenadas usando utilidad genérica
  const coordenadasConfig = crearInputCoordenadas({
    latitud,
    longitud,
    onLatitudChange: (valor) => setValue("latitud", valor),
    onLongitudChange: (valor) => setValue("longitud", valor),
    disabled: true, // Solo lectura, se captura por GPS
    mostrarDMS: true,
  });

  const coordenadasFondeoConfig = crearInputCoordenadas({
    latitud: latitudFondeo,
    longitud: longitudFondeo,
    onLatitudChange: (valor) => setValue("latitudFondeo", valor),
    onLongitudChange: (valor) => setValue("longitudFondeo", valor),
    disabled: true, // Solo lectura, se captura por GPS
    mostrarDMS: true,
  });

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      >
        <TabPanel header="📝 Datos de Descarga" leftIcon="pi pi-info-circle mr-2">
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
              <Button
                type="button"
                label="Inicio Retorno a Puerto"
                icon="pi pi-clock"
                className="p-button-info"
                onClick={() => setValue("fechaHoraArriboPuerto", new Date())}
                disabled={loading}
                size="small"
                style={{ marginTop: "5px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraArriboPuerto" style={{ color: "#2c32d3" }}>
                Inicio Retorno a Puerto*
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
          {/* Cuarta fila: Coordenadas GPS (2 columnas) */}

          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: "0.5rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Columna 1: GPS Descarga */}
            <div
              style={{
                flex: 1,
                border: "6px solid #059669",
                padding: "0.5rem",
                borderRadius: "8px",
              }}
            >
              <PuntoGPSInput
                labelLatitud="Latitud (Inicio Retorno)"
                labelLongitud="Longitud (Inicio Retorno)"
                labelBotonGPS="📍 Capturar GPS Inicio Retorno"
                fieldNameLatitud="latitud"
                fieldNameLongitud="longitud"
                control={control}
                setValue={setValue}
                watch={watch}
                onGPSCapture={async ({ latitud, longitud, accuracy }) => {
                  // Notificación de éxito
                  toast.current?.show({
                    severity: "success",
                    summary: "GPS capturado",
                    detail: `GPS capturado con precisión de ${formatearNumero(accuracy, 1)}m`,
                    life: 3000,
                  });

                  // Analizar coordenadas para obtener información geográfica
                  setLoadingGeo(true);
                  setErrorGeo(null);
                  try {
                    const puertoSalidaId = getValues("puertoDescargaId");
                    const infoGeo = await analizarCoordenadasConReferencia(
                      latitud,
                      longitud,
                      puertoSalidaId,
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
                }}
                readOnly={camposDeshabilitados}
                disabled={loading}
                loading={loading}
              />
            </div>

            {/* Columna 2: GPS Fondeo */}
            <div
              style={{
                flex: 1,
                border: "6px solid #ff9800",
                padding: "0.5rem",
                borderRadius: "8px",
              }}
            >
              <PuntoGPSInput
                labelLatitud="Latitud Fondeo"
                labelLongitud="Longitud Fondeo"
                labelBotonGPS="📍 Capturar GPS Fondeo"
                colorBoton="warning"
                fieldNameLatitud="latitudFondeo"
                fieldNameLongitud="longitudFondeo"
                control={control}
                setValue={setValue}
                watch={watch}
                onGPSCapture={async ({ latitud, longitud, accuracy }) => {
                  // Notificación de éxito
                  toast.current?.show({
                    severity: "success",
                    summary: "GPS Fondeo capturado",
                    detail: `GPS Fondeo capturado con precisión de ${formatearNumero(accuracy, 1)}m`,
                    life: 3000,
                  });

                  // Analizar coordenadas para obtener información geográfica de FONDEO
                  setLoadingGeoFondeo(true);
                  setErrorGeoFondeo(null);
                  try {
                    const puertoFondeoId = getValues("puertoFondeoId");
                    const infoGeo = await analizarCoordenadasConReferencia(
                      latitud,
                      longitud,
                      puertoFondeoId,
                    );
                    setInfoGeograficaFondeo(infoGeo);

                    toast.current?.show({
                      severity: "info",
                      summary: "Información Geográfica Fondeo",
                      detail: "Información geográfica de fondeo obtenida correctamente",
                      life: 3000,
                    });
                  } catch (error) {
                    console.error("Error al analizar coordenadas de fondeo:", error);
                    setErrorGeoFondeo("No se pudo obtener la información geográfica de fondeo");
                    toast.current?.show({
                      severity: "warn",
                      summary: "Advertencia",
                      detail: "No se pudo obtener información geográfica de fondeo",
                      life: 3000,
                    });
                  } finally {
                    setLoadingGeoFondeo(false);
                  }
                }}
                readOnly={false}
                disabled={loading}
                loading={loading}
              />
            </div>
          </div>
          <PanelMapaGeografico
            mapPosition={mapPosition}
            mapKey={mapKey}
            tipoMapa={tipoMapa}
            zoom={7}
            getTileConfig={getTileConfig}
            toggleFullscreen={toggleFullscreen}
            cambiarTipoMapa={cambiarTipoMapa}
            obtenerUbicacionUsuario={obtenerUbicacionUsuario}
            mapContainerRef={mapContainerRef}
            mapaFullscreen={mapaFullscreen}
            usarModoMultiple={true}
            infoInicioRetorno={infoGeografica}
            infoPlataforma={infoGeograficaPlataforma}
            infoFondeo={latitudFondeo && longitudFondeo ? infoGeograficaFondeo : null}
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
            getClasificacionAguasColor={getClasificacionAguasColor}
            titulo="📍 Información Geográfica"
            colapsadoPorDefecto={true}
          >
            <LineaRetornoPuerto />
            <LineaRetornoFondeo />
            <MarkerPuertoDescarga />
            <DraggableMarker />
            <DraggableMarkerFondeo />
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
                    options={puertos}
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
            <div style={{ flex: 2 }}>
              <label htmlFor="clienteId">Cliente*</label>
              <Controller
                name="clienteId"
                control={control}
                rules={{ required: "El cliente es obligatorio" }}
                render={({ field }) => (
                  <Dropdown
                    id="clienteId"
                    value={field.value}
                    onChange={(e) => handleClienteChange(e.value)}
                    options={clientes}
                    optionLabel="label"
                    optionValue="value"
                    filter
                    style={{ fontWeight: "bold" }}
                    placeholder="Seleccione cliente"
                    disabled={loading}
                    className={classNames({ "p-invalid": errors.clienteId })}
                  />
                )}
              />
              {errors.clienteId && (
                <Message severity="error" text={errors.clienteId.message} />
              )}
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="plataformaRecepcionPescaId">Plataforma de Recepción</label>
              <Controller
                name="plataformaRecepcionPescaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="plataformaRecepcionPescaId"
                    value={field.value}
                    onChange={(e) => handlePlataformaChange(e.value)}
                    options={plataformasRecepcion}
                    optionLabel="label"
                    optionValue="value"
                    filter
                    showClear
                    style={{ fontWeight: "bold" }}
                    placeholder={loadingPlataformas ? "Cargando..." : "Seleccione plataforma"}
                    disabled={loading || loadingPlataformas || !watch("clienteId")}
                    className={classNames({ "p-invalid": errors.plataformaRecepcionPescaId })}
                  />
                )}
              />
              {errors.plataformaRecepcionPescaId && (
                <Message severity="error" text={errors.plataformaRecepcionPescaId.message} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numPlataformaDescarga">Plataforma</label>
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
                    options={especies}
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
            <div style={{ flex: 1 }}>
              <label htmlFor="toneladas">Kilogramos*</label>
              <Controller
                name="toneladas"
                control={control}
                rules={{ required: "Los kilogramos son obligatorios" }}
                render={({ field }) => (
                  <InputNumber
                    id="toneladas"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
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
            <div style={{ flex: 1 }}>
              <label htmlFor="precioPorTonComisionFidelizacion">
                Precio/Ton Com.Fidelización (US$)
              </label>
              <Controller
                name="precioPorTonComisionFidelizacion"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioPorTonComisionFidelizacion"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    min={0}
                    max={9999.99}
                    prefix="$ "
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={true}
                    className={classNames({
                      "p-invalid": errors.precioPorTonComisionFidelizacion,
                    })}
                  />
                )}
              />
              {errors.precioPorTonComisionFidelizacion && (
                <Message
                  severity="error"
                  text={errors.precioPorTonComisionFidelizacion.message}
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
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="numReporteRecepcion">Reporte Recepción</label>
              <Controller
                name="numReporteRecepcion"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numReporteRecepcion"
                    {...field}
                    placeholder="Número de reporte de recepción"
                    disabled={loading}
                    style={{ fontWeight: "bold" }}
                    maxLength={20}
                  />
                )}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="observaciones">Observaciones</label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="observaciones"
                    {...field}
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
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Fin Descarga"
                icon="pi pi-clock"
                className="p-button-success"
                onClick={() => setValue("fechaHoraFinDescarga", new Date())}
                disabled={loading}
                style={{ marginTop: "5px" }}
              />
            </div>
            <div style={{ flex: 0.7 }}>
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

        </TabPanel>

        <TabPanel
          header="📄 Comprobante Wincha"
          leftIcon="pi pi-file-pdf mr-2"
          disabled={!detalle?.id}
        >
          <PDFDocumentManager
            moduleName="descarga-faena-pesca-comprobante-wincha"
            fieldName="urlComprobanteWincha"
            entityId={detalle?.id}
            title="📄 Comprobante de Wincha (PDF)"
            dialogTitle="Subir Comprobante de Wincha"
            uploadButtonLabel="Capturar/Subir PDF"
            viewButtonLabel="Abrir"
            downloadButtonLabel="Descargar"
            emptyMessage="No hay comprobante de wincha cargado"
            emptyDescription='Use el botón "Capturar/Subir PDF" para agregar el comprobante de pesaje de wincha'
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            readOnly={camposDeshabilitados}
          />
        </TabPanel>
      </TabView>

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
            disabled={loading || finalizandoDescarga}
            severity="warning"
            raised
            size="small"
          />
          <Button
            onClick={handleGuardar}
            label={detalle?.id ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            loading={loading}
            disabled={finalizandoDescarga}
            className="p-button-success"
            severity="success"
            raised
            size="small"
          />
        </div>
      </div>
    </div>
  );
}
