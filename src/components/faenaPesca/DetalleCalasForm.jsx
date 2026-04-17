/**
 * DetalleCalasForm.jsx
 * Componente para mostrar y gestionar las calas de una faena de pesca.
 * Permite listar, crear y editar registros de Cala.
 * @author ERP Megui
 * @version 1.2.0 - Agregado soporte para consumo de combustible
 */
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
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { Panel } from "primereact/panel";
import { getResponsiveFontSize } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import {
  capturarGPS,
  formatearCoordenadas,
  crearInputCoordenadas,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";
import { analizarCoordenadasConReferencia } from "../../api/geolocalizacion";
import { DEFAULT_MAP_ZOOM, MARKER_ICONS } from "../../config/mapConfig";
import PanelMapaGeografico from "../shared/PanelMapaGeografico";
import L from "leaflet";
import DetalleCalasEspecieForm from "./DetalleCalasEspecieForm";
import {
  getCalasPorFaena,
  crearCala,
  actualizarCala,
  eliminarCala,
} from "../../api/cala";
import { getPuertoPescaPorId } from "../../api/puertoPesca";
import { getEmbarcacionPorId } from "../../api/embarcacion";
import {
  calcularConsumoFaena,
  calcularCostoCombustible,
  calcularDiferenciaTiempo,
  calcularVelocidadPromedio,
} from "../../utils/combustibleUtils";
import { getPrecioCombustibleVigente } from "../../api/precioCombustible";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";

const DetalleCalasForm = ({
  faenaPescaId,
  temporadaData,
  faenaData,
  faenaDescripcion,
  bahias: bahiasProps = [],
  motoristas: motoristasProps = [],
  patrones: patronesProps = [],
  puertos: puertosProps = [],
  embarcaciones: embarcacionesProps = [],
  loading = false,
  onDataChange,
  onCalasChange,
  onFaenasChange,
}) => {
  const usuario = useAuthStore((state) => state.usuario);
  const esSuperUsuario = usuario?.esSuperUsuario || false;

  const [calas, setCalas] = useState([]);
  const [selectedCala, setSelectedCala] = useState(null);
  const [calaDialog, setCalaDialog] = useState(false);
  const [editingCala, setEditingCala] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const [fechaHoraInicio, setFechaHoraInicio] = useState(null);
  const [fechaHoraFin, setFechaHoraFin] = useState(null);
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [profundidadM, setProfundidadM] = useState("");
  const [toneladasCapturadas, setToneladasCapturadas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [calaSeleccionadaId, setCalaSeleccionadaId] = useState(null);

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

  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);

  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const [tipoMapa, setTipoMapa] = useState("street");
  const [mapPosition, setMapPosition] = useState([-12.0, -77.0]);
  const [mapKey, setMapKey] = useState(0);

  const [bahias, setBahias] = useState(bahiasProps);
  const [motoristas, setMotoristas] = useState(motoristasProps);
  const [patrones, setPatrones] = useState(patronesProps);
  const [embarcaciones, setEmbarcaciones] = useState(embarcacionesProps);

  const [selectedBahiaId, setSelectedBahiaId] = useState(null);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState(null);
  const [selectedPatronId, setSelectedPatronId] = useState(null);
  const [selectedEmbarcacionId, setSelectedEmbarcacionId] = useState(null);

  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [puertoDatos, setPuertoDatos] = useState(null);
  const [distanciaPuertoInicio, setDistanciaPuertoInicio] = useState(null);
  const [distanciaInicioFin, setDistanciaInicioFin] = useState(null);
  const [distanciaTotal, setDistanciaTotal] = useState(null);
  const [consumoCombustible, setConsumoCombustible] = useState(null);
  const [costoCombustible, setCostoCombustible] = useState(null);
  const [tiempoPuertoInicio, setTiempoPuertoInicio] = useState(null);
  const [tiempoInicioFin, setTiempoInicioFin] = useState(null);
  const [tiempoTotal, setTiempoTotal] = useState(null);
  const [velocidadPromedioPuertoInicio, setVelocidadPromedioPuertoInicio] =
    useState(null);
  const [velocidadPromedioInicioFin, setVelocidadPromedioInicioFin] =
    useState(null);
  const [velocidadPromedioTotal, setVelocidadPromedioTotal] = useState(null);
  const [precioCombustibleSoles, setPrecioCombustibleSoles] = useState(0);
  const [loadingPrecioCombustible, setLoadingPrecioCombustible] =
    useState(false);
  const [embarcacionCompleta, setEmbarcacionCompleta] = useState(null);

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

  useEffect(() => {
    if (faenaPescaId) {
      cargarCalas();
    }
  }, [faenaPescaId]);

  useEffect(() => {
    if (latitud !== "" && latitud !== null && latitud !== undefined) {
      const dms = descomponerDMS(Number(latitud), true);
      setLatGrados(dms.grados);
      setLatMinutos(dms.minutos);
      setLatSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatDireccion(dms.direccion);
    }
  }, [latitud]);

  useEffect(() => {
    if (longitud !== "" && longitud !== null && longitud !== undefined) {
      const dms = descomponerDMS(Number(longitud), false);
      setLonGrados(dms.grados);
      setLonMinutos(dms.minutos);
      setLonSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonDireccion(dms.direccion);
    }
  }, [longitud]);

  useEffect(() => {
    if (latitudFin !== "" && latitudFin !== null && latitudFin !== undefined) {
      const dms = descomponerDMS(Number(latitudFin), true);
      setLatFinGrados(dms.grados);
      setLatFinMinutos(dms.minutos);
      setLatFinSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatFinDireccion(dms.direccion);
    }
  }, [latitudFin]);

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

  useEffect(() => {
    if (latitud && longitud && !loadingGeo) {
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

  useEffect(() => {
    if (
      bahiasProps?.length > 0 &&
      motoristasProps?.length > 0 &&
      patronesProps?.length > 0 &&
      embarcacionesProps?.length > 0
    ) {
      const bahiasNormalizadas = bahiasProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      const motoristasNormalizados = motoristasProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      const patronesNormalizados = patronesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      const embarcacionesNormalizadas = embarcacionesProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
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

  useEffect(() => {
    const cargarPuerto = async () => {
      if (faenaData?.puertoSalidaId) {
        try {
          const puerto = await getPuertoPescaPorId(faenaData.puertoSalidaId);
          setPuertoDatos(puerto);
        } catch (error) {
          console.error("Error cargando puerto:", error);
        }
      }
    };
    cargarPuerto();
  }, [faenaData?.puertoSalidaId]);

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

  useEffect(() => {
    if (puertoDatos?.latitud && puertoDatos?.longitud && latitud && longitud) {
      const R = 3440.065;
      const lat1 = (Number(puertoDatos.latitud) * Math.PI) / 180;
      const lat2 = (Number(latitud) * Math.PI) / 180;
      const deltaLat =
        ((Number(latitud) - Number(puertoDatos.latitud)) * Math.PI) / 180;
      const deltaLon =
        ((Number(longitud) - Number(puertoDatos.longitud)) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLon / 2) *
          Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distancia = R * c;

      setDistanciaPuertoInicio(distancia);
    } else {
      setDistanciaPuertoInicio(null);
    }
  }, [puertoDatos, latitud, longitud]);

  useEffect(() => {
    if (latitud && longitud && latitudFin && longitudFin) {
      const R = 3440.065;
      const lat1 = (Number(latitud) * Math.PI) / 180;
      const lat2 = (Number(latitudFin) * Math.PI) / 180;
      const deltaLat = ((Number(latitudFin) - Number(latitud)) * Math.PI) / 180;
      const deltaLon =
        ((Number(longitudFin) - Number(longitud)) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLon / 2) *
          Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distancia = R * c;

      setDistanciaInicioFin(distancia);
    } else {
      setDistanciaInicioFin(null);
    }
  }, [latitud, longitud, latitudFin, longitudFin]);

  useEffect(() => {
    if (distanciaPuertoInicio !== null && distanciaInicioFin !== null) {
      setDistanciaTotal(distanciaPuertoInicio + distanciaInicioFin);
    } else if (distanciaPuertoInicio !== null) {
      setDistanciaTotal(distanciaPuertoInicio);
    } else {
      setDistanciaTotal(null);
    }
  }, [distanciaPuertoInicio, distanciaInicioFin]);

  useEffect(() => {
    if (
      faenaData?.fechaSalida &&
      fechaHoraInicio &&
      fechaHoraFin &&
      distanciaTotal !== null &&
      faenaData?.embarcacion?.millasNauticasPorGalon
    ) {
      const consumo = calcularConsumoFaena(
        distanciaTotal,
        Number(embarcacionCompleta.millasNauticasPorGalon),
      );
      setConsumoCombustible(consumo);

      const costo = calcularCostoCombustible(consumo, precioCombustibleSoles);
      setCostoCombustible(costo);
    } else {
      setConsumoCombustible(null);
      setCostoCombustible(null);
    }
  }, [
    distanciaTotal,
    faenaData?.embarcacion?.millasNauticasPorGalon,
    faenaData?.fechaSalida,
    fechaHoraInicio,
    fechaHoraFin,
    precioCombustibleSoles,
  ]);

  useEffect(() => {
    if (faenaData?.fechaSalida && fechaHoraInicio) {
      const tiempo = calcularDiferenciaTiempo(
        faenaData.fechaSalida,
        fechaHoraInicio,
      );
      setTiempoPuertoInicio(tiempo);
    } else {
      setTiempoPuertoInicio(null);
    }
  }, [faenaData?.fechaSalida, fechaHoraInicio]);

  useEffect(() => {
    if (fechaHoraInicio && fechaHoraFin) {
      const tiempo = calcularDiferenciaTiempo(fechaHoraInicio, fechaHoraFin);
      setTiempoInicioFin(tiempo);
    } else {
      setTiempoInicioFin(null);
    }
  }, [fechaHoraInicio, fechaHoraFin]);

  useEffect(() => {
    if (faenaData?.fechaSalida && fechaHoraFin) {
      const tiempo = calcularDiferenciaTiempo(
        faenaData.fechaSalida,
        fechaHoraFin,
      );
      setTiempoTotal(tiempo);
    } else {
      setTiempoTotal(null);
    }
  }, [faenaData?.fechaSalida, fechaHoraFin]);

  useEffect(() => {
    if (distanciaPuertoInicio !== null && tiempoPuertoInicio !== null) {
      const velocidad = calcularVelocidadPromedio(
        distanciaPuertoInicio,
        tiempoPuertoInicio,
      );
      setVelocidadPromedioPuertoInicio(velocidad);
    } else {
      setVelocidadPromedioPuertoInicio(null);
    }
  }, [distanciaPuertoInicio, tiempoPuertoInicio]);

  useEffect(() => {
    if (distanciaInicioFin !== null && tiempoInicioFin !== null) {
      const velocidad = calcularVelocidadPromedio(
        distanciaInicioFin,
        tiempoInicioFin,
      );
      setVelocidadPromedioInicioFin(velocidad);
    } else {
      setVelocidadPromedioInicioFin(null);
    }
  }, [distanciaInicioFin, tiempoInicioFin]);

  useEffect(() => {
    if (distanciaTotal !== null && tiempoTotal !== null) {
      const velocidad = calcularVelocidadPromedio(distanciaTotal, tiempoTotal);
      setVelocidadPromedioTotal(velocidad);
    } else {
      setVelocidadPromedioTotal(null);
    }
  }, [distanciaTotal, tiempoTotal]);

  // Obtener precio de combustible dinámico
  useEffect(() => {
    const obtenerPrecioCombustible = async () => {

      const fechaReferencia =
        fechaHoraFin || fechaHoraInicio || faenaData?.fechaSalida;

      if (!temporadaData?.empresa?.entidadComercialId || !fechaReferencia) {
        return;
      }
      setLoadingPrecioCombustible(true);
      try {
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

        // Si está en dólares, convertir a soles
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
    temporadaData?.empresaId,
    fechaHoraFin,
    fechaHoraInicio,
    faenaData?.fechaSalida,
  ]);

  // Centrar mapa automáticamente para mostrar todos los puntos
  useEffect(() => {
    if (!latitud || !longitud) return;

    const puntos = [];

    // Agregar puerto si existe
    if (puertoDatos?.latitud && puertoDatos?.longitud) {
      puntos.push([Number(puertoDatos.latitud), Number(puertoDatos.longitud)]);
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
  }, [puertoDatos, latitud, longitud, latitudFin, longitudFin]);

  const cargarCalas = async () => {
    if (!faenaPescaId) {
      setCalas([]);
      return;
    }

    try {
      const response = await getCalasPorFaena(faenaPescaId);
      setCalas(response);
      onCalasChange(response);
    } catch (error) {
      console.error("Error cargando calas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las calas",
        life: 3000,
      });
    }
  };

  const abrirNuevaCala = () => {
    limpiarFormulario();
    setEditingCala(null);
    setFechaHoraInicio(new Date());
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

    setCalaDialog(true);
  };

  const editarCala = (cala) => {
    setEditingCala(cala);
    setFechaHoraInicio(
      cala.fechaHoraInicio ? new Date(cala.fechaHoraInicio) : null,
    );
    setFechaHoraFin(cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null);
    setLatitud(cala.latitud || "");
    setLongitud(cala.longitud || "");
    setLatitudFin(cala.latitudFin || "");
    setLongitudFin(cala.longitudFin || "");
    setProfundidadM(cala.profundidadM || "");
    setToneladasCapturadas(cala.toneladasCapturadas || "");
    setObservaciones(cala.observaciones || "");
    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : null);
    setUpdatedAt(cala.updatedAt ? new Date(cala.updatedAt) : null);

    const bahiaValue = Number(cala.bahiaId || faenaData?.bahiaId);
    const motoristaValue = Number(cala.motoristaId || faenaData?.motoristaId);
    const patronValue = Number(cala.patronId || faenaData?.patronId);
    const embarcacionValue = Number(
      cala.embarcacionId || faenaData?.embarcacionId,
    );

    setSelectedBahiaId(bahiaValue);
    setSelectedMotoristaId(motoristaValue);
    setSelectedPatronId(patronValue);
    setSelectedEmbarcacionId(embarcacionValue);
    setCalaDialog(true);
  };

  const actualizarLatitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latGrados,
      latMinutos,
      latSegundos,
      latDireccion,
    );
    setLatitud(decimal);
  };

  const actualizarLongitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonGrados,
      lonMinutos,
      lonSegundos,
      lonDireccion,
    );
    setLongitud(decimal);
  };

  const actualizarLatitudFinDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latFinGrados,
      latFinMinutos,
      latFinSegundos,
      latFinDireccion,
    );
    setLatitudFin(decimal);
  };

  const actualizarLongitudFinDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonFinGrados,
      lonFinMinutos,
      lonFinSegundos,
      lonFinDireccion,
    );
    setLongitudFin(decimal);
  };

  const finalizarCala = async (cala) => {
    try {
      const calaData = {
        ...cala,
        fechaHoraFin: new Date(),
      };

      await actualizarCala(cala.id, calaData);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cala finalizada",
        life: 3000,
      });

      cargarCalas();
      onCalasChange();
    } catch (error) {
      console.error("Error finalizando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al finalizar la cala",
        life: 3000,
      });
    }
  };

  const eliminarCalaRecord = async (cala) => {
    try {
      await eliminarCala(cala.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cala eliminada",
        life: 3000,
      });

      cargarCalas();
      onCalasChange();
    } catch (error) {
      console.error("Error eliminando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la cala",
        life: 3000,
      });
    }
  };

  const limpiarFormulario = () => {
    setFechaHoraInicio(null);
    setFechaHoraFin(null);
    setLatitud("");
    setLongitud("");
    setLatitudFin("");
    setLongitudFin("");
    setProfundidadM("");
    setToneladasCapturadas("");
    setObservaciones("");

    setSelectedBahiaId(null);
    setSelectedMotoristaId(null);
    setSelectedPatronId(null);
    setSelectedEmbarcacionId(null);

    setCreatedAt(null);
    setUpdatedAt(null);
  };

  const MarkerPuerto = () => {
    if (!puertoDatos?.latitud || !puertoDatos?.longitud) return null;

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
        position={[Number(puertoDatos.latitud), Number(puertoDatos.longitud)]}
        icon={iconPuerto}
      >
        <Popup>
          <strong>🟣 {puertoDatos.nombre}</strong>
          <br />
          Lat: {Number(puertoDatos.latitud).toFixed(6)}
          <br />
          Lon: {Number(puertoDatos.longitud).toFixed(6)}
        </Popup>
      </Marker>
    );
  };

  const DraggableMarker = () => {
    const markerRef = useRef(null);
    const nombreBahia =
      bahias.find(
        (b) =>
          Number(b.value) === Number(selectedBahiaId || faenaData?.bahiaId),
      )?.label || "Cala";

    const eventHandlers = {
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setLatitud(lat);
          setLongitud(lng);
          setMapPosition([lat, lng]);
        }
      },
    };

    return (
      <Marker
        position={
          latitud && longitud
            ? [Number(latitud), Number(longitud)]
            : mapPosition
        }
        draggable={
          !(calaFinalizada && !esSuperUsuario) && !camposDeshabilitados
        }
        eventHandlers={eventHandlers}
        ref={markerRef}
      >
        <Popup>
          <strong>{nombreBahia} - INICIO</strong>
          <br />
          Lat: {Number(latitud).toFixed(6)}
          <br />
          Lon: {Number(longitud).toFixed(6)}
        </Popup>
      </Marker>
    );
  };

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

  const DistanceLine = () => {
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

  const LineaPuertoInicio = () => {

    if (
      !puertoDatos?.latitud ||
      !puertoDatos?.longitud ||
      !latitud ||
      !longitud
    ) {
      return null;
    }
    const positions = [
      [Number(puertoDatos.latitud), Number(puertoDatos.longitud)],
      [Number(latitud), Number(longitud)],
    ];

    return (
      <Polyline positions={positions} color="#FBBF24" weight={5} opacity={1} />
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
        color="#DC2626"
        weight={5}
        opacity={1}
        dashArray="10, 5"
      />
    );
  };

  const MarkerFin = () => {
    if (!latitudFin || !longitudFin || latitudFin === "" || longitudFin === "")
      return null;

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
          <strong>{nombreBahia} - FIN</strong>
          <br />
          Lat: {Number(latitudFin).toFixed(6)}
          <br />
          Lon: {Number(longitudFin).toFixed(6)}
        </Popup>
      </Marker>
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

  const guardarCala = async (cerrarDialogo = true) => {
    try {
      const calaData = {
        bahiaId: Number(selectedBahiaId || faenaData?.bahiaId),
        motoristaId: Number(selectedMotoristaId || faenaData?.motoristaId),
        patronId: Number(selectedPatronId || faenaData?.patronId),
        embarcacionId: Number(
          selectedEmbarcacionId || faenaData?.embarcacionId,
        ),
        faenaPescaId: Number(faenaPescaId),
        temporadaPescaId: Number(temporadaData?.id),
        fechaHoraInicio,
        fechaHoraFin,
        latitud: latitud ? Number(latitud) : null,
        longitud: longitud ? Number(longitud) : null,
        latitudFin: latitudFin ? Number(latitudFin) : null,
        longitudFin: longitudFin ? Number(longitudFin) : null,
        profundidadM: profundidadM ? Number(profundidadM) : null,
        toneladasCapturadas: toneladasCapturadas
          ? Number(toneladasCapturadas)
          : null,
        observaciones: observaciones || null,
        updatedAt: new Date(),
      };

      let nuevaCalaCreada = null;

      if (editingCala) {
        await actualizarCala(editingCala.id, calaData);
        toast.current?.show({
          severity: "success",
          summary: "Cala Actualizada",
          detail: "Cala actualizada correctamente",
          life: 3000,
        });
        if (cerrarDialogo) {
          setCalaDialog(false);
        }
      } else {
        nuevaCalaCreada = await crearCala(calaData);
        setEditingCala(nuevaCalaCreada);

        toast.current?.show({
          severity: "success",
          summary: "Cala Creada",
          detail: "Cala creada correctamente. Ahora puede agregar especies.",
          life: 4000,
        });
      }

      cargarCalas();
      onCalasChange();
    } catch (error) {
      console.error("Error guardando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar la cala",
        life: 3000,
      });
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const iniciarCala = async (cala) => {
    if (!cala || fechaHoraInicio) {
      return;
    }

    try {
      const ahora = new Date();
      setFechaHoraInicio(ahora);

      const calaActualizada = {
        ...cala,
        fechaHoraInicio: ahora.toISOString(),
      };

      await actualizarCala(cala.id, calaActualizada);

      toast.current?.show({
        severity: "success",
        summary: "Cala Iniciada",
        detail: `Cala iniciada a las ${ahora.toLocaleTimeString()}`,
        life: 3000,
      });

      cargarCalas();
      onCalasChange();
    } catch (error) {
      console.error("Error iniciando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al iniciar la cala",
        life: 3000,
      });
    }
  };

  const finalizarCalaAction = async (cala) => {
    if (!cala || !fechaHoraInicio || fechaHoraFin) {
      return;
    }

    try {
      const ahora = new Date();
      setFechaHoraFin(ahora);

      const calaActualizada = {
        ...cala,
        fechaHoraFin: ahora.toISOString(),
      };

      await actualizarCala(cala.id, calaActualizada);

      toast.current?.show({
        severity: "success",
        summary: "Cala Finalizada",
        detail: `Cala finalizada a las ${ahora.toLocaleTimeString()}`,
        life: 3000,
      });

      cargarCalas();
      onCalasChange();
    } catch (error) {
      console.error("Error finalizando cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al finalizar la cala",
        life: 3000,
      });
    }
  };

  const PanelResumenFaena = () => {
    const hayDatos =
      distanciaPuertoInicio !== null ||
      distanciaInicioFin !== null ||
      distanciaTotal !== null ||
      consumoCombustible !== null ||
      costoCombustible !== null;

    if (!hayDatos) return null;

    return (
      <Panel
        header="⛽ Resumen de la Faena - Consumo de Combustible"
        toggleable
        collapsed={false}
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
          {puertoDatos && (
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
                {puertoDatos.nombre}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                Lat: {Number(puertoDatos.latitud).toFixed(6)}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                Lon: {Number(puertoDatos.longitud).toFixed(6)}
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
                    {precioCombustibleSoles.toFixed(2)} /gal
                  </p>
                </>
              )}
            </div>
          )}

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
                {distanciaPuertoInicio.toFixed(2)} MN
              </p>
              {embarcacionCompleta?.millasNauticasPorGalon && (
                <>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    ⛽{" "}
                    {(
                      distanciaPuertoInicio /
                      Number(embarcacionCompleta.millasNauticasPorGalon)
                    ).toFixed(2)}{" "}
                    Galones
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    💰 S/{" "}
                    {(
                      (distanciaPuertoInicio /
                        Number(embarcacionCompleta.millasNauticasPorGalon)) *
                      precioCombustibleSoles
                    ).toFixed(2)}
                  </p>
                </>
              )}
              {tiempoPuertoInicio && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  ⏱️ Tiempo: {tiempoPuertoInicio}
                </p>
              )}
              {velocidadPromedioPuertoInicio !== null && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  🚤 Velocidad: {velocidadPromedioPuertoInicio.toFixed(2)} nudos
                </p>
              )}
            </div>
          )}

          {distanciaInicioFin !== null && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fee2e2",
                borderRadius: "8px",
                border: "2px solid #ef4444",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#b91c1c" }}>
                🟢 Cala Inicio → 🔴 Cala Fin
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#b91c1c",
                }}
              >
                {distanciaInicioFin.toFixed(2)} MN
              </p>
              {embarcacionCompleta?.millasNauticasPorGalon && (
                <>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    ⛽{" "}
                    {(
                      distanciaInicioFin /
                      Number(embarcacionCompleta.millasNauticasPorGalon)
                    ).toFixed(2)}{" "}
                    Galones
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    💰 S/{" "}
                    {(() => {
                      const galones =
                        distanciaInicioFin /
                        Number(embarcacionCompleta.millasNauticasPorGalon);
                      const costo = galones * precioCombustibleSoles;
                      return costo.toFixed(2);
                    })()}
                  </p>
                </>
              )}
              {tiempoInicioFin && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  ⏱️ Tiempo: {tiempoInicioFin}
                </p>
              )}
              {velocidadPromedioInicioFin !== null && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  🚤 Velocidad: {velocidadPromedioInicioFin.toFixed(2)} nudos
                </p>
              )}
            </div>
          )}

          {distanciaTotal !== null && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fef3c7",
                borderRadius: "8px",
                border: "2px solid #f59e0b",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#92400e" }}>
                📏 Distancia Total
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#92400e",
                }}
              >
                {distanciaTotal.toFixed(2)} MN
              </p>
              {embarcacionCompleta?.millasNauticasPorGalon && (
                <>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    ⛽{" "}
                    {(
                      distanciaTotal /
                      Number(embarcacionCompleta.millasNauticasPorGalon)
                    ).toFixed(2)}{" "}
                    Galones (Total)
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    💰 S/{" "}
                    {(() => {
                      const galonesTotal =
                        distanciaTotal /
                        Number(embarcacionCompleta.millasNauticasPorGalon);
                      const costoTotal = galonesTotal * precioCombustibleSoles;
                      return costoTotal.toFixed(2);
                    })()}{" "}
                    (Total)
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "0.85rem",
                      color: "#64748b",
                    }}
                  >
                    Rend:{" "}
                    {Number(embarcacionCompleta.millasNauticasPorGalon).toFixed(
                      2,
                    )}{" "}
                    MN/Gal
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {embarcacionCompleta.activo?.nombre || "Embarcación"} -{" "}
                    {embarcacionCompleta.matricula}
                  </p>
                </>
              )}
              {tiempoTotal && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  ⏱️ Tiempo Total: {tiempoTotal}
                </p>
              )}
              {velocidadPromedioTotal !== null && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  🚤 Velocidad Promedio: {velocidadPromedioTotal.toFixed(2)}{" "}
                  nudos
                </p>
              )}
            </div>
          )}

          {faenaData?.embarcacion?.millasNauticasPorGalon && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#e0e7ff",
                borderRadius: "8px",
                border: "2px solid #6366f1",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#3730a3" }}>
                ⚙️ Rendimiento Embarcación
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#3730a3",
                }}
              >
                {Number(embarcacionCompleta.millasNauticasPorGalon).toFixed(2)}{" "}
                MN/Gal
              </p>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {embarcacionCompleta.activo?.nombre || "Embarcación"} -{" "}
                {embarcacionCompleta.matricula}
              </p>
            </div>
          )}

          {consumoCombustible !== null && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fce7f3",
                borderRadius: "8px",
                border: "2px solid #ec4899",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#9f1239" }}>
                ⛽ Consumo de Combustible
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#9f1239",
                }}
              >
                {consumoCombustible.toFixed(2)} Galones
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                Estimado según distancia recorrida
              </p>
            </div>
          )}

          {costoCombustible !== null && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#dcfce7",
                borderRadius: "8px",
                border: "2px solid #10b981",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#047857" }}>
                💰 Costo Estimado
              </h4>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#047857",
                }}
              >
                S/ {costoCombustible.toFixed(2)}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                {loadingPrecioCombustible
                  ? "Cargando precio..."
                  : `A S/ ${precioCombustibleSoles.toFixed(2)} por galón`}
              </p>
            </div>
          )}
        </div>
      </Panel>
    );
  };

  const estadosCerrados = ["FINALIZADA", "CANCELADA"];
  const estadoTemporada = temporadaData?.estadoTemporada?.descripcion || "";
  const temporadaCerrada = estadosCerrados.includes(estadoTemporada);

  const puedeIniciarCala = !fechaHoraInicio;
  const puedeFinalizarCala = fechaHoraInicio && !fechaHoraFin;
  const calaFinalizada = fechaHoraInicio && fechaHoraFin;

  const camposDeshabilitados = temporadaCerrada && !esSuperUsuario;

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px", flexWrap: "nowrap" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-text"
          onClick={() => editarCala(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => eliminarCalaRecord(rowData)}
          tooltip="Eliminar"
        />
      </div>
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
        onClick={() => setCalaDialog(false)}
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
        onClick={guardarCala}
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
        value={"Cala"}
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

  const header = (
    <div className="flex align-items-center gap-2">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
          <h2>DETALLE DE CALAS</h2>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Button
            label="Nueva Cala"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirNuevaCala}
            disabled={
              !faenaPescaId ||
              !faenaData?.fechaSalida ||
              !faenaData?.puertoSalidaId ||
              (Number(faenaData?.estadoFaenaId) === 19 && !esSuperUsuario) ||
              camposDeshabilitados
            }
            type="button"
            tooltip={
              camposDeshabilitados
                ? `Temporada ${estadoTemporada}. Solo superusuarios pueden editar.`
                : Number(faenaData?.estadoFaenaId) === 19
                  ? esSuperUsuario
                    ? "Agregar nueva cala (Superusuario)"
                    : "No se pueden agregar calas a una faena finalizada"
                  : !faenaData?.fechaSalida || !faenaData?.puertoSalidaId
                    ? "Debe ingresar fecha de salida y puerto de salida antes de crear calas"
                    : "Agregar nueva cala"
            }
            tooltipOptions={{ position: "top" }}
            raised
            outlined
            severity="success"
            size="small"
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <span className="p-input-icon-left">
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
            />
          </span>
        </div>
      </div>
    </div>
  );

  const handleDataChange = async () => {
    await cargarCalas();

    if (editingCala?.id) {
      try {
        const calasActualizadas = await getCalasPorFaena(faenaPescaId);
        const calaActualizada = calasActualizadas.find(
          (c) => c.id === editingCala.id,
        );

        if (calaActualizada) {
          setToneladasCapturadas(calaActualizada.toneladasCapturadas || "");
        }
      } catch (error) {
        console.error("Error actualizando datos de cala:", error);
      }
    }

    if (onDataChange && typeof onDataChange === "function") {
      await onDataChange();
    }
    if (onFaenasChange && typeof onFaenasChange === "function") {
      await onFaenasChange();
    }
  };

  return (
    <Card
      className="mt-4"
      pt={{
        header: { style: { display: "none" } },
        body: { style: { paddingTop: "0" } },
      }}
    >
      <Toast ref={toast} style={{ zIndex: 9999 }} baseZIndex={9999} />
      <DataTable
        value={calas}
        selection={selectedCala}
        onSelectionChange={(e) => setSelectedCala(e.value)}
        dataKey="id"
        stripedRows
        showGridlines
        size="small"
        globalFilter={globalFilter}
        header={header}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        onRowClick={(e) => editarCala(e.data)}
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ minWidth: "4rem" }}
        ></Column>
        <Column
          field="latitud"
          header="Lat Inicio"
          sortable
          body={(rowData) => {
            const latitudNormalizada = rowData.latitud
              ? parseFloat(rowData.latitud).toFixed(8)
              : "0.00000000";
            return latitudNormalizada;
          }}
          style={{ minWidth: "8rem" }}
        ></Column>
        <Column
          field="longitud"
          header="Lon Inicio"
          sortable
          body={(rowData) => {
            const longitudNormalizada = rowData.longitud
              ? parseFloat(rowData.longitud).toFixed(8)
              : "0.00000000";
            return longitudNormalizada;
          }}
          style={{ minWidth: "8rem" }}
        ></Column>
        <Column
          field="latitudFin"
          header="Lat Fin"
          sortable
          body={(rowData) => {
            const latitudNormalizada = rowData.latitudFin
              ? parseFloat(rowData.latitudFin).toFixed(8)
              : "-";
            return latitudNormalizada;
          }}
          style={{ minWidth: "8rem" }}
        ></Column>
        <Column
          field="longitudFin"
          header="Lon Fin"
          sortable
          body={(rowData) => {
            const longitudNormalizada = rowData.longitudFin
              ? parseFloat(rowData.longitudFin).toFixed(8)
              : "-";
            return longitudNormalizada;
          }}
          style={{ minWidth: "8rem" }}
        ></Column>
        <Column
          field="fechaHoraInicio"
          header="Fecha Inicio"
          body={(rowData) => formatearFecha(rowData.fechaHoraInicio)}
          sortable
          style={{ minWidth: "10rem" }}
        ></Column>
        <Column
          field="fechaHoraFin"
          header="Fecha Fin"
          body={(rowData) => formatearFecha(rowData.fechaHoraFin)}
          sortable
          style={{ minWidth: "10rem" }}
        ></Column>
        <Column
          field="toneladasCapturadas"
          header="Toneladas"
          sortable
          body={(rowData) => {
            const tonsC = rowData.toneladasCapturadas
              ? parseFloat(rowData.toneladasCapturadas).toFixed(3)
              : "0.000";
            return `${tonsC} t`;
          }}
          style={{ minWidth: "8rem" }}
        ></Column>
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ minWidth: "8rem" }}
        ></Column>
      </DataTable>

      <Dialog
        visible={calaDialog}
        style={{ width: "1300px" }}
        header={calaDialogHeader}
        modal
        maximizable
        maximized="true"
        className="p-fluid"
        footer={calaDialogFooter}
        onHide={() => setCalaDialog(false)}
      >
        <div className="grid">
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
              <Calendar
                id="fechaHoraInicio"
                value={fechaHoraInicio}
                onChange={(e) => setFechaHoraInicio(e.value)}
                inputStyle={{ fontWeight: "bold" }}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled={
                  loading ||
                  (calaFinalizada && !esSuperUsuario) ||
                  camposDeshabilitados
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="profundidadM">Profundidad (m)</label>
              <InputNumber
                id="profundidadM"
                value={profundidadM}
                onValueChange={(e) => setProfundidadM(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                suffix=" m"
                inputStyle={{ fontWeight: "bold" }}
                disabled={
                  loading ||
                  (calaFinalizada && !esSuperUsuario) ||
                  camposDeshabilitados
                }
              />
            </div>
          </div>

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
                onClick={async () => {
                  try {
                    await capturarGPS(
                      async (latitude, longitude, accuracy) => {
                        setLatitud(latitude);
                        setLongitud(longitude);

                        toast.current?.show({
                          severity: "success",
                          summary: "GPS INICIO capturado",
                          detail: `GPS capturado con precisión de ${accuracy.toFixed(
                            1,
                          )}m. Guardando cala...`,
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

                        try {
                          await guardarCala(false);
                        } catch (error) {
                          console.error(
                            "Error al guardar cala automáticamente:",
                            error,
                          );
                          toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail:
                              "GPS capturado pero error al guardar la cala",
                            life: 4000,
                          });
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
                disabled={
                  loading ||
                  (calaFinalizada && !esSuperUsuario) ||
                  camposDeshabilitados
                }
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
                        onValueChange={(e) => setLatitud(e.value)}
                        disabled={
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                        onValueChange={(e) => setLongitud(e.value)}
                        disabled={
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                        disabled={
                          !esSuperUsuario ||
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                        disabled={
                          !esSuperUsuario ||
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                onClick={async () => {
                  try {
                    await capturarGPS(
                      async (latitude, longitude, accuracy) => {
                        setLatitudFin(latitude);
                        setLongitudFin(longitude);

                        toast.current?.show({
                          severity: "success",
                          summary: "GPS FIN capturado",
                          detail: `GPS capturado con precisión de ${accuracy.toFixed(
                            1,
                          )}m. Guardando cala...`,
                          life: 3000,
                        });

                        try {
                          await guardarCala(false);
                        } catch (error) {
                          console.error(
                            "Error al guardar cala automáticamente:",
                            error,
                          );
                          toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail:
                              "GPS capturado pero error al guardar la cala",
                            life: 4000,
                          });
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
                    console.error("Error capturando GPS FIN:", error);
                  }
                }}
                disabled={
                  loading ||
                  (calaFinalizada && !esSuperUsuario) ||
                  camposDeshabilitados
                }
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
                        onValueChange={(e) => setLatitudFin(e.value)}
                        disabled={
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                        onValueChange={(e) => setLongitudFin(e.value)}
                        disabled={
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                        disabled={
                          !esSuperUsuario ||
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                          disabled={
                            (calaFinalizada && !esSuperUsuario) ||
                            camposDeshabilitados
                          }
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
                        disabled={
                          !esSuperUsuario ||
                          (calaFinalizada && !esSuperUsuario) ||
                          camposDeshabilitados
                        }
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
            <LineaPuertoInicio />
            <LineaInicioFin />
            <MarkerPuerto />
            <DraggableMarker />
            <MarkerFin />
            <UserLocationMarker />
          </PanelMapaGeografico>

          <PanelResumenFaena />

          <DetalleCalasEspecieForm
            calaId={editingCala?.id}
            faenaPescaId={faenaPescaId}
            temporadaId={temporadaData?.id}
            calaFinalizada={calaFinalizada && !esSuperUsuario}
            camposDeshabilitados={camposDeshabilitados}
            onDataChange={handleDataChange}
            onFaenasChange={onFaenasChange}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                label="Finalizar Cala"
                icon="pi pi-stop"
                className="p-button-warning"
                onClick={() => finalizarCalaAction(editingCala)}
                size="large"
                disabled={!puedeFinalizarCala || loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaHoraFin">Fecha y Hora Fin</label>
              <Calendar
                id="fechaHoraFin"
                value={fechaHoraFin}
                onChange={(e) => setFechaHoraFin(e.value)}
                inputStyle={{ fontWeight: "bold" }}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled={
                  loading ||
                  (calaFinalizada && !esSuperUsuario) ||
                  camposDeshabilitados
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="toneladasCapturadas">Toneladas Capturadas</label>
              <InputNumber
                id="toneladasCapturadas"
                value={toneladasCapturadas}
                onValueChange={(e) => setToneladasCapturadas(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={3}
                suffix=" Ton"
                inputStyle={{ fontWeight: "bold" }}
                style={{ backgroundColor: "#f7ee88" }}
                disabled
              />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="observaciones">Observaciones</label>
              <InputTextarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{ fontWeight: "bold", fontStyle: "italic" }}
                rows={1}
                cols={20}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </Card>
  );
};

export default DetalleCalasForm;
