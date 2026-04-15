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
import { confirmDialog } from "primereact/confirmdialog";
import { Controller, useForm } from "react-hook-form";
import { getResponsiveFontSize } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import {
  capturarGPS,
  formatearCoordenadas,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";
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
import DetalleCalasConsumoEspecieForm from "./DetalleCalasConsumoEspecieForm";
import PanelMapaGeografico from "../shared/PanelMapaGeografico";

export default function CalasConsumoCard({
  faenaPescaConsumoId,
  novedadPescaConsumoId,
  faenaData,
  bahias: bahiasProps = [],
  motoristas: motoristasProps = [],
  patrones: patronesProps = [],
  embarcaciones: embarcacionesProps = [],
  especies = [],
  onDataChange,
}) {
  // ⭐ OBTENER USUARIO AUTENTICADO PARA VERIFICAR SI ES SUPERUSUARIO
  const usuario = useAuthStore((state) => state.usuario);
  const esSuperUsuario = usuario?.esSuperUsuario || false;

  const [calas, setCalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogCalaVisible, setDialogCalaVisible] = useState(false);
  const [editingCala, setEditingCala] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados para GPS (string vacío como en DetalleCalasForm)
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");

  // Estados para formato DMS de latitud
  const [latGrados, setLatGrados] = useState(0);
  const [latMinutos, setLatMinutos] = useState(0);
  const [latSegundos, setLatSegundos] = useState(0);
  const [latDireccion, setLatDireccion] = useState("S");

  // Estados para formato DMS de longitud
  const [lonGrados, setLonGrados] = useState(0);
  const [lonMinutos, setLonMinutos] = useState(0);
  const [lonSegundos, setLonSegundos] = useState(0);
  const [lonDireccion, setLonDireccion] = useState("W");

  // Estados para información geográfica
  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);

  // Estados para ubicación del usuario y pantalla completa
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const [tipoMapa, setTipoMapa] = useState("street");
  // Estados para el mapa
  const [mapPosition, setMapPosition] = useState([-12.0, -77.0]);
  const [mapKey, setMapKey] = useState(0);

  // Estados para campos de fecha
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  // Estados para dropdowns deshabilitados
  const [bahias, setBahias] = useState(bahiasProps);
  const [motoristas, setMotoristas] = useState(motoristasProps);
  const [patrones, setPatrones] = useState(patronesProps);
  const [embarcaciones, setEmbarcaciones] = useState(embarcacionesProps);

  // Estados para valores seleccionados en dropdowns
  const [selectedBahiaId, setSelectedBahiaId] = useState(null);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState(null);
  const [selectedPatronId, setSelectedPatronId] = useState(null);
  const [selectedEmbarcacionId, setSelectedEmbarcacionId] = useState(null);

  const toast = useRef(null);

  const {
    control: controlCala,
    handleSubmit: handleSubmitCala,
    reset: resetCala,
    setValue: setValueCala,
    formState: { errors: errorsCala },
  } = useForm();

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarCalas();
    }
  }, [faenaPescaConsumoId]);

  useEffect(() => {
    if (
      bahiasProps?.length > 0 &&
      motoristasProps?.length > 0 &&
      patronesProps?.length > 0 &&
      embarcacionesProps?.length > 0
    ) {
      // Normalizar los arrays para convertir values a Number y asegurar labels correctos
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

      // Asignar valores seleccionados desde faenaData si están disponibles
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

  // Sincronizar cambios de decimal a DMS (cuando cambia latitud decimal)
  useEffect(() => {
    if (latitud !== "" && latitud !== null && latitud !== undefined) {
      const dms = descomponerDMS(Number(latitud), true);
      setLatGrados(dms.grados);
      setLatMinutos(dms.minutos);
      setLatSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatDireccion(dms.direccion);
    }
  }, [latitud]);

  // Sincronizar cambios de decimal a DMS (cuando cambia longitud decimal)
  useEffect(() => {
    if (longitud !== "" && longitud !== null && longitud !== undefined) {
      const dms = descomponerDMS(Number(longitud), false);
      setLonGrados(dms.grados);
      setLonMinutos(dms.minutos);
      setLonSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonDireccion(dms.direccion);
    }
  }, [longitud]);

  // Actualizar posición del mapa cuando cambian las coordenadas
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
   * useEffect para analizar coordenadas cuando ya existen
   * (por ejemplo, al editar una cala existente)
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
            const infoGeo = await analizarCoordenadasConReferencia(
              latitud,
              longitud,
              null, // Cala no tiene puerto
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

  // Funciones para actualizar decimal cuando cambia DMS
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

  /**
   * useEffect para analizar coordenadas cuando ya existen en el formulario
   * (por ejemplo, al editar una cala existente)
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
            const infoGeo = await analizarCoordenadasConReferencia(
              latitud,
              longitud,
              null, // Cala no tiene puerto de salida
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

  const cargarCalas = async () => {
    try {
      setLoading(true);
      const data = await getCalasFaenaConsumoPorFaena(faenaPescaConsumoId);
      setCalas(data);
    } catch (error) {
      console.error("Error al cargar calas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar calas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== GESTIÓN DE CALAS =====
  const handleNuevaCala = () => {
    setEditingCala(null);
    setLatitud("");
    setLongitud("");
    setCreatedAt(new Date());
    setUpdatedAt(new Date());

    // Asignar valores directamente desde faenaData
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
      bahiaId: null,
      motoristaId: null,
      patronId: null,
      embarcacionId: null,
      fechaHoraInicio: new Date(),
      fechaHoraFin: null,
      latitud: null,
      longitud: null,
      profundidadM: null,
      toneladasCapturadas: null,
      observaciones: "",
    });
    setDialogCalaVisible(true);
  };

  const handleEditarCala = (cala) => {
    setEditingCala(cala);
    setLatitud(cala.latitud || "");
    setLongitud(cala.longitud || "");
    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : null);
    setUpdatedAt(cala.updatedAt ? new Date(cala.updatedAt) : null);

    // Cargar valores de dropdowns
    setSelectedBahiaId(cala.bahiaId ? Number(cala.bahiaId) : null);
    setSelectedMotoristaId(cala.motoristaId ? Number(cala.motoristaId) : null);
    setSelectedPatronId(cala.patronId ? Number(cala.patronId) : null);
    setSelectedEmbarcacionId(
      cala.embarcacionId ? Number(cala.embarcacionId) : null,
    );

    resetCala({
      bahiaId: cala.bahiaId ? Number(cala.bahiaId) : null,
      motoristaId: cala.motoristaId ? Number(cala.motoristaId) : null,
      patronId: cala.patronId ? Number(cala.patronId) : null,
      embarcacionId: cala.embarcacionId ? Number(cala.embarcacionId) : null,
      fechaHoraInicio: cala.fechaHoraInicio
        ? new Date(cala.fechaHoraInicio)
        : null,
      fechaHoraFin: cala.fechaHoraFin ? new Date(cala.fechaHoraFin) : null,
      latitud: cala.latitud || null,
      longitud: cala.longitud || null,
      profundidadM: cala.profundidadM || null,
      toneladasCapturadas: cala.toneladasCapturadas || null,
      observaciones: cala.observaciones || "",
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

  /**
   * Componente de marker draggable para el mapa
   */
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
          setValueCala("latitud", lat);
          setValueCala("longitud", lng);
          setMapPosition([lat, lng]);
        }
      },
    };

    return (
      <Marker
        position={mapPosition}
        draggable={!loading}
        eventHandlers={eventHandlers}
        ref={markerRef}
      >
        <Popup>
          <strong>{nombreBahia}</strong>
          <br />
          Lat: {Number(latitud).toFixed(6)}
          <br />
          Lon: {Number(longitud).toFixed(6)}
        </Popup>
      </Marker>
    );
  };

  /**
   * Componente de marcador de ubicación del usuario
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
   * Componente de línea de distancia entre usuario y embarcación
   */
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

  /**
   * Obtener ubicación actual del usuario
   */
  const obtenerUbicacionUsuario = () => {
    if (!navigator.geolocation) {
      toast.current.show({
        severity: "warn",
        summary: "GPS no disponible",
        detail: "Tu dispositivo no soporta geolocalización",
        life: 3000,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacionUsuario({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        toast.current.show({
          severity: "success",
          summary: "Ubicación obtenida",
          detail: "Tu ubicación se muestra en el mapa (marcador verde)",
          life: 3000,
        });
      },
      (error) => {
        toast.current.show({
          severity: "error",
          summary: "Error GPS",
          detail: "No se pudo obtener tu ubicación",
          life: 3000,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  /**
   * Toggle pantalla completa del mapa
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setMapaFullscreen(true);
    } else {
      document.exitFullscreen();
      setMapaFullscreen(false);
    }
  };

  /**
   * Cambiar tipo de mapa
   */
  const cambiarTipoMapa = () => {
    if (tipoMapa === "street") {
      setTipoMapa("satellite");
      toast.current.show({
        severity: "info",
        summary: "Vista Satélite",
        detail: "Cambiado a vista satelital",
        life: 2000,
      });
    } else if (tipoMapa === "satellite") {
      setTipoMapa("hybrid");
      toast.current.show({
        severity: "info",
        summary: "Vista Híbrida",
        detail: "Satélite + etiquetas",
        life: 2000,
      });
    } else {
      setTipoMapa("street");
      toast.current.show({
        severity: "info",
        summary: "Vista Calles",
        detail: "Cambiado a vista de calles",
        life: 2000,
      });
    }
  };

  /**
   * Obtener configuración de tile según tipo de mapa
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
        attribution: "Tiles &​copy; Esri",
      },
      hybrid: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &​copy; Esri",
      },
    };
    return configs[tipoMapa];
  };

  /**
   * Obtener color del Tag según clasificación de aguas
   */
  const getClasificacionAguasColor = (clasificacion) => {
    if (!clasificacion) return "info";
    if (clasificacion.includes("Territoriales")) return "danger";
    if (clasificacion.includes("Económica")) return "success";
    return "info";
  };

  const guardarCala = async (cerrarDialogo = true) => {
    // ← AGREGAR parámetro
    // Obtener valores directamente desde faenaData para evitar problemas de asincronía
    const bahiaIdNum = faenaData?.bahiaId ? Number(faenaData.bahiaId) : null;
    const motoristaIdNum = faenaData?.motoristaId
      ? Number(faenaData.motoristaId)
      : null;
    const patronIdNum = faenaData?.patronId ? Number(faenaData.patronId) : null;
    const embarcacionIdNum = faenaData?.embarcacionId
      ? Number(faenaData.embarcacionId)
      : null;

    const data = {
      bahiaId: bahiaIdNum,
      motoristaId: motoristaIdNum,
      patronId: patronIdNum,
      embarcacionId: embarcacionIdNum,
      fechaHoraInicio: controlCala._formValues.fechaHoraInicio,
      fechaHoraFin: controlCala._formValues.fechaHoraFin,
      latitud: latitud,
      longitud: longitud,
      profundidadM: controlCala._formValues.profundidadM,
      toneladasCapturadas: controlCala._formValues.toneladasCapturadas,
      observaciones: controlCala._formValues.observaciones,
    };

    await onSubmitCala(data, cerrarDialogo); // ← PASAR parámetro
  };

  const finalizarCalaAction = async (cala) => {
    if (!cala || !cala.fechaHoraInicio || cala.fechaHoraFin) {
      return;
    }

    try {
      const ahora = new Date();
      setValueCala("fechaHoraFin", ahora);

      // Solo enviar campos actualizables, NO enviar id, createdAt, ni relaciones
      const calaActualizada = {
        faenaPescaConsumoId: Number(cala.faenaPescaConsumoId),
        novedadPescaConsumoId: Number(cala.novedadPescaConsumoId),
        bahiaId: cala.bahiaId ? Number(cala.bahiaId) : null,
        motoristaId: cala.motoristaId ? Number(cala.motoristaId) : null,
        patronId: cala.patronId ? Number(cala.patronId) : null,
        embarcacionId: cala.embarcacionId ? Number(cala.embarcacionId) : null,
        fechaHoraInicio: cala.fechaHoraInicio,
        fechaHoraFin: ahora.toISOString(),
        latitud: cala.latitud || null,
        longitud: cala.longitud || null,
        profundidadM: cala.profundidadM || null,
        toneladasCapturadas: cala.toneladasCapturadas || null,
        observaciones: cala.observaciones || null,
        updatedAt: new Date().toISOString(),
      };

      await actualizarCalaFaenaConsumo(cala.id, calaActualizada);

      toast.current?.show({
        severity: "success",
        summary: "Cala Finalizada",
        detail: `Cala finalizada a las ${ahora.toLocaleTimeString()}`,
        life: 3000,
      });

      cargarCalas();
      onDataChange?.();
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

  const onSubmitCala = async (data, cerrarDialogo = true) => {
    // ← AGREGAR parámetro con default true
    try {
      const payload = {
        faenaPescaConsumoId: Number(faenaPescaConsumoId),
        novedadPescaConsumoId: Number(novedadPescaConsumoId),
        bahiaId: data.bahiaId ? Number(data.bahiaId) : null,
        motoristaId: data.motoristaId ? Number(data.motoristaId) : null,
        patronId: data.patronId ? Number(data.patronId) : null,
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        fechaHoraInicio: data.fechaHoraInicio
          ? new Date(data.fechaHoraInicio).toISOString()
          : null,
        fechaHoraFin: data.fechaHoraFin
          ? new Date(data.fechaHoraFin).toISOString()
          : null,
        latitud: latitud || null,
        longitud: longitud || null,
        profundidadM: data.profundidadM || null,
        toneladasCapturadas: data.toneladasCapturadas || null,
        observaciones: data.observaciones?.trim() || null,
      };

      if (editingCala) {
        await actualizarCalaFaenaConsumo(editingCala.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cala actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearCalaFaenaConsumo(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cala creada correctamente",
          life: 3000,
        });
      }

      if (cerrarDialogo) {
        // ← SOLO CERRAR SI cerrarDialogo es true
        setDialogCalaVisible(false);
      }
      cargarCalas();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la cala",
        life: 3000,
      });
    }
  };

  // Templates para Calas
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

  const fechaHoraTemplate = (rowData, field) => {
    return rowData[field.field] ? formatearFecha(rowData[field.field]) : "-";
  };

  const toneladasTemplate = (rowData) => {
    return rowData.toneladasCapturadas
      ? `${Number(rowData.toneladasCapturadas).toFixed(2)} TM`
      : "-";
  };

  const accionesCalaTemplate = (rowData) => {
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

  // Estados para determinar si los botones están habilitados
  const puedeFinalizarCala =
    editingCala?.fechaHoraInicio && !editingCala?.fechaHoraFin;
  const calaFinalizada =
    editingCala?.fechaHoraInicio && editingCala?.fechaHoraFin;

  // Header del DataTable
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
            onClick={handleNuevaCala}
            disabled={!faenaPescaConsumoId}
            type="button"
            tooltip="Agregar nueva cala"
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

  // Dialog Headers y Footers
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
        onClick={() => guardarCala(true)} // ← PASAR true para cerrar el diálogo
        className="p-button-success"
        severity="success"
        raised
        size="small"
        outlined
      />
    </div>
  );

  if (!faenaPescaConsumoId) {
    return (
      <Card title="Calas">
        <p className="text-center text-500">
          Debe crear la faena primero para gestionar calas
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Toast ref={toast} style={{ zIndex: 9999 }} baseZIndex={9999} />
        <DataTable
          value={calas}
          loading={loading}
          emptyMessage="No hay calas registradas"
          showGridlines
          stripedRows
          size="small"
          globalFilter={globalFilter}
          header={header}
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
          onRowClick={(e) => handleEditarCala(e.data)}
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "4rem" }}
          />
          <Column
            field="latitud"
            header="Latitud"
            sortable
            body={(rowData) => {
              const latitudNormalizada = rowData.latitud
                ? parseFloat(rowData.latitud).toFixed(8)
                : "0.00000000";
              return latitudNormalizada;
            }}
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="longitud"
            header="Longitud"
            sortable
            body={(rowData) => {
              const longitudNormalizada = rowData.longitud
                ? parseFloat(rowData.longitud).toFixed(8)
                : "0.00000000";
              return longitudNormalizada;
            }}
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="fechaHoraInicio"
            header="Fecha Inicio"
            body={(rowData) =>
              fechaHoraTemplate(rowData, { field: "fechaHoraInicio" })
            }
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="fechaHoraFin"
            header="Fecha Fin"
            body={(rowData) =>
              fechaHoraTemplate(rowData, { field: "fechaHoraFin" })
            }
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="toneladasCapturadas"
            header="Toneladas"
            body={toneladasTemplate}
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            header="Acciones"
            body={accionesCalaTemplate}
            style={{ minWidth: "10rem" }}
          />
        </DataTable>
      </Card>

      {/* Dialog para Cala */}
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
                placeholder="Bahía (automático)"
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
                placeholder="Motorista (automático)"
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
                placeholder="Patrón (automático)"
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
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="embarcacionId">Embarcación</label>
              <Dropdown
                id="embarcacionId"
                value={selectedEmbarcacionId}
                options={embarcaciones}
                placeholder="Embarcación (automático)"
                disabled
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="createdAt">Fecha Creación</label>
              <Calendar
                id="createdAt"
                value={createdAt}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                disabled
                placeholder="Se asigna automáticamente"
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
                placeholder="Se actualiza automáticamente"
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
                    disabled
                  />
                )}
              />
            </div>
          </div>

          {/* Coordenadas GPS - Formato compacto */}
          <div
            style={{
              border: "6px solid #0EA5E9",
              padding: "0.5rem",
              borderRadius: "8px",
              marginTop: "1rem",
              display: "flex",
              alignItems: "self-end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Capturar GPS"
                icon="pi pi-map-marker"
                className="p-button-info"
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
                          summary: "GPS capturado",
                          detail: `GPS capturado con precisión de ${accuracy.toFixed(
                            1,
                          )}m. Presione Guardar para confirmar.`,
                          life: 3000,
                        });

                        // Analizar coordenadas para obtener información geográfica
                        setLoadingGeo(true);
                        setErrorGeo(null);
                        try {
                          const infoGeo =
                            await analizarCoordenadasConReferencia(
                              latitude,
                              longitude,
                              null, // Cala no tiene puerto de salida
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

            {/* Tabla MEJORADA de coordenadas GPS - Optimizada para Tablet */}
            <div style={{ flex: 3 }}>
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
                      <InputNumber
                        value={latitud}
                        onValueChange={(e) => {
                          setLatitud(e.value);
                          setValueCala("latitud", e.value);
                        }}
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
                    </td>
                    <td
                      colSpan="4"
                      style={{ padding: "4px", border: "1px solid #0EA5E9" }}
                    >
                      <InputNumber
                        value={longitud}
                        onValueChange={(e) => {
                          setLongitud(e.value);
                          setValueCala("longitud", e.value);
                        }}
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
                          disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
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
                        disabled={!esSuperUsuario || loading} // ← SOLO SUPERUSUARIO PUEDE CAMBIAR
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
                          disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
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
                        disabled={!esSuperUsuario || loading} // ← SOLO SUPERUSUARIO PUEDE CAMBIAR
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
            <DraggableMarker />
            <UserLocationMarker />
            <DistanceLine />
          </PanelMapaGeografico>

          <DetalleCalasConsumoEspecieForm
            calaId={editingCala?.id}
            faenaPescaConsumoId={faenaPescaConsumoId}
            calaFinalizada={calaFinalizada}
            onDataChange={onDataChange}
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
                    disabled={loading || calaFinalizada}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="toneladasCapturadas">Toneladas Capturadas</label>
              <Controller
                name="toneladasCapturadas"
                control={controlCala}
                render={({ field }) => (
                  <InputNumber
                    id="toneladasCapturadas"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={3}
                    suffix=" Ton"
                    inputStyle={{ fontWeight: "bold" }}
                    style={{ backgroundColor: "#f7ee88" }}
                    disabled
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
                    placeholder="Observaciones"
                    rows={1}
                    cols={20}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
