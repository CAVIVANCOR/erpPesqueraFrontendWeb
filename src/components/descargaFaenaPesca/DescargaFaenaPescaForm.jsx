// src/components/descargaFaenaPesca/DescargaFaenaPescaForm.jsx
// Formulario profesional para DescargaFaenaPesca - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  // Ref para Toast
  const toast = useRef(null);
  // Estados para información geográfica
  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);
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

  // Estados para el mapa de DESCARGA
  const [mapPosition, setMapPosition] = useState([-12.0, -77.0]);
  const [mapKey, setMapKey] = useState(0);

  // Estados para el mapa de FONDEO
  const [mapPositionFondeo, setMapPositionFondeo] = useState([-12.0, -77.0]);
  const [mapKeyFondeo, setMapKeyFondeo] = useState(0);
  // Estados adicionales para controles de mapa DESCARGA
  const [tipoMapa, setTipoMapa] = useState("street");
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);

  // Estados adicionales para controles de mapa FONDEO
  const [tipoMapaFondeo, setTipoMapaFondeo] = useState("street");
  const [mapaFullscreenFondeo, setMapaFullscreenFondeo] = useState(false);
  const mapContainerRefFondeo = useRef(null);

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

  // Sincronizar cambios de decimal a DMS para FONDEO

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
      }
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
    const nombrePuerto = watch("puertoFondeoId")
      ? puertos.find((p) => Number(p.id) === Number(watch("puertoFondeoId")))
        ?.nombre || "Puerto"
      : "Puerto de Fondeo";

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
      >
        <Popup>
          <strong>{nombrePuerto}</strong>
          <br />
          Lat: {formatearNumero(Number(latitudFondeo), 6)}
          <br />
          Lon: {formatearNumero(Number(longitudFondeo), 6)}
        </Popup>
      </Marker>
    );
  };

  /**
   * Componente para mostrar línea desde inicio retorno hasta puerto descarga
   * Color azul (#3B82F6) para diferenciar del recorrido de pesca
   */
  const LineaRetornoPuerto = () => {
    const puertoDescargaId = watch("puertoDescargaId");
    const latitudRetorno = watch("latitud");
    const longitudRetorno = watch("longitud");

    if (
      !puertoDescargaId ||
      !latitudRetorno ||
      !longitudRetorno ||
      !puertos.length
    )
      return null;

    const puertoDescarga = puertos.find(
      (p) => Number(p.id) === Number(puertoDescargaId),
    );

    if (!puertoDescarga?.latitud || !puertoDescarga?.longitud) return null;

    const positions = [
      [Number(latitudRetorno), Number(longitudRetorno)],
      [Number(puertoDescarga.latitud), Number(puertoDescarga.longitud)],
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
   * Componente para mostrar marcador del puerto de descarga o plataforma de recepción
   * Color rojo según estándar del sistema
   * PRIORIDAD: Si hay plataforma seleccionada, muestra plataforma. Sino, muestra puerto.
   */
  const MarkerPuertoDescarga = () => {
    const plataformaRecepcionPescaId = watch("plataformaRecepcionPescaId");
    const puertoDescargaId = watch("puertoDescargaId");

    // PRIORIDAD 1: Si hay plataforma seleccionada, mostrar plataforma
    if (plataformaRecepcionPescaId && plataformasRecepcion.length > 0) {
      const plataforma = plataformasRecepcion.find(
        (p) => Number(p.value) === Number(plataformaRecepcionPescaId),
      );

      if (plataforma?.latitud && plataforma?.longitud) {
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
            </Popup>
          </Marker>
        );
      }
    }

    // PRIORIDAD 2: Si no hay plataforma, mostrar puerto de descarga
    if (!puertoDescargaId || !puertos.length) return null;

    const puertoDescarga = puertos.find(
      (p) => Number(p.id) === Number(puertoDescargaId),
    );

    if (!puertoDescarga?.latitud || !puertoDescarga?.longitud) return null;

    const iconPuertoDescarga = L.icon({
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
          Number(puertoDescarga.latitud),
          Number(puertoDescarga.longitud),
        ]}
        icon={iconPuertoDescarga}
      >
        <Popup>
          <strong>🔴 {puertoDescarga.nombre}</strong>
          <br />
          Puerto de Descarga
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
   * Funciones de control de mapa FONDEO
   */
  const getTileConfigFondeo = () => {
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
    return configs[tipoMapaFondeo] || configs.street;
  };

  const toggleFullscreenFondeo = () => {
    if (!document.fullscreenElement) {
      mapContainerRefFondeo.current?.requestFullscreen();
      setMapaFullscreenFondeo(true);
    } else {
      document.exitFullscreen();
      setMapaFullscreenFondeo(false);
    }
  };

  const cambiarTipoMapaFondeo = () => {
    setTipoMapaFondeo((prev) => {
      if (prev === "street") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "street";
    });
  };

  const obtenerUbicacionUsuarioFondeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapPositionFondeo([latitude, longitude]);
          setMapKeyFondeo((prev) => prev + 1);
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
            detail: `GPS capturado con precisión de ${formatearNumero(accuracy, 1)}m`,
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
            detail: `GPS Fondeo capturado con precisión de ${formatearNumero(accuracy, 1)}m`,
            life: 3000,
          });

          // Analizar coordenadas para obtener información geográfica de FONDEO
          setLoadingGeoFondeo(true);
          setErrorGeoFondeo(null);
          try {
            const puertoFondeoId = getValues("puertoFondeoId");
            const infoGeo = await analizarCoordenadasConReferencia(
              latitude,
              longitude,
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
            setErrorGeoFondeo(
              "No se pudo obtener la información geográfica de fondeo",
            );
            toast.current?.show({
              severity: "warn",
              summary: "Advertencia",
              detail: "No se pudo obtener información geográfica de fondeo",
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
        {/* Botón para capturar GPS del punto donde deciden retornar al puerto */}
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Capturar GPS Inicio Retorno"
            icon="pi pi-map-marker"
            className="p-button-info"
            onClick={handleCapturarGPS}
            disabled={loading || camposDeshabilitados}
            tooltip="Captura la ubicación GPS donde la embarcación decide retornar al puerto"
            tooltipOptions={{ position: "top" }}
          />
        </div>

        {/* Tabla MEJORADA de coordenadas GPS - Optimizada para Tablet */}
        <div style={{ flex: 6 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "3px solid #0EA5E9",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#0EA5E9", color: "white" }}>
                <th
                  style={{
                    padding: "8px",
                    border: "1px solid #0EA5E9",
                    fontSize: "14px",
                    fontWeight: "bold",
                    width: "100px",
                    minWidth: "100px",
                  }}
                >
                  Formato
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "8px",
                    border: "1px solid #0EA5E9",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Latitud (Siempre SUR en Perú)
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "8px",
                    border: "1px solid #0EA5E9",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Longitud (Siempre OESTE en Perú)
                </th>
              </tr>
            </thead>
            <tbody>
              {/* ========== FILA DECIMAL ========== */}
              <tr>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #0EA5E9",
                    fontWeight: "bold",
                    fontSize: "14px",
                    backgroundColor: "#e1f1f7",
                    width: "100px",
                  }}
                >
                  Decimal
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "4px", border: "1px solid #0EA5E9" }}
                >
                  <Controller
                    name="latitud"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        placeholder="-12.123456"
                        disabled={loading || camposDeshabilitados}
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={14}
                        min={-90}
                        max={90}
                        style={{
                          width: "100%",
                          fontSize: "20px",
                          padding: "8px",
                        }}
                      />
                    )}
                  />
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "4px", border: "1px solid #0EA5E9" }}
                >
                  <Controller
                    name="longitud"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        placeholder="-77.123456"
                        disabled={loading || camposDeshabilitados}
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={14}
                        min={-180}
                        max={180}
                        style={{
                          width: "100%",
                          fontSize: "20px",
                          padding: "8px",
                        }}
                      />
                    )}
                  />
                </td>
              </tr>

              {/* ========== FILA DMS (Grados, Minutos, Segundos) ========== */}
              <tr>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #0EA5E9",
                    fontWeight: "bold",
                    fontSize: "14px",
                    backgroundColor: "#e1f1f7",
                  }}
                >
                  DMS
                </td>

                {/* ===== LATITUD DMS ===== */}
                {/* Grados */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={latGrados}
                      onChange={(e) =>
                        setLatGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudDesdeDMS}
                      disabled={loading || camposDeshabilitados}
                      min="0"
                      max="90"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #059669",
                        fontSize: "18px", // ← MÁS GRANDE
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>

                {/* Minutos */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={latMinutos}
                      onChange={(e) =>
                        setLatMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudDesdeDMS}
                      disabled={loading || camposDeshabilitados}
                      min="0"
                      max="59"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #059669",
                        fontSize: "18px", // ← MÁS GRANDE
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>

                {/* Segundos */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={latSegundos}
                      onChange={(e) =>
                        setLatSegundos(parseFloat(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudDesdeDMS}
                      disabled={loading || camposDeshabilitados}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #059669",
                        fontSize: "18px", // ← MÁS GRANDE
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>

                {/* Dirección N/S - BLOQUEADO EN "S" PARA USUARIOS NORMALES */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <select
                    value={latDireccion}
                    onChange={(e) => {
                      setLatDireccion(e.target.value);
                      actualizarLatitudDesdeDMS();
                    }}
                    disabled={
                      !esSuperUsuario || loading || camposDeshabilitados
                    } // ← SOLO SUPERUSUARIO PUEDE CAMBIAR
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: esSuperUsuario
                        ? "2px solid #f59e0b"
                        : "2px solid #94a3b8",
                      fontSize: "18px", // ← MÁS GRANDE
                      fontWeight: "bold",
                      textAlign: "center",
                      borderRadius: "4px",
                      backgroundColor: esSuperUsuario ? "#fef3c7" : "#f1f5f9",
                      cursor: esSuperUsuario ? "pointer" : "not-allowed",
                    }}
                  >
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                  {!esSuperUsuario && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#64748b",
                        textAlign: "center",
                        marginTop: "2px",
                      }}
                    >
                      🔒 Fijo
                    </div>
                  )}
                </td>

                {/* ===== LONGITUD DMS ===== */}
                {/* Grados */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonGrados}
                      onChange={(e) =>
                        setLonGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudDesdeDMS}
                      disabled={loading || camposDeshabilitados}
                      min="0"
                      max="180"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #2563eb",
                        fontSize: "18px", // ← MÁS GRANDE
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>

                {/* Minutos */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonMinutos}
                      onChange={(e) =>
                        setLonMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudDesdeDMS}
                      disabled={loading || camposDeshabilitados}
                      min="0"
                      max="59"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #2563eb",
                        fontSize: "18px", // ← MÁS GRANDE
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>

                {/* Segundos */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonSegundos}
                      onChange={(e) =>
                        setLonSegundos(parseFloat(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudDesdeDMS}
                      disabled={loading || camposDeshabilitados}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #2563eb",
                        fontSize: "18px", // ← MÁS GRANDE
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>

                {/* Dirección E/W - BLOQUEADO EN "W" PARA USUARIOS NORMALES */}
                <td style={{ padding: "4px", border: "1px solid #0EA5E9" }}>
                  <select
                    value={lonDireccion}
                    onChange={(e) => {
                      setLonDireccion(e.target.value);
                      actualizarLongitudDesdeDMS();
                    }}
                    disabled={
                      !esSuperUsuario || loading || camposDeshabilitados
                    } // ← SOLO SUPERUSUARIO PUEDE CAMBIAR
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: esSuperUsuario
                        ? "2px solid #f59e0b"
                        : "2px solid #94a3b8",
                      fontSize: "18px", // ← MÁS GRANDE
                      fontWeight: "bold",
                      textAlign: "center",
                      borderRadius: "4px",
                      backgroundColor: esSuperUsuario ? "#fef3c7" : "#f1f5f9",
                      cursor: esSuperUsuario ? "pointer" : "not-allowed",
                    }}
                  >
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                  {!esSuperUsuario && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#64748b",
                        textAlign: "center",
                        marginTop: "2px",
                      }}
                    >
                      🔒 Fijo
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <PanelMapaGeografico
        mapPosition={mapPosition}
        mapKey={mapKey}
        tipoMapa={tipoMapa}
        zoom={11}
        getTileConfig={getTileConfig}
        toggleFullscreen={toggleFullscreen}
        cambiarTipoMapa={cambiarTipoMapa}
        obtenerUbicacionUsuario={obtenerUbicacionUsuario}
        mapContainerRef={mapContainerRef}
        mapaFullscreen={mapaFullscreen}
        infoGeografica={infoGeografica}
        loadingGeo={loadingGeo}
        getClasificacionAguasColor={getClasificacionAguasColor}
        titulo="📍 Información Geográfica - Descarga"
        colapsadoPorDefecto={true}
      >
        <LineaRetornoPuerto />
        <MarkerPuertoDescarga />
        <DraggableMarker />
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
                disabled={loading}
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
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Capturar GPS"
            icon="pi pi-map-marker"
            className="p-button-warning"
            onClick={handleCapturarGPSFondeo}
            disabled={loading}
            size="small"
            style={{ width: "100%", marginBottom: "4px" }}
          />
          <Controller
            name="puertoFondeoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoFondeoId"
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={puertos.map((p) => ({
                  ...p,
                  id: Number(p.id),
                }))}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Puerto Fondeo"
                filter
                disabled={loading}
                className={classNames({ "p-invalid": errors.puertoFondeoId })}
                style={{ width: "100%" }}
              />
            )}
          />
          {errors.puertoFondeoId && (
            <Message severity="error" text={errors.puertoFondeoId.message} />
          )}
        </div>

        {/* Tabla compacta de coordenadas GPS FONDEO */}
        <div style={{ flex: 6 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "3px solid #F97316",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#F97316", color: "white" }}>
                <th
                  style={{
                    padding: "8px",
                    border: "1px solid #F97316",
                    fontSize: "14px",
                    fontWeight: "bold",
                    width: "100px",
                  }}
                >
                  Formato
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "8px",
                    border: "1px solid #F97316",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Latitud (Siempre SUR en Perú)
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "8px",
                    border: "1px solid #F97316",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Longitud (Siempre OESTE en Perú)
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Fila Decimal */}
              <tr>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #F97316",
                    fontWeight: "bold",
                    backgroundColor: "#FFF8E1",
                  }}
                >
                  Decimal
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "4px", border: "1px solid #F97316" }}
                >
                  <Controller
                    name="latitudFondeo"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        placeholder="-12.123456"
                        disabled={loading}
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={14}
                        min={-90}
                        max={90}
                        style={{
                          width: "100%",
                          fontSize: "20px",
                          padding: "8px",
                        }}
                      />
                    )}
                  />
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "4px", border: "1px solid #F97316" }}
                >
                  <Controller
                    name="longitudFondeo"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        placeholder="-77.123456"
                        disabled={loading}
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={14}
                        min={-180}
                        max={180}
                        style={{
                          width: "100%",
                          fontSize: "20px",
                          padding: "8px",
                        }}
                      />
                    )}
                  />
                </td>
              </tr>
              {/* Fila GMS */}
              <tr>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #F97316",
                    fontWeight: "bold",
                    backgroundColor: "#FFF8E1",
                  }}
                >
                  DMS
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latFondeoGrados}
                      onChange={(e) =>
                        setLatFondeoGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="90"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #F97316",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latFondeoMinutos}
                      onChange={(e) =>
                        setLatFondeoMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #F97316",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latFondeoSegundos}
                      onChange={(e) =>
                        setLatFondeoSegundos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #F97316",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <select
                    value={latFondeoDireccion}
                    onChange={(e) => {
                      setLatFondeoDireccion(e.target.value);
                      setTimeout(actualizarLatitudFondeoDesdeDMS, 0);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "18px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonFondeoGrados}
                      onChange={(e) =>
                        setLonFondeoGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="180"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #F97316",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonFondeoMinutos}
                      onChange={(e) =>
                        setLonFondeoMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #F97316",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonFondeoSegundos}
                      onChange={(e) =>
                        setLonFondeoSegundos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "140px",
                        padding: "8px",
                        border: "2px solid #F97316",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textAlign: "center",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>
                <td style={{ padding: "4px", border: "1px solid #F97316" }}>
                  <select
                    value={lonFondeoDireccion}
                    onChange={(e) => {
                      setLonFondeoDireccion(e.target.value);
                      setTimeout(actualizarLongitudFondeoDesdeDMS, 0);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "18px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <PanelMapaGeografico
        mapPosition={mapPositionFondeo}
        mapKey={mapKeyFondeo}
        tipoMapa={tipoMapaFondeo}
        zoom={11}
        getTileConfig={getTileConfigFondeo}
        toggleFullscreen={toggleFullscreenFondeo}
        cambiarTipoMapa={cambiarTipoMapaFondeo}
        obtenerUbicacionUsuario={obtenerUbicacionUsuarioFondeo}
        mapContainerRef={mapContainerRefFondeo}
        mapaFullscreen={mapaFullscreenFondeo}
        infoGeografica={infoGeograficaFondeo}
        loadingGeo={loadingGeoFondeo}
        getClasificacionAguasColor={getClasificacionAguasColor}
        titulo="📍 Información Geográfica - Fondeo"
        colapsadoPorDefecto={true}
      >
        <DraggableMarkerFondeo />
      </PanelMapaGeografico>
      <PanelResumenRecorrido />

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
