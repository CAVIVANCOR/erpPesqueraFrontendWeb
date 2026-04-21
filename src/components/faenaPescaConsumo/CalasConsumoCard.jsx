// src/components/faenaPescaConsumo/CalasConsumoCard.jsx
// Card para gestionar calas de FaenaPescaConsumo con sus especies pescadas
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
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";
import { confirmDialog } from "primereact/confirmdialog";
import { Controller, useForm } from "react-hook-form";
import { getResponsiveFontSize, formatearNumero, formatearFechaHora } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import {
  capturarGPS,
  formatearCoordenadas,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";
import {
  calcularConsumoFaena,
  calcularCostoCombustible,
  calcularDiferenciaTiempo,
  calcularVelocidadPromedio,
} from "../../utils/combustibleUtils";
import { analizarCoordenadasConReferencia } from "../../api/geolocalizacion";
import {
  DEFAULT_MAP_ZOOM,
  DEFAULT_TILE_LAYER,
  MARKER_ICONS,
} from "../../config/mapConfig";
import L from "leaflet";
import {
  getCalasFaenaConsumoPorFaena,
  crearCalaFaenaConsumo,
  actualizarCalaFaenaConsumo,
  eliminarCalaFaenaConsumo,
} from "../../api/calaFaenaConsumo";
import { getPuertoPescaPorId } from "../../api/puertoPesca";
import DetalleCalasConsumoEspecieForm from "./DetalleCalasConsumoEspecieForm";
import PanelMapaGeografico from "../shared/PanelMapaGeografico";
import { getPrecioCombustibleVigente } from "../../api/precioCombustible";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { getEmbarcacionPorId } from "../../api/embarcacion";

export default function CalasConsumoCard({
  faenaPescaConsumoId,
  novedadPescaConsumoId,
  faenaData,
  novedadData,
  bahias: bahiasProps = [],
  motoristas: motoristasProps = [],
  patrones: patronesProps = [],
  embarcaciones: embarcacionesProps = [],
  especies = [],
  onDataChange,
}) {
  const usuario = useAuthStore((state) => state.usuario);
  const esSuperUsuario = usuario?.esSuperUsuario || false;

  const [calas, setCalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogCalaVisible, setDialogCalaVisible] = useState(false);
  const [editingCala, setEditingCala] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");

  const [latGrados, setLatGrados] = useState(0);
  const [latMinutos, setLatMinutos] = useState(0);
  const [latSegundos, setLatSegundos] = useState(0);
  const [latDireccion, setLatDireccion] = useState("S");

  const [lonGrados, setLonGrados] = useState(0);
  const [lonMinutos, setLonMinutos] = useState(0);
  const [lonSegundos, setLonSegundos] = useState(0);
  const [lonDireccion, setLonDireccion] = useState("W");

  const [latitudFin, setLatitudFin] = useState("");
  const [longitudFin, setLongitudFin] = useState("");

  const [latFinGrados, setLatFinGrados] = useState(0);
  const [latFinMinutos, setLatFinMinutos] = useState(0);
  const [latFinSegundos, setLatFinSegundos] = useState(0);
  const [latFinDireccion, setLatFinDireccion] = useState("S");

  const [lonFinGrados, setLonFinGrados] = useState(0);
  const [lonFinMinutos, setLonFinMinutos] = useState(0);
  const [lonFinSegundos, setLonFinSegundos] = useState(0);
  const [lonFinDireccion, setLonFinDireccion] = useState("W");
  // Estados para información geográfica de INICIO de cala
  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);
  // NUEVO: Estados para información geográfica del Puerto de Salida
  const [infoPuerto, setInfoPuerto] = useState(null);
  const [loadingGeoPuerto, setLoadingGeoPuerto] = useState(false);
  const [coordenadasPuerto, setCoordenadasPuerto] = useState(null);
  // NUEVO: Estados para información geográfica de FIN de cala
  const [infoGeoFin, setInfoGeoFin] = useState(null);
  const [loadingGeoFin, setLoadingGeoFin] = useState(false);
  // NUEVO: Estados para cálculos de distancias y consumo
  const [distanciaPuertoInicio, setDistanciaPuertoInicio] = useState(0);
  const [distanciaInicioFin, setDistanciaInicioFin] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [consumoCombustible, setConsumoCombustible] = useState(null);
  const [tiempoNavegacion, setTiempoNavegacion] = useState(null);
  const [tiempoCala, setTiempoCala] = useState(null);
  const [velocidadNavegacion, setVelocidadNavegacion] = useState(0);
  const [velocidadCala, setVelocidadCala] = useState(0);
  const [precioCombustibleSoles, setPrecioCombustibleSoles] = useState(0);
  const [loadingPrecioCombustible, setLoadingPrecioCombustible] =
    useState(false);
  const [embarcacionCompleta, setEmbarcacionCompleta] = useState(null);
  const [mapPosition, setMapPosition] = useState([-8.1116, -79.0288]);
  const [mapKey, setMapKey] = useState(0);
  const [tipoMapa, setTipoMapa] = useState("street");
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const [bahias, setBahias] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [patrones, setPatrones] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [selectedBahiaId, setSelectedBahiaId] = useState(null);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState(null);
  const [selectedPatronId, setSelectedPatronId] = useState(null);
  const [selectedEmbarcacionId, setSelectedEmbarcacionId] = useState(null);
  const [createdAt, setCreatedAt] = useState(new Date());
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const toast = useRef(null);
  const {
    control: controlCala,
    handleSubmit: handleSubmitCala,
    reset: resetCala,
    setValue: setValueCala,
    formState: { errors: errorsCala },
  } = useForm({
    defaultValues: {
      profundidadM: null,
      fechaHoraInicio: null,
      fechaHoraFin: null,
      observaciones: "",
      latitud: null,
      longitud: null,
      latitudFin: null,
      longitudFin: null,
    },
  });

  // Cargar datos completos de la embarcación
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

  // Función para calcular distancia entre coordenadas usando fórmula Haversine
  const calcularDistanciaEntreCoordenadasEnMillas = (
    lat1,
    lon1,
    lat2,
    lon2,
  ) => {
    const R = 3440.065; // Radio de la Tierra en millas náuticas
    const lat1Rad = (Number(lat1) * Math.PI) / 180;
    const lat2Rad = (Number(lat2) * Math.PI) / 180;
    const deltaLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return distancia;
  };

  // Normalizar datos de combos
  useEffect(() => {
    if (
      bahiasProps.length > 0 ||
      motoristasProps.length > 0 ||
      patronesProps.length > 0 ||
      embarcacionesProps.length > 0
    ) {
      const bahiasNormalizadas = bahiasProps.map((b) => ({
        label: b.nombre || b.label,
        value: Number(b.id || b.value),
      }));
      const motoristasNormalizados = motoristasProps.map((m) => ({
        label: m.nombre || m.label,
        value: Number(m.id || m.value),
      }));
      const patronesNormalizados = patronesProps.map((p) => ({
        label: p.nombre || p.label,
        value: Number(p.id || p.value),
      }));
      const embarcacionesNormalizadas = embarcacionesProps.map((e) => ({
        label: e.nombre || e.label,
        value: Number(e.id || e.value),
      }));

      setBahias(bahiasNormalizadas);
      setMotoristas(motoristasNormalizados);
      setPatrones(patronesNormalizados);
      setEmbarcaciones(embarcacionesNormalizadas);

      if (faenaData) {
        setSelectedBahiaId(Number(faenaData.bahiaId));
        setSelectedMotoristaId(Number(faenaData.motoristaId));
        setSelectedPatronId(Number(faenaData.patronId));
        setSelectedEmbarcacionId(Number(faenaData.embarcacionId));
      }
    }
  }, [
    bahiasProps,
    motoristasProps,
    patronesProps,
    embarcacionesProps,
    faenaData,
  ]);

  // Cargar calas
  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarCalas();
    }
  }, [faenaPescaConsumoId]);

  // NUEVO: Cargar coordenadas del Puerto de Salida
  useEffect(() => {
    const cargarPuerto = async () => {
      if (faenaData?.puertoSalidaId) {
        try {
          setLoadingGeoPuerto(true);
          const puerto = await getPuertoPescaPorId(faenaData.puertoSalidaId);
          if (puerto && puerto.latitud && puerto.longitud) {
            const coords = {
              latitud: Number(puerto.latitud),
              longitud: Number(puerto.longitud),
              nombre: puerto.nombre,
            };
            setCoordenadasPuerto(coords);

            // Analizar coordenadas del puerto
            const info = await analizarCoordenadasConReferencia(
              coords.latitud,
              coords.longitud,
              null,
            );
            setInfoPuerto(info);
          }
        } catch (error) {
          console.error("Error al cargar puerto:", error);
        } finally {
          setLoadingGeoPuerto(false);
        }
      }
    };
    cargarPuerto();
  }, [faenaData?.puertoSalidaId]);

  // Sincronizar latitud decimal con DMS (INICIO)
  useEffect(() => {
    if (latitud !== "" && latitud !== null && latitud !== undefined) {
      const dms = descomponerDMS(Number(latitud), true);
      setLatGrados(dms.grados);
      setLatMinutos(dms.minutos);
      setLatSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatDireccion(dms.direccion);
    }
  }, [latitud]);

  // Sincronizar longitud decimal con DMS (INICIO)
  useEffect(() => {
    if (longitud !== "" && longitud !== null && longitud !== undefined) {
      const dms = descomponerDMS(Number(longitud), false);
      setLonGrados(dms.grados);
      setLonMinutos(dms.minutos);
      setLonSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonDireccion(dms.direccion);
    }
  }, [longitud]);

  // Sincronizar latitudFin decimal con DMS (FIN)
  useEffect(() => {
    if (latitudFin !== "" && latitudFin !== null && latitudFin !== undefined) {
      const dms = descomponerDMS(Number(latitudFin), true);
      setLatFinGrados(dms.grados);
      setLatFinMinutos(dms.minutos);
      setLatFinSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatFinDireccion(dms.direccion);
    }
  }, [latitudFin]);

  // Sincronizar longitudFin decimal con DMS (FIN)
  useEffect(() => {
    if (
      longitudFin !== "" &&
      longitudFin !== null &&
      longitudFin !== undefined
    ) {
      const dms = descomponerDMS(Number(longitudFin), false);
      setLonFinGrados(dms.grados);
      setLonFinMinutos(dms.minutos);
      setLonFinSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonFinDireccion(dms.direccion);
    }
  }, [longitudFin]);

  // Analizar información geográfica de Cala FIN (donde se pescó)
  useEffect(() => {
    const analizarCoordenadas = async () => {
      // Usar coordenadas de Cala FIN si existen, sino usar Cala INICIO
      const latAnalisis = latitudFin || latitud;
      const lonAnalisis = longitudFin || longitud;

      if (latAnalisis && lonAnalisis) {
        try {
          setLoadingGeo(true);
          const info = await analizarCoordenadasConReferencia(
            Number(latAnalisis),
            Number(lonAnalisis),
            null,
          );
          setInfoGeografica(info);
        } catch (error) {
          console.error("Error al analizar coordenadas:", error);
          setErrorGeo(error.message);
        } finally {
          setLoadingGeo(false);
        }
      }
    };
    analizarCoordenadas();
  }, [latitud, longitud, latitudFin, longitudFin]);

  // NUEVO: Analizar coordenadas de FIN cuando cambien
  useEffect(() => {
    const analizarFin = async () => {
      if (latitudFin && longitudFin) {
        try {
          setLoadingGeoFin(true);
          const info = await analizarCoordenadasConReferencia(
            Number(latitudFin),
            Number(longitudFin),
            null,
          );
          setInfoGeoFin(info);
        } catch (error) {
          console.error("Error al analizar coordenadas de fin:", error);
        } finally {
          setLoadingGeoFin(false);
        }
      }
    };
    analizarFin();
  }, [latitudFin, longitudFin]);

  // NUEVO: Calcular distancias cuando cambien las coordenadas
  useEffect(() => {
    if (coordenadasPuerto && latitud && longitud) {
      const distPuertoInicio = calcularDistanciaEntreCoordenadasEnMillas(
        coordenadasPuerto.latitud,
        coordenadasPuerto.longitud,
        Number(latitud),
        Number(longitud),
      );
      setDistanciaPuertoInicio(distPuertoInicio);
    }

    if (latitud && longitud && latitudFin && longitudFin) {
      const distInicioFin = calcularDistanciaEntreCoordenadasEnMillas(
        Number(latitud),
        Number(longitud),
        Number(latitudFin),
        Number(longitudFin),
      );
      setDistanciaInicioFin(distInicioFin);
    }

    // Calcular distancia total
    const total = (distanciaPuertoInicio || 0) + (distanciaInicioFin || 0);
    setDistanciaTotal(total);
  }, [
    coordenadasPuerto,
    latitud,
    longitud,
    latitudFin,
    longitudFin,
    distanciaPuertoInicio,
    distanciaInicioFin,
  ]);

  // NUEVO: Calcular tiempos cuando cambien las fechas
  useEffect(() => {
    if (faenaData?.fechaSalida && editingCala?.fechaHoraInicio) {
      const tiempo = calcularDiferenciaTiempo(
        faenaData.fechaSalida,
        editingCala.fechaHoraInicio,
      );
      setTiempoNavegacion(tiempo);

      // Calcular velocidad de navegación
      if (distanciaPuertoInicio && tiempo.totalHoras > 0) {
        const vel = calcularVelocidadPromedio(
          distanciaPuertoInicio,
          tiempo.totalHoras,
        );
        setVelocidadNavegacion(vel);
      }
    }

    if (editingCala?.fechaHoraInicio && editingCala?.fechaHoraFin) {
      const tiempo = calcularDiferenciaTiempo(
        editingCala.fechaHoraInicio,
        editingCala.fechaHoraFin,
      );
      setTiempoCala(tiempo);

      // Calcular velocidad en cala
      if (distanciaInicioFin && tiempo.totalHoras > 0) {
        const vel = calcularVelocidadPromedio(
          distanciaInicioFin,
          tiempo.totalHoras,
        );
        setVelocidadCala(vel);
      }
    }
  }, [
    faenaData?.fechaSalida,
    editingCala?.fechaHoraInicio,
    editingCala?.fechaHoraFin,
    distanciaPuertoInicio,
    distanciaInicioFin,
  ]);

  // NUEVO: Calcular consumo de combustible
  useEffect(() => {
    if (distanciaTotal > 0 && embarcacionCompleta?.millasNauticasPorGalon) {
      const rendimiento = Number(embarcacionCompleta.millasNauticasPorGalon);
      const galones = calcularConsumoFaena(distanciaTotal, rendimiento);
      const costo = calcularCostoCombustible(galones, precioCombustibleSoles);
      setConsumoCombustible({
        rendimiento: formatearNumero(rendimiento, 2),
        galones: formatearNumero(galones, 2),
        costo: formatearNumero(costo, 2),
      });
    } else {
      setConsumoCombustible(null);
    }
  }, [
    distanciaTotal,
    embarcacionCompleta?.millasNauticasPorGalon,
    precioCombustibleSoles,
  ]);

  // Obtener precio de combustible dinámico
  useEffect(() => {
    const obtenerPrecioCombustible = async () => {

      const fechaReferencia =
        editingCala?.fechaHoraFin ||
        editingCala?.fechaHoraInicio ||
        faenaData?.fechaSalida;

      if (!novedadData?.empresa?.entidadComercialId || !fechaReferencia) {
        return;
      }

      setLoadingPrecioCombustible(true);
      try {
        const precioCombustible = await getPrecioCombustibleVigente(
          Number(novedadData.empresa.entidadComercialId),
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

    obtenerPrecioCombustible();
  }, [
    novedadData?.empresa?.entidadComercialId,
    editingCala?.fechaHoraFin,
    editingCala?.fechaHoraInicio,
    faenaData?.fechaSalida,
  ]);

  // Centrar mapa automáticamente para mostrar todos los puntos
  useEffect(() => {
    if (!latitud || !longitud) return;

    const puntos = [];

    // Agregar puerto si existe
    if (coordenadasPuerto?.latitud && coordenadasPuerto?.longitud) {
      puntos.push([
        Number(coordenadasPuerto.latitud),
        Number(coordenadasPuerto.longitud),
      ]);
    }

    // Agregar Cala Inicio
    puntos.push([Number(latitud), Number(longitud)]);

    // Agregar Cala Fin si existe
    if (latitudFin && longitudFin) {
      puntos.push([Number(latitudFin), Number(longitudFin)]);
    }

    if (puntos.length > 0) {
      // Calcular bounds
      const lats = puntos.map((p) => p[0]);
      const lngs = puntos.map((p) => p[1]);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Calcular centro
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      setMapPosition([centerLat, centerLng]);
      setMapKey((prev) => prev + 1); // Forzar re-render del mapa
    }
  }, [coordenadasPuerto, latitud, longitud, latitudFin, longitudFin]);

  const cargarCalas = async () => {
    try {
      setLoading(true);
      const data = await getCalasFaenaConsumoPorFaena(faenaPescaConsumoId);
      setCalas(data || []);
    } catch (error) {
      console.error("Error al cargar calas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las calas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const actualizarLatitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latGrados,
      latMinutos,
      latSegundos,
      latDireccion,
    );
    setLatitud(decimal);
    setValueCala("latitud", decimal);
  };

  const actualizarLongitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonGrados,
      lonMinutos,
      lonSegundos,
      lonDireccion,
    );
    setLongitud(decimal);
    setValueCala("longitud", decimal);
  };

  const actualizarLatitudFinDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latFinGrados,
      latFinMinutos,
      latFinSegundos,
      latFinDireccion,
    );
    setLatitudFin(decimal);
    setValueCala("latitudFin", decimal);
  };

  const actualizarLongitudFinDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonFinGrados,
      lonFinMinutos,
      lonFinSegundos,
      lonFinDireccion,
    );
    setLongitudFin(decimal);
    setValueCala("longitudFin", decimal);
  };

  const handleNuevaCala = () => {
    setEditingCala(null);
    setLatitud("");
    setLongitud("");
    setLatitudFin("");
    setLongitudFin("");
    setInfoGeografica(null);
    setInfoGeoFin(null);
    setErrorGeo(null);
    setCreatedAt(new Date());
    setUpdatedAt(new Date());

    if (faenaData) {
      const bahiaIdNum = Number(faenaData.bahiaId);
      const motoristaIdNum = Number(faenaData.motoristaId);
      const patronIdNum = Number(faenaData.patronId);
      const embarcacionIdNum = Number(faenaData.embarcacionId);

      setSelectedBahiaId(bahiaIdNum);
      setSelectedMotoristaId(motoristaIdNum);
      setSelectedPatronId(patronIdNum);
      setSelectedEmbarcacionId(embarcacionIdNum);
    }

    resetCala({
      profundidadM: null,
      fechaHoraInicio: null,
      fechaHoraFin: null,
      observaciones: "",
      latitud: null,
      longitud: null,
      latitudFin: null,
      longitudFin: null,
    });

    setDialogCalaVisible(true);
  };

  const handleEditarCala = (cala) => {
    setEditingCala(cala);
    setLatitud(cala.latitud || "");
    setLongitud(cala.longitud || "");
    setLatitudFin(cala.latitudFin || "");
    setLongitudFin(cala.longitudFin || "");

    setSelectedBahiaId(Number(cala.bahiaId));
    setSelectedMotoristaId(Number(cala.motoristaId));
    setSelectedPatronId(Number(cala.patronId));
    setSelectedEmbarcacionId(Number(cala.embarcacionId));

    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : new Date());
    setUpdatedAt(new Date());

    resetCala({
      profundidadM: cala.profundidadM || null,
      fechaHoraInicio: cala.fechaHoraInicio
        ? new Date(cala.fechaHoraInicio)
        : null,
      fechaHoraFin: cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null,
      observaciones: cala.observaciones || "",
      latitud: cala.latitud || null,
      longitud: cala.longitud || null,
      latitudFin: cala.latitudFin || null,
      longitudFin: cala.longitudFin || null,
    });

    setDialogCalaVisible(true);
  };

  const handleEliminarCala = (cala) => {
    confirmDialog({
      message: "¿Está seguro de eliminar esta cala?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarCalaFaenaConsumo(cala.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Cala eliminada correctamente",
            life: 3000,
          });
          cargarCalas();
          onDataChange?.();
        } catch (error) {
          console.error("Error al eliminar cala:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar la cala",
            life: 3000,
          });
        }
      },
    });
  };

  const guardarCala = async (data) => {
    try {
      const calaData = {
        faenaPescaConsumoId: Number(faenaPescaConsumoId),
        novedadPescaConsumoId: Number(novedadPescaConsumoId),
        bahiaId: Number(selectedBahiaId || faenaData?.bahiaId),
        motoristaId: Number(selectedMotoristaId || faenaData?.motoristaId),
        patronId: Number(selectedPatronId || faenaData?.patronId),
        embarcacionId: Number(
          selectedEmbarcacionId || faenaData?.embarcacionId,
        ),
        fechaHoraInicio: data.fechaHoraInicio,
        fechaHoraFin: data.fechaHoraFin,
        latitud: latitud ? Number(latitud) : null,
        longitud: longitud ? Number(longitud) : null,
        latitudFin: latitudFin ? Number(latitudFin) : null,
        longitudFin: longitudFin ? Number(longitudFin) : null,
        profundidadM: data.profundidadM ? Number(data.profundidadM) : null,
        observaciones: data.observaciones || null,
      };

      if (editingCala) {
        await actualizarCalaFaenaConsumo(editingCala.id, calaData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cala actualizada correctamente",
          life: 3000,
        });
      } else {
        const nuevaCala = await crearCalaFaenaConsumo(calaData);
        setEditingCala(nuevaCala);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cala creada correctamente. Ahora puede agregar especies.",
          life: 4000,
        });
      }

      cargarCalas();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar la cala",
        life: 3000,
      });
    }
  };

  const onSubmitCala = (data) => {
    guardarCala(data);
  };

  // NUEVO: Componentes del mapa
  const DraggableMarker = () => {
    const markerRef = useRef(null);
    const nombreBahia =
      bahias.find(
        (b) =>
          Number(b.value) === Number(selectedBahiaId || faenaData?.bahiaId),
      )?.label || "Cala";

    const iconInicio = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
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
          setLatitud(lat);
          setLongitud(lng);
          setValueCala("latitud", lat);
          setValueCala("longitud", lng);
          setMapPosition([lat, lng]);
        }
      },
    };

    if (!latitud || !longitud) return null;

    return (
      <Marker
        position={[Number(latitud), Number(longitud)]}
        draggable={!loading}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={iconInicio}
      >
        <Popup>
          <strong>🔵 {nombreBahia} - INICIO</strong>
          <br />
          Lat: {formatearNumero(Number(latitud), 6)}
          <br />
          Lon: {formatearNumero(Number(longitud), 6)}
        </Popup>
      </Marker>
    );
  };

  const MarkerFin = () => {
    if (!latitudFin || !longitudFin) return null;

    const iconFin = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const nombreBahia =
      bahias.find(
        (b) =>
          Number(b.value) === Number(selectedBahiaId || faenaData?.bahiaId),
      )?.label || "Cala";

    return (
      <Marker
        position={[Number(latitudFin), Number(longitudFin)]}
        icon={iconFin}
      >
        <Popup>
          <strong>🔴 {nombreBahia} - FIN</strong>
          <br />
          Lat: {formatearNumero(Number(latitudFin), 6)}
          <br />
          Lon: {formatearNumero(Number(longitudFin), 6)}
        </Popup>
      </Marker>
    );
  };

  const MarkerPuerto = () => {
    if (!coordenadasPuerto) return null;

    const iconPuerto = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    return (
      <Marker
        position={[coordenadasPuerto.latitud, coordenadasPuerto.longitud]}
        icon={iconPuerto}
      >
        <Popup>
          <strong>🟣 {coordenadasPuerto.nombre}</strong>
          <br />
          Puerto de Salida
          <br />
          Lat: {formatearNumero(coordenadasPuerto.latitud, 6)}
          <br />
          Lon: {formatearNumero(coordenadasPuerto.longitud, 6)}
        </Popup>
      </Marker>
    );
  };

  const LineaPuertoInicio = () => {
    if (!coordenadasPuerto || !latitud || !longitud) return null;

    const positions = [
      [coordenadasPuerto.latitud, coordenadasPuerto.longitud],
      [Number(latitud), Number(longitud)],
    ];

    return (
      <Polyline
        positions={positions}
        color="#FCD34D"
        weight={3}
        opacity={0.8}
      />
    );
  };

  const LineaInicioFin = () => {
    if (!latitud || !longitud || !latitudFin || !longitudFin) return null;

    const positions = [
      [Number(latitud), Number(longitud)],
      [Number(latitudFin), Number(longitudFin)],
    ];

    return (
      <Polyline
        positions={positions}
        color="#EF4444"
        weight={3}
        opacity={0.8}
        dashArray="10, 5"
      />
    );
  };

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
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        setMapKey((prev) => prev + 1);
        toast.current.show({
          severity: "success",
          summary: "Ubicación obtenida",
          detail: "Mapa centrado en tu ubicación",
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

  const cambiarTipoMapa = () => {
    setTipoMapa((prev) => {
      if (prev === "street") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "street";
    });
  };

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

  const getClasificacionAguasColor = (clasificacion) => {
    if (!clasificacion) return "info";
    if (clasificacion.includes("Territorial")) return "danger";
    if (clasificacion.includes("Exclusiva")) return "success";
    return "info";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px", flexWrap: "nowrap" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-text"
          onClick={() => handleEditarCala(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => handleEliminarCala(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  // NUEVO: Panel de Resumen de Faena
  const PanelResumenFaena = () => {
    if (!distanciaTotal && !consumoCombustible) return null;

    return (
      <Panel
        header="⛽ Resumen de la Faena - Consumo de Combustible"
        toggleable
        collapsed={false}
        className="mb-3"
        style={{
          marginTop: "1rem",
          marginBottom: "1rem",
          border: "3px solid #059669",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Puerto de Salida */}
          {coordenadasPuerto && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#dbeafe",
                borderRadius: "8px",
                border: "2px solid #3b82f6",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e40af" }}>
                🚢 Puerto de Salida
              </h4>
              <p style={{ margin: "0.25rem 0", fontWeight: "bold" }}>
                {coordenadasPuerto.nombre}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                Lat: {formatearNumero(Number(coordenadasPuerto.latitud), 6)}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                Lon: {formatearNumero(Number(coordenadasPuerto.longitud), 6)}
              </p>
              {precioCombustibleSoles > 0 && (
                <>
                  <hr
                    style={{ margin: "0.5rem 0", border: "1px solid #93c5fd" }}
                  />
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    💰 Precio Combustible: S/{" "}
                    {formatearNumero(precioCombustibleSoles, 2)} /gal
                  </p>
                </>
              )}
            </div>
          )}

          {/* Puerto → Cala Inicio */}
          {distanciaPuertoInicio !== null && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#dcfce7",
                borderRadius: "8px",
                border: "2px solid #10b981",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#047857" }}>
                🟣 Puerto → 🟢 Cala Inicio
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#047857",
                }}
              >
                {formatearNumero(distanciaPuertoInicio, 2)} MN
              </p>
              {embarcacionCompleta?.millasNauticasPorGalon && (
                <>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    ⛽{" "}
                    {formatearNumero(
                      distanciaPuertoInicio /
                      Number(embarcacionCompleta.millasNauticasPorGalon),
                      2
                    )}{" "}
                    Galones
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    💰 S/{" "}
                    {formatearNumero(
                      (distanciaPuertoInicio /
                        Number(embarcacionCompleta.millasNauticasPorGalon)) *
                      precioCombustibleSoles,
                      2
                    )}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Cala Inicio → Cala Fin */}
          {distanciaInicioFin !== null && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fef3c7",
                borderRadius: "8px",
                border: "2px solid #f59e0b",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#92400e" }}>
                🟢 Cala Inicio → 🔴 Cala Fin
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#92400e",
                }}
              >
                {formatearNumero(distanciaInicioFin, 2)} MN
              </p>
              {embarcacionCompleta?.millasNauticasPorGalon && (
                <>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    ⛽{" "}
                    {formatearNumero(
                      distanciaInicioFin /
                      Number(embarcacionCompleta.millasNauticasPorGalon),
                      2
                    )}{" "}
                    Galones
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    💰 S/{" "}
                    {formatearNumero(
                      (distanciaInicioFin /
                        Number(embarcacionCompleta.millasNauticasPorGalon)) *
                      precioCombustibleSoles,
                      2
                    )}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Distancia Total */}
          {distanciaTotal > 0 && consumoCombustible && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fef9c3",
                borderRadius: "8px",
                border: "2px solid #eab308",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#713f12" }}>
                📊 Distancia Total
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#713f12",
                }}
              >
                {formatearNumero(distanciaTotal, 2)} MN
              </p>
              {embarcacionCompleta?.millasNauticasPorGalon && (
                <>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "0.9rem",
                    }}
                  >
                    ⛽{" "}
                    {formatearNumero(
                      distanciaTotal /
                      Number(embarcacionCompleta.millasNauticasPorGalon),
                      2
                    )}{" "}
                    Galones (Total)
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "0.9rem",
                    }}
                  >
                    💰 S/{" "}
                    {formatearNumero(
                      (distanciaTotal /
                        Number(embarcacionCompleta.millasNauticasPorGalon)) *
                      precioCombustibleSoles,
                      2
                    )}
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "0.85rem",
                      color: "#64748b",
                    }}
                  >
                    Rend:{" "}
                    {formatearNumero(
                      Number(embarcacionCompleta.millasNauticasPorGalon),
                      2
                    )}{" "}
                    MN/Gal
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "1rem", fontWeight: "bold" }}>
                    {embarcacionCompleta.activo?.nombre || "Embarcación"} -{" "}
                    {embarcacionCompleta.matricula}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </Panel>
    );
  };

  const calaDialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
      }}
    >
      <Button
        label="Cancelar"
        icon="pi pi-times"
        type="button"
        onClick={() => setDialogCalaVisible(false)}
        className="p-button-warning"
        severity="warning"
        raised
        size="small"
        outlined
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        type="button"
        onClick={handleSubmitCala(onSubmitCala)}
        className="p-button-success"
        severity="success"
        raised
        size="small"
        outlined
      />
    </div>
  );

  const calaDialogHeader = (
    <div className="flex justify-content-center mb-4">
      <Tag
        value={"Cala Consumo"}
        severity="info"
        style={{
          fontSize: "1.25rem",
          textTransform: "uppercase",
          fontWeight: "bold",
          textAlign: "center",
          width: "100%",
        }}
      />
    </div>
  );

  return (
    <Card>
      <Toast ref={toast} style={{ zIndex: 9999 }} baseZIndex={9999} />

      <Button
        label="Nueva Cala"
        icon="pi pi-plus"
        onClick={handleNuevaCala}
        className="mb-3"
        severity="success"
      />

      <DataTable
        value={calas}
        loading={loading}
        emptyMessage="No hay calas registradas"
        showGridlines
        stripedRows
        size="small"
        globalFilter={globalFilter}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        onRowClick={(e) => handleEditarCala(e.data)}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "4rem" }} />
        <Column
          field="latitud"
          header="Lat Inicio"
          sortable
          body={(rowData) =>
            rowData.latitud
              ? formatearNumero(parseFloat(rowData.latitud), 8)
              : formatearNumero(0, 8)
          }
          style={{ minWidth: "8rem" }}
        />
        <Column
          field="longitud"
          header="Lon Inicio"
          sortable
          body={(rowData) =>
            rowData.longitud
              ? formatearNumero(parseFloat(rowData.longitud), 8)
              : formatearNumero(0, 8)
          }
          style={{ minWidth: "8rem" }}
        />
        <Column
          field="latitudFin"
          header="Lat Fin"
          sortable
          body={(rowData) =>
            rowData.latitudFin ? formatearNumero(parseFloat(rowData.latitudFin), 8) : "-"
          }
          style={{ minWidth: "8rem" }}
        />
        <Column
          field="longitudFin"
          header="Lon Fin"
          sortable
          body={(rowData) =>
            rowData.longitudFin
              ? formatearNumero(parseFloat(rowData.longitudFin), 8)
              : "-"
          }
          style={{ minWidth: "8rem" }}
        />
        <Column
          field="fechaHoraInicio"
          header="Fecha Inicio"
          body={(rowData) => formatearFechaHora(rowData.fechaHoraInicio)}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="fechaHoraFin"
          header="Fecha Fin"
          body={(rowData) => formatearFechaHora(rowData.fechaHoraFin)}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: "10rem" }}
        />
      </DataTable>

      <Dialog
        visible={dialogCalaVisible}
        onHide={() => setDialogCalaVisible(false)}
        header={calaDialogHeader}
        footer={calaDialogFooter}
        style={{ width: "1300px" }}
        modal
        maximizable
        maximized="true"
        className="p-fluid"
      >
        <div className="grid">
          {/* Campos básicos de la cala */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="bahiaId">Bahía</label>
              <Dropdown
                id="bahiaId"
                value={selectedBahiaId}
                options={bahias}
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="motoristaId">Motorista</label>
              <Dropdown
                id="motoristaId"
                value={selectedMotoristaId}
                options={motoristas}
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="patronId">Patrón</label>
              <Dropdown
                id="patronId"
                value={selectedPatronId}
                options={patrones}
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="embarcacionId">Embarcación</label>
              <Dropdown
                id="embarcacionId"
                value={selectedEmbarcacionId}
                options={embarcaciones}
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="createdAt">Fecha Creación</label>
              <Calendar
                id="createdAt"
                value={createdAt}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="updatedAt">Fecha Actualización</label>
              <Calendar
                id="updatedAt"
                value={updatedAt}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraInicio">Fecha y Hora Inicio</label>
              <Controller
                name="fechaHoraInicio"
                control={controlCala}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraInicio"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    inputStyle={{ fontWeight: "bold" }}
                    showTime
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={loading}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="profundidadM">Profundidad (m)</label>
              <Controller
                name="profundidadM"
                control={controlCala}
                render={({ field }) => (
                  <InputNumber
                    id="profundidadM"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    suffix=" m"
                    inputStyle={{ fontWeight: "bold" }}
                    disabled={loading}
                  />
                )}
              />
            </div>
          </div>

          {/* GPS INICIO - Tabla verde */}
          <div
            style={{
              border: "6px solid #10B981",
              padding: "0.5rem",
              borderRadius: "8px",
              marginTop: "1rem",
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
                label="Capturar GPS INICIO"
                icon="pi pi-map-marker"
                className="p-button-success"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await capturarGPS(
                      async (latitude, longitude, accuracy) => {
                        setLatitud(latitude);
                        setLongitud(longitude);
                        setValueCala("latitud", latitude);
                        setValueCala("longitud", longitude);

                        toast.current?.show({
                          severity: "success",
                          summary: "GPS INICIO capturado",
                          detail: `GPS capturado con precisión de ${formatearNumero(accuracy, 1)}m. Presione Guardar para confirmar.`,
                          life: 3000,
                        });

                        setLoadingGeo(true);
                        setErrorGeo(null);
                        try {
                          const infoGeo =
                            await analizarCoordenadasConReferencia(
                              latitude,
                              longitude,
                              null,
                            );
                          setInfoGeografica(infoGeo);

                          toast.current?.show({
                            severity: "info",
                            summary: "Información geográfica obtenida",
                            detail: `Ubicación: ${infoGeo.ubicacion?.ciudad || "N/A"}`,
                            life: 3000,
                          });
                        } catch (error) {
                          console.error(
                            "Error al analizar coordenadas:",
                            error,
                          );
                          setErrorGeo(
                            "No se pudo obtener la información geográfica",
                          );
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
                        toast.current?.show({
                          severity: "error",
                          summary: "Error",
                          detail: errorMessage,
                          life: 3000,
                        });
                      },
                    );
                  } catch (error) {
                    console.error("Error capturando GPS:", error);
                  }
                }}
                disabled={loading}
                size="small"
              />
            </div>

            <div style={{ flex: 3 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "3px solid #10B981",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#10B981", color: "white" }}>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #10B981",
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
                        border: "1px solid #10B981",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Latitud INICIO
                    </th>
                    <th
                      colSpan="4"
                      style={{
                        padding: "8px",
                        border: "1px solid #10B981",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Longitud INICIO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #10B981",
                        fontWeight: "bold",
                        fontSize: "14px",
                        backgroundColor: "#d1fae5",
                        width: "100px",
                      }}
                    >
                      Decimal
                    </td>
                    <td
                      colSpan="4"
                      style={{ padding: "4px", border: "1px solid #10B981" }}
                    >
                      <InputNumber
                        value={latitud}
                        onValueChange={(e) => {
                          setLatitud(e.value);
                          setValueCala("latitud", e.value);
                        }}
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
                    </td>
                    <td
                      colSpan="4"
                      style={{ padding: "4px", border: "1px solid #10B981" }}
                    >
                      <InputNumber
                        value={longitud}
                        onValueChange={(e) => {
                          setLongitud(e.value);
                          setValueCala("longitud", e.value);
                        }}
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
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #10B981",
                        fontWeight: "bold",
                        fontSize: "14px",
                        backgroundColor: "#d1fae5",
                      }}
                    >
                      DMS
                    </td>

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
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
                          disabled={loading}
                          min="0"
                          max="90"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #059669",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
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
                          disabled={loading}
                          min="0"
                          max="59"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #059669",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
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
                          disabled={loading}
                          min="0"
                          max="59.99"
                          step="0.01"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #059669",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
                      <select
                        value={latDireccion}
                        onChange={(e) => {
                          setLatDireccion(e.target.value);
                          actualizarLatitudDesdeDMS();
                        }}
                        disabled={!esSuperUsuario || loading}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: esSuperUsuario
                            ? "2px solid #f59e0b"
                            : "2px solid #94a3b8",
                          fontSize: "18px",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderRadius: "4px",
                          backgroundColor: esSuperUsuario
                            ? "#fef3c7"
                            : "#f1f5f9",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
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
                          disabled={loading}
                          min="0"
                          max="180"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #2563eb",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
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
                          disabled={loading}
                          min="0"
                          max="59"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #2563eb",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
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
                          disabled={loading}
                          min="0"
                          max="59.99"
                          step="0.01"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #2563eb",
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

                    <td style={{ padding: "4px", border: "1px solid #10B981" }}>
                      <select
                        value={lonDireccion}
                        onChange={(e) => {
                          setLonDireccion(e.target.value);
                          actualizarLongitudDesdeDMS();
                        }}
                        disabled={!esSuperUsuario || loading}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: esSuperUsuario
                            ? "2px solid #f59e0b"
                            : "2px solid #94a3b8",
                          fontSize: "18px",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderRadius: "4px",
                          backgroundColor: esSuperUsuario
                            ? "#fef3c7"
                            : "#f1f5f9",
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

          {/* GPS FIN - Tabla roja */}
          <div
            style={{
              border: "6px solid #EF4444",
              padding: "0.5rem",
              borderRadius: "8px",
              marginTop: "0.5rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "self-end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Capturar GPS FIN"
                icon="pi pi-map-marker"
                className="p-button-danger"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await capturarGPS(
                      async (latitude, longitude, accuracy) => {
                        setLatitudFin(latitude);
                        setLongitudFin(longitude);
                        setValueCala("latitudFin", latitude);
                        setValueCala("longitudFin", longitude);

                        toast.current?.show({
                          severity: "success",
                          summary: "GPS FIN capturado",
                          detail: `GPS capturado con precisión de ${formatearNumero(accuracy, 1)}m. Presione Guardar para confirmar.`,
                          life: 3000,
                        });
                      },
                      (errorMessage) => {
                        toast.current?.show({
                          severity: "error",
                          summary: "Error",
                          detail: errorMessage,
                          life: 3000,
                        });
                      },
                    );
                  } catch (error) {
                    console.error("Error capturando GPS FIN:", error);
                  }
                }}
                disabled={loading}
                size="small"
              />
            </div>

            <div style={{ flex: 3 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "3px solid #EF4444",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#EF4444", color: "white" }}>
                    <th
                      style={{
                        padding: "8px",
                        border: "1px solid #EF4444",
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
                        border: "1px solid #EF4444",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Latitud FIN
                    </th>
                    <th
                      colSpan="4"
                      style={{
                        padding: "8px",
                        border: "1px solid #EF4444",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Longitud FIN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #EF4444",
                        fontWeight: "bold",
                        fontSize: "14px",
                        backgroundColor: "#fee2e2",
                        width: "100px",
                      }}
                    >
                      Decimal
                    </td>
                    <td
                      colSpan="4"
                      style={{ padding: "4px", border: "1px solid #EF4444" }}
                    >
                      <InputNumber
                        value={latitudFin}
                        onValueChange={(e) => {
                          setLatitudFin(e.value);
                          setValueCala("latitudFin", e.value);
                        }}
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
                    </td>
                    <td
                      colSpan="4"
                      style={{ padding: "4px", border: "1px solid #EF4444" }}
                    >
                      <InputNumber
                        value={longitudFin}
                        onValueChange={(e) => {
                          setLongitudFin(e.value);
                          setValueCala("longitudFin", e.value);
                        }}
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
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #EF4444",
                        fontWeight: "bold",
                        fontSize: "14px",
                        backgroundColor: "#fee2e2",
                      }}
                    >
                      DMS
                    </td>

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
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
                          value={latFinGrados}
                          onChange={(e) =>
                            setLatFinGrados(Number(e.target.value) || 0)
                          }
                          onBlur={actualizarLatitudFinDesdeDMS}
                          disabled={loading}
                          min="0"
                          max="90"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #dc2626",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
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
                          value={latFinMinutos}
                          onChange={(e) =>
                            setLatFinMinutos(Number(e.target.value) || 0)
                          }
                          onBlur={actualizarLatitudFinDesdeDMS}
                          disabled={loading}
                          min="0"
                          max="59"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #dc2626",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
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
                          value={latFinSegundos}
                          onChange={(e) =>
                            setLatFinSegundos(parseFloat(e.target.value) || 0)
                          }
                          onBlur={actualizarLatitudFinDesdeDMS}
                          disabled={loading}
                          min="0"
                          max="59.99"
                          step="0.01"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #dc2626",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
                      <select
                        value={latFinDireccion}
                        onChange={(e) => {
                          setLatFinDireccion(e.target.value);
                          actualizarLatitudFinDesdeDMS();
                        }}
                        disabled={!esSuperUsuario || loading}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: esSuperUsuario
                            ? "2px solid #f59e0b"
                            : "2px solid #94a3b8",
                          fontSize: "18px",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderRadius: "4px",
                          backgroundColor: esSuperUsuario
                            ? "#fef3c7"
                            : "#f1f5f9",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
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
                          value={lonFinGrados}
                          onChange={(e) =>
                            setLonFinGrados(Number(e.target.value) || 0)
                          }
                          onBlur={actualizarLongitudFinDesdeDMS}
                          disabled={loading}
                          min="0"
                          max="180"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #dc2626",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
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
                          value={lonFinMinutos}
                          onChange={(e) =>
                            setLonFinMinutos(Number(e.target.value) || 0)
                          }
                          onBlur={actualizarLongitudFinDesdeDMS}
                          disabled={loading}
                          min="0"
                          max="59"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #dc2626",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
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
                          value={lonFinSegundos}
                          onChange={(e) =>
                            setLonFinSegundos(parseFloat(e.target.value) || 0)
                          }
                          onBlur={actualizarLongitudFinDesdeDMS}
                          disabled={loading}
                          min="0"
                          max="59.99"
                          step="0.01"
                          style={{
                            width: "140px",
                            padding: "8px",
                            border: "2px solid #dc2626",
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

                    <td style={{ padding: "4px", border: "1px solid #EF4444" }}>
                      <select
                        value={lonFinDireccion}
                        onChange={(e) => {
                          setLonFinDireccion(e.target.value);
                          actualizarLongitudFinDesdeDMS();
                        }}
                        disabled={!esSuperUsuario || loading}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: esSuperUsuario
                            ? "2px solid #f59e0b"
                            : "2px solid #94a3b8",
                          fontSize: "18px",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderRadius: "4px",
                          backgroundColor: esSuperUsuario
                            ? "#fef3c7"
                            : "#f1f5f9",
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

          {/* Panel de Mapa Geográfico */}
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
            infoGeografica={infoGeografica}
            loadingGeo={loadingGeo}
            getClasificacionAguasColor={getClasificacionAguasColor}
            titulo="📍 Información Geográfica - Cala"
            colapsadoPorDefecto={true}
          >
            <MarkerPuerto />
            <DraggableMarker />
            <MarkerFin />
            <LineaPuertoInicio />
            <LineaInicioFin />
          </PanelMapaGeografico>
          {/* NUEVO: Panel de Resumen */}
          <PanelResumenFaena />
          {/* Formulario de Especies */}
          <DetalleCalasConsumoEspecieForm
            calaId={editingCala?.id}
            faenaPescaConsumoId={faenaPescaConsumoId}
            onDataChange={onDataChange}
          />

          {/* Campos finales */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraFin">Fecha y Hora Fin</label>
              <Controller
                name="fechaHoraFin"
                control={controlCala}
                render={({ field }) => (
                  <Calendar
                    id="fechaHoraFin"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    inputStyle={{ fontWeight: "bold" }}
                    showTime
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={loading}
                  />
                )}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="observaciones">Observaciones</label>
              <Controller
                name="observaciones"
                control={controlCala}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    style={{ fontWeight: "bold", fontStyle: "italic" }}
                    rows={1}
                    cols={20}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
