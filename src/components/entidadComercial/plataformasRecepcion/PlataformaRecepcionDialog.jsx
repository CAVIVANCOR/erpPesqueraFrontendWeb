/**
 * PlataformaRecepcionDialog.jsx
 *
 * Componente de diálogo para crear/editar plataformas de recepción.
 * Incluye mapa interactivo con zona de exclusión de 5 millas náuticas.
 * Usa react-hook-form y Yup para validación.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { classNames } from "primereact/utils";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { esquemaValidacionPlataforma } from "./plataformaRecepcionValidation";
import PanelMapaGeografico from "../../shared/PanelMapaGeografico";
import { analizarCoordenadasConReferencia } from "../../../api/geolocalizacion";

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Icono personalizado para plataforma de recepción
const plataformaIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Coordenadas aproximadas de la zona de exclusión de 5 millas náuticas (costa peruana)
// Simplificación de la costa peruana para zona prohibida
const ZONA_PROHIBIDA_5_MILLAS = [
  [-0.5, -81.3], [-3.5, -80.8], [-6.0, -81.0], [-8.0, -79.5],
  [-10.0, -78.5], [-12.0, -77.2], [-14.0, -76.5], [-16.0, -75.5],
  [-18.0, -71.0], [-18.5, -70.5], [-18.5, -69.0], [-18.0, -68.0],
  [-16.0, -68.0], [-14.0, -69.0], [-12.0, -70.0], [-10.0, -71.5],
  [-8.0, -73.0], [-6.0, -75.0], [-3.5, -76.5], [-0.5, -77.0], [-0.5, -81.3]
];

export default function PlataformaRecepcionDialog({
  visible,
  plataforma,
  puertosOptions,
  onHide,
  onSubmit,
  loading,
  readOnly,
}) {
  const esEdicion = plataforma && plataforma.id;
  const mapContainerRef = useRef(null);

  // Estados del mapa
  const [mapPosition, setMapPosition] = useState([-12.046374, -77.042793]); // Lima, Perú por defecto
  const [mapKey, setMapKey] = useState(0);
  const [tipoMapa, setTipoMapa] = useState("street");
  const [mapaFullscreen, setMapaFullscreen] = useState(false);
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [infoGeografica, setInfoGeografica] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacionPlataforma),
    defaultValues: {
      nombre: plataforma?.nombre || "",
      puertoPescaId: plataforma?.puertoPescaId ? Number(plataforma.puertoPescaId) : null,
      latitud: plataforma?.latitud ? Number(plataforma.latitud) : null,
      longitud: plataforma?.longitud ? Number(plataforma.longitud) : null,
      activo: plataforma?.activo !== undefined ? plataforma.activo : true,
    },
  });

  // Observar cambios en latitud y longitud
  const latitud = watch("latitud");
  const longitud = watch("longitud");

  // Actualizar posición del mapa cuando cambian las coordenadas
  useEffect(() => {
    if (latitud && longitud) {
      setMapPosition([Number(latitud), Number(longitud)]);
      setMapKey((prev) => prev + 1);
    }
  }, [latitud, longitud]);

    // Reset form cuando cambia la plataforma o se abre el dialog
  useEffect(() => {
    if (visible) {
      reset({
        nombre: plataforma?.nombre || "",
        puertoPescaId: plataforma?.puertoPescaId ? Number(plataforma.puertoPescaId) : null,
        latitud: plataforma?.latitud ? Number(plataforma.latitud) : null,
        longitud: plataforma?.longitud ? Number(plataforma.longitud) : null,
        activo: plataforma?.activo !== undefined ? plataforma.activo : true,
      });

      if (plataforma?.latitud && plataforma?.longitud) {
        setMapPosition([Number(plataforma.latitud), Number(plataforma.longitud)]);
        setMapKey((prev) => prev + 1);
      } else {
        // Resetear posición del mapa a Lima por defecto
        setMapPosition([-12.046374, -77.042793]);
        setMapKey((prev) => prev + 1);
      }

      // Limpiar información geográfica al abrir
      setInfoGeografica(null);
    }
  }, [plataforma, reset, visible]);


    /**
   * Analizar coordenadas cuando cambian
   */
  useEffect(() => {
    if (latitud && longitud && !loadingGeo) {
      const analizarCoordenadasExistentes = async () => {
        setLoadingGeo(true);
        try {
          const infoGeo = await analizarCoordenadasConReferencia(
            latitud,
            longitud,
            null
          );
          setInfoGeografica(infoGeo);
        } catch (error) {
          console.error("Error al analizar coordenadas:", error);
        } finally {
          setLoadingGeo(false);
        }
      };

      analizarCoordenadasExistentes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitud, longitud]);
  /**
 * Obtener color según clasificación de aguas
 */
  const getClasificacionAguasColor = (clasificacion) => {
    if (!clasificacion) return "info";
    if (clasificacion.includes("Territorial")) return "danger";
    if (clasificacion.includes("Exclusiva")) return "success";
    return "info";
  };

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  const getFieldClass = (fieldName) => {
    return classNames({ "p-invalid": errors[fieldName] });
  };

  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name]?.message}</small>;
  };

  /**
   * Configuración de capas de mapa
   */
  const getTileConfig = () => {
    const configs = {
      street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&​copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "&​copy; Esri &​mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    };
    return configs[tipoMapa] || configs.street;
  };

  /**
   * Cambiar tipo de mapa
   */
  const cambiarTipoMapa = (tipo) => {
    setTipoMapa(tipo);
    setMapKey((prev) => prev + 1);
  };

  /**
   * Obtener ubicación del usuario
   */
  const obtenerUbicacionUsuario = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUbicacionUsuario([latitude, longitude]);
          setMapPosition([latitude, longitude]);
          setMapKey((prev) => prev + 1);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        }
      );
    }
  };

  /**
   * Alternar pantalla completa
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
   * Componente de marcador arrastrable
   */
  const DraggableMarker = () => {
    const markerRef = useRef(null);

    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setValue("latitud", Number(lat.toFixed(8)));
            setValue("longitud", Number(lng.toFixed(8)));
          }
        },
      }),
      [setValue]
    );

    // Manejar clic en el mapa
    useMapEvents({
      click(e) {
        if (!readOnly) {
          setValue("latitud", Number(e.latlng.lat.toFixed(8)));
          setValue("longitud", Number(e.latlng.lng.toFixed(8)));
        }
      },
    });

    if (!latitud || !longitud) return null;

    return (
      <Marker
        draggable={!readOnly}
        eventHandlers={eventHandlers}
        position={[latitud, longitud]}
        ref={markerRef}
        icon={plataformaIcon}
      >
        <Popup>
          <strong>Plataforma de Recepción</strong>
          <br />
          Lat: {latitud?.toFixed(6)}
          <br />
          Lon: {longitud?.toFixed(6)}
          <br />
          {!readOnly && <em>Arrastra para mover</em>}
        </Popup>
      </Marker>
    );
  };

  /**
   * Marcador de ubicación del usuario
   */
  const UserLocationMarker = () => {
    if (!ubicacionUsuario) return null;

    const userIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    return (
      <Marker position={ubicacionUsuario} icon={userIcon}>
        <Popup>
          <strong>Tu ubicación</strong>
        </Popup>
      </Marker>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onHide}
        disabled={loading}
        type="button"
        className="p-button-danger"
        severity="danger"
        raised
        outlined
      />
      <Button
        label={esEdicion ? "Actualizar" : "Guardar"}
        icon="pi pi-check"
        onClick={handleSubmit(handleFormSubmit)}
        loading={loading}
        disabled={readOnly}
        type="button"
        className="p-button-success"
        severity="success"
        raised
        outlined
      />
    </div>
  );

  return (
    <Dialog
      header={esEdicion ? "Editar Plataforma de Recepción" : "Nueva Plataforma de Recepción"}
      visible={visible}
      onHide={onHide}
      style={{ width: "95vw", maxWidth: "1400px" }}
      modal
      footer={dialogFooter}
      maximizable
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
        <div
          style={{
            display: "flex",
            alignItems:"end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <div className="field">
                  <label htmlFor="nombre">Nombre *</label>
                  <InputText
                    id="nombre"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={getFieldClass("nombre")}
                    disabled={readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                  {getFormErrorMessage("nombre")}
                </div>
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Controller
              name="puertoPescaId"
              control={control}
              render={({ field }) => (
                <div className="field">
                  <label htmlFor="puertoPescaId">Puerto de Pesca *</label>
                  <Dropdown
                    id="puertoPescaId"
                    value={field.value}
                    options={puertosOptions}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    filter
                    filterBy="label"
                    className={getFieldClass("puertoPescaId")}
                    disabled={readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                  {getFormErrorMessage("puertoPescaId")}
                </div>
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Controller
              name="latitud"
              control={control}
              render={({ field }) => (
                <div className="field">
                  <label htmlFor="latitud">Latitud</label>
                  <InputNumber
                    id="latitud"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={8}
                    min={-90}
                    max={90}
                    className={getFieldClass("latitud")}
                    disabled={readOnly || loading}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                  {getFormErrorMessage("latitud")}
                </div>
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Controller
              name="longitud"
              control={control}
              render={({ field }) => (
                <div className="field">
                  <label htmlFor="longitud">Longitud</label>
                  <InputNumber
                    id="longitud"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={8}
                    min={-180}
                    max={180}
                    className={getFieldClass("longitud")}
                    disabled={readOnly || loading}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                  {getFormErrorMessage("longitud")}
                </div>
              )}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <div className="field">
                  <ToggleButton
                    id="activo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    onLabel="Activo"
                    offLabel="Inactivo"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                    className="w-full"
                    disabled={readOnly || loading}
                    style={{ fontWeight: "bold" }}
                  />
                </div>
              )}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
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
              titulo="📍 Ubicación de la Plataforma de Recepción"
              colapsadoPorDefecto={false}
            >
              {/* Zona prohibida de 5 millas náuticas */}
              <Polygon
                positions={ZONA_PROHIBIDA_5_MILLAS}
                pathOptions={{
                  color: "red",
                  fillColor: "red",
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong style={{ color: "red" }}>⚠️ ZONA PROHIBIDA</strong>
                  <br />
                  Prohibido pescar dentro de las 5 millas náuticas
                </Popup>
              </Polygon>

              <DraggableMarker />
              <UserLocationMarker />
            </PanelMapaGeografico>
          </div>
        </div>
      </form>
    </Dialog>
  );
}