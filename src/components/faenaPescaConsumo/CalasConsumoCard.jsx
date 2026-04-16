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

  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [errorGeo, setErrorGeo] = useState(null);

  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const [tipoMapa, setTipoMapa] = useState("street");
  const [mapPosition, setMapPosition] = useState([-12.0, -77.0]);
  const [mapKey, setMapKey] = useState(0);

  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [bahias, setBahias] = useState(bahiasProps);
  const [motoristas, setMotoristas] = useState(motoristasProps);
  const [patrones, setPatrones] = useState(patronesProps);
  const [embarcaciones, setEmbarcaciones] = useState(embarcacionesProps);

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
    if (longitudFin !== "" && longitudFin !== null && longitudFin !== undefined) {
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

  const handleNuevaCala = () => {
    setEditingCala(null);
    setLatitud("");
    setLongitud("");
    setLatitudFin("");
    setLongitudFin("");
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
      bahiaId: null,
      motoristaId: null,
      patronId: null,
      embarcacionId: null,
      fechaHoraInicio: new Date(),
      fechaHoraFin: null,
      latitud: null,
      longitud: null,
      latitudFin: null,
      longitudFin: null,
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
    setLatitudFin(cala.latitudFin || "");
    setLongitudFin(cala.longitudFin || "");
    setCreatedAt(cala.createdAt ? new Date(cala.createdAt) : null);
    setUpdatedAt(cala.updatedAt ? new Date(cala.updatedAt) : null);

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
      latitudFin: cala.latitudFin || null,
      longitudFin: cala.longitudFin || null,
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

  const CalaRouteLine = () => {
    if (
      !latitud ||
      !longitud ||
      !latitudFin ||
      !longitudFin ||
      latitud === "" ||
      longitud === "" ||
      latitudFin === "" ||
      longitudFin === ""
    )
      return null;

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

  const MarkerFin = () => {
    if (
      !latitudFin ||
      !longitudFin ||
      latitudFin === "" ||
      longitudFin === ""
    )
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
        toneladasCapturadas: data.toneladasCapturadas
          ? Number(data.toneladasCapturadas)
          : null,
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
        <Column
          field="id"
          header="ID"
          sortable
          style={{ minWidth: "4rem" }}
        />
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
        />
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
        />
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
        />
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
        />
        <Column
          field="fechaHoraInicio"
          header="Fecha Inicio"
          body={(rowData) => formatearFecha(rowData.fechaHoraInicio)}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="fechaHoraFin"
          header="Fecha Fin"
          body={(rowData) => formatearFecha(rowData.fechaHoraFin)}
          sortable
          style={{ minWidth: "10rem" }}
        />
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
                          detail: `GPS capturado con precisión de ${accuracy.toFixed(
                            1,
                          )}m. Presione Guardar para confirmar.`,
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
                      Latitud INICIO (Siempre SUR en Perú)
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
                      Longitud INICIO (Siempre OESTE en Perú)
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
                      style={{ padding: "4px", border: "1px solid #10B981" }}
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
                          detail: `GPS capturado con precisión de ${accuracy.toFixed(
                            1,
                          )}m. Presione Guardar para confirmar.`,
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
                      Latitud FIN (Siempre SUR en Perú)
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
                      Longitud FIN (Siempre OESTE en Perú)
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
                      style={{ padding: "4px", border: "1px solid #EF4444" }}
                    >
                      <InputNumber
                        value={longitudFin}
                        onValueChange={(e) => {
                          setLongitudFin(e.value);
                          setValueCala("longitudFin", e.value);
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
            <MarkerFin />
            <UserLocationMarker />
            <DistanceLine />
            <CalaRouteLine />
          </PanelMapaGeografico>

          <DetalleCalasConsumoEspecieForm
            calaId={editingCala?.id}
            faenaPescaConsumoId={faenaPescaConsumoId}
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
    </Card>
  );
}