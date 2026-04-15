/**
 * Formulario para gestión de Puertos de Pesca
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: zona (obligatorio, 20 chars), nombre (obligatorio, 100 chars), provincia, departamento, latitud, longitud, activo (checkbox)
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { crearPuertoPesca, actualizarPuertoPesca } from "../../api/puertoPesca";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { analizarCoordenadasConReferencia } from "../../api/geolocalizacion";
import { DEFAULT_MAP_ZOOM, MARKER_ICONS } from "../../config/mapConfig";
import PanelMapaGeografico from "../shared/PanelMapaGeografico";
import {
  capturarGPS,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  zona: yup
    .string()
    .required("La zona es obligatoria")
    .max(20, "La zona no puede exceder 20 caracteres")
    .trim(),
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  provincia: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  departamento: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  latitud: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  longitud: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  activo: yup.boolean().default(true),
  esPuertoOtroPais: yup.boolean().default(false),
});

const PuertoPescaForm = ({
  puertoPesca,
  onGuardar,
  onCancelar,
  onError,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!puertoPesca;
  const toast = useRef(null);

  // ⭐ OBTENER USUARIO AUTENTICADO PARA VERIFICAR SI ES SUPERUSUARIO
  const usuario = useAuthStore((state) => state.usuario);
  const esSuperUsuario = usuario?.esSuperUsuario || false;

  // Estados para coordenadas DMS
  const [latGrados, setLatGrados] = useState(0);
  const [latMinutos, setLatMinutos] = useState(0);
  const [latSegundos, setLatSegundos] = useState(0);
  const [latDireccion, setLatDireccion] = useState("S");
  const [lonGrados, setLonGrados] = useState(0);
  const [lonMinutos, setLonMinutos] = useState(0);
  const [lonSegundos, setLonSegundos] = useState(0);
  const [lonDireccion, setLonDireccion] = useState("W");

  // Estados para información geográfica
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

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      zona: "",
      nombre: "",
      provincia: "",
      departamento: "",
      latitud: null,
      longitud: null,
      activo: true,
      esPuertoOtroPais: false,
    },
  });
  // Observar nombre del puerto para mostrarlo en el mapa
  const nombrePuerto = watch("nombre");
  // Watch para observar cambios en latitud y longitud
  const latitud = watch("latitud");
  const longitud = watch("longitud");

  // Sincronizar cambios de decimal a DMS (cuando cambia latitud decimal)
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

  // Sincronizar cambios de decimal a DMS (cuando cambia longitud decimal)
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
    }
  }, [latitud, longitud]);

  /**
   * useEffect para analizar coordenadas cuando ya existen
   */
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

  /**
   * Maneja cambios en campos DMS y actualiza coordenadas decimales
   */
  // Funciones para actualizar decimal cuando cambia DMS
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

  /**
   * Captura GPS del dispositivo
   */
  const handleCapturarGPS = async () => {
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

          // Analizar coordenadas para obtener información geográfica
          setLoadingGeo(true);
          setErrorGeo(null);
          try {
            const infoGeo = await analizarCoordenadasConReferencia(
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
          toast.current?.show({
            severity: "error",
            summary: "Error GPS",
            detail: errorMessage,
            life: 3000,
          });
        },
      );
    } catch (error) {
      console.error("Error al capturar GPS:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al capturar GPS",
        life: 3000,
      });
    }
  };

  /**
   * Componente para manejar clicks en el mapa
   */
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!readOnly) {
          const { lat, lng } = e.latlng;
          setValue("latitud", lat);
          setValue("longitud", lng);
          setMapPosition([lat, lng]);
        }
      },
    });
    return null;
  };

  /**
   * Componente para manejar arrastre del marcador con Popup
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

    return (
      <Marker
        position={mapPosition}
        draggable={!readOnly}
        eventHandlers={eventHandlers}
        ref={markerRef}
      >
        <Popup>
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            📍 {nombrePuerto || "Puerto de Pesca"}
          </div>
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
   * Componente de línea de distancia entre usuario y puerto
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
   * Alternar pantalla completa del mapa
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
   * Cambiar tipo de mapa
   */
  const cambiarTipoMapa = () => {
    setTipoMapa((prev) => {
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
   * Obtener color según clasificación de aguas
   */
  const getClasificacionAguasColor = (clasificacion) => {
    if (!clasificacion) return "info";
    if (clasificacion.includes("Territorial")) return "danger";
    if (clasificacion.includes("Exclusiva")) return "success";
    return "info";
  };

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (puertoPesca) {
      setValue("zona", puertoPesca.zona || "");
      setValue("nombre", puertoPesca.nombre || "");
      setValue("provincia", puertoPesca.provincia || "");
      setValue("departamento", puertoPesca.departamento || "");
      setValue("latitud", puertoPesca.latitud || null);
      setValue("longitud", puertoPesca.longitud || null);

      // Actualizar posición del mapa si hay coordenadas
      if (puertoPesca.latitud && puertoPesca.longitud) {
        setMapPosition([puertoPesca.latitud, puertoPesca.longitud]);
      }

      setValue(
        "activo",
        puertoPesca.activo !== undefined ? puertoPesca.activo : true,
      );
      setValue(
        "esPuertoOtroPais",
        puertoPesca.esPuertoOtroPais !== undefined
          ? puertoPesca.esPuertoOtroPais
          : false,
      );
    } else {
      reset({
        zona: "",
        nombre: "",
        provincia: "",
        departamento: "",
        latitud: null,
        longitud: null,
        activo: true,
        esPuertoOtroPais: false,
      });
    }
  }, [puertoPesca, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        zona: data.zona.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
        provincia: data.provincia?.trim().toUpperCase() || null,
        departamento: data.departamento?.trim().toUpperCase() || null,
        latitud: data.latitud,
        longitud: data.longitud,
        activo: Boolean(data.activo),
        esPuertoOtroPais: Boolean(data.esPuertoOtroPais),
      };

      if (esEdicion) {
        await actualizarPuertoPesca(puertoPesca.id, datosNormalizados);
      } else {
        await crearPuertoPesca(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar puerto de pesca:", error);
      // Extraer mensaje de error del backend
      let mensajeError = "Error al guardar puerto de pesca";

      if (error.response?.data) {
        // Intentar obtener el mensaje del error
        mensajeError =
          error.response.data.message ||
          error.response.data.error ||
          error.response.data.mensaje ||
          (typeof error.response.data === "string"
            ? error.response.data
            : mensajeError);
      } else if (error.message) {
        mensajeError = error.message;
      }

      if (onError) {
        onError(mensajeError);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="p-fluid">
          <div
            style={{
              display: "flex",
              gap: 5,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Campo Zona */}
            <div style={{ flex: 1 }}>
              <label htmlFor="zona" className="p-d-block">
                Zona <span className="p-error">*</span>
              </label>
              <Controller
                name="zona"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="zona"
                    {...field}
                    placeholder="Ingrese la zona del puerto"
                    className={getFieldClass("zona")}
                    maxLength={20}
                    disabled={readOnly || loading}
                    style={{ textTransform: "uppercase" }}
                  />
                )}
              />
              {errors.zona && (
                <small className="p-error p-d-block">
                  {errors.zona.message}
                </small>
              )}
            </div>
            {/* Campo Nombre */}
            <div style={{ flex: 1 }}>
              <label htmlFor="nombre" className="p-d-block">
                Nombre <span className="p-error">*</span>
              </label>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="nombre"
                    {...field}
                    placeholder="Ingrese el nombre del puerto"
                    className={getFieldClass("nombre")}
                    maxLength={100}
                    disabled={readOnly || loading}
                    style={{ textTransform: "uppercase" }}
                  />
                )}
              />
              {errors.nombre && (
                <small className="p-error p-d-block">
                  {errors.nombre.message}
                </small>
              )}
            </div>
            {/* Campo Provincia */}
            <div style={{ flex: 1 }}>
              <label htmlFor="provincia" className="p-d-block">
                Provincia
              </label>
              <Controller
                name="provincia"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="provincia"
                    {...field}
                    placeholder="Ingrese la provincia"
                    className={getFieldClass("provincia")}
                    disabled={readOnly || loading}
                    style={{ textTransform: "uppercase" }}
                  />
                )}
              />
              {errors.provincia && (
                <small className="p-error p-d-block">
                  {errors.provincia.message}
                </small>
              )}
            </div>

            {/* Campo Departamento */}
            <div style={{ flex: 1 }}>
              <label htmlFor="departamento" className="p-d-block">
                Departamento
              </label>
              <Controller
                name="departamento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="departamento"
                    {...field}
                    placeholder="Ingrese el departamento"
                    className={getFieldClass("departamento")}
                    disabled={readOnly || loading}
                    style={{ textTransform: "uppercase" }}
                  />
                )}
              />
              {errors.departamento && (
                <small className="p-error p-d-block">
                  {errors.departamento.message}
                </small>
              )}
            </div>
            {/* Campo Es Puerto de Otro País */}
            <div style={{ flex: 1 }}>
              <Controller
                name="esPuertoOtroPais"
                control={control}
                render={({ field }) => (
                  <ToggleButton
                    id="esPuertoOtroPais"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    onLabel="Puerto Internacional"
                    offLabel="Puerto Nacional"
                    onIcon="pi pi-globe"
                    offIcon="pi pi-flag"
                    disabled={readOnly || loading}
                    className={`w-full ${
                      field.value ? "p-button-info" : "p-button-warning"
                    }`}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.esPuertoOtroPais && (
                <small className="p-error p-d-block">
                  {errors.esPuertoOtroPais.message}
                </small>
              )}
            </div>

            {/* Campo Activo */}
            <div style={{ flex: 0.5 }}>
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <ToggleButton
                    id="activo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    onLabel="Activo"
                    offLabel="Inactivo"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                    disabled={readOnly || loading}
                    className={`w-full ${
                      field.value ? "p-button-success" : "p-button-danger"
                    }`}
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.activo && (
                <small className="p-error p-d-block">
                  {errors.activo.message}
                </small>
              )}
            </div>
          </div>

          {/* ========== SECCIÓN DE GEOLOCALIZACIÓN ========== */}
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <h3 style={{ color: "#0EA5E9", marginBottom: "10px" }}>
              📍 Coordenadas GPS del Puerto
            </h3>

            {/* Botón GPS + Tabla de Coordenadas */}
            <div
              style={{
                marginTop: "1rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Botón Capturar GPS */}
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <Button
                  type="button"
                  label="Capturar GPS"
                  icon="pi pi-map-marker"
                  className="p-button-info"
                  onClick={handleCapturarGPS}
                  disabled={readOnly || loading}
                />
              </div>

              {/* Tabla de Coordenadas GPS */}
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
                    {/* Fila Decimal */}
                    <tr>
                      <td
                        style={{
                          padding: "8px",
                          border: "1px solid #0EA5E9",
                          fontWeight: "bold",
                          backgroundColor: "#F0F9FF",
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
                              disabled={readOnly || loading}
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
                              disabled={readOnly || loading}
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

                    {/* Fila DMS */}
                    <tr>
                      <td
                        style={{
                          padding: "8px",
                          border: "1px solid #0EA5E9",
                          fontWeight: "bold",
                          backgroundColor: "#F0F9FF",
                        }}
                      >
                        DMS
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
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
                            disabled={readOnly || loading}
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
                          <span
                            style={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            °
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
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
                            disabled={readOnly || loading}
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
                          <span
                            style={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            '
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
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
                            disabled={readOnly || loading}
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
                          <span
                            style={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            "
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
                        <select
                          value={latDireccion}
                          onChange={(e) => {
                            setLatDireccion(e.target.value);
                            actualizarLatitudDesdeDMS();
                          }}
                          disabled={!esSuperUsuario || readOnly || loading}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "18px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: !esSuperUsuario
                              ? "#f5f5f5"
                              : "white",
                            cursor: !esSuperUsuario ? "not-allowed" : "pointer",
                          }}
                        >
                          <option value="N">N</option>
                          <option value="S">S</option>
                        </select>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
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
                            disabled={readOnly || loading}
                            min="0"
                            max="180"
                            style={{
                              width: "140px",
                              padding: "8px",
                              border: "2px solid #0EA5E9",
                              fontSize: "18px",
                              fontWeight: "bold",
                              textAlign: "center",
                              borderRadius: "4px",
                            }}
                          />
                          <span
                            style={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            °
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
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
                            disabled={readOnly || loading}
                            min="0"
                            max="59"
                            style={{
                              width: "140px",
                              padding: "8px",
                              border: "2px solid #0EA5E9",
                              fontSize: "18px",
                              fontWeight: "bold",
                              textAlign: "center",
                              borderRadius: "4px",
                            }}
                          />
                          <span
                            style={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            '
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
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
                            disabled={readOnly || loading}
                            min="0"
                            max="59.99"
                            step="0.01"
                            style={{
                              width: "140px",
                              padding: "8px",
                              border: "2px solid #0EA5E9",
                              fontSize: "18px",
                              fontWeight: "bold",
                              textAlign: "center",
                              borderRadius: "4px",
                            }}
                          />
                          <span
                            style={{ fontSize: "18px", fontWeight: "bold" }}
                          >
                            "
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "4px",
                          border: "1px solid #0EA5E9",
                        }}
                      >
                        <select
                          value={lonDireccion}
                          onChange={(e) => {
                            setLonDireccion(e.target.value);
                            actualizarLongitudDesdeDMS();
                          }}
                          disabled={!esSuperUsuario || readOnly || loading}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "18px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: !esSuperUsuario
                              ? "#f5f5f5"
                              : "white",
                            cursor: !esSuperUsuario ? "not-allowed" : "pointer",
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
              titulo="📍 Información Geográfica - Puerto"
              colapsadoPorDefecto={true}
            >
              <DraggableMarker />
              <UserLocationMarker />
              <DistanceLine />
            </PanelMapaGeografico>
          </div>
          {/* ========== FIN SECCIÓN DE GEOLOCALIZACIÓN ========== */}
        </div>
        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="p-button-warning"
            severity="warning"
            raised
            size="small"
          />
          <Button
            label={esEdicion ? "Actualizar" : "Guardar"}
            icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
            type="submit"
            loading={loading}
            disabled={readOnly || loading}
            className="p-button-success"
            severity="success"
            raised
            size="small"
          />
        </div>
      </form>
    </>
  );
};

export default PuertoPescaForm;
