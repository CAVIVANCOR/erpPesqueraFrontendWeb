// src/components/accesoInstalacion/AccesoInstalacionForm.jsx
// Formulario profesional para AccesoInstalacion. Cumple la regla transversal ERP Megui.
// FLUJO ESPECIAL: Auto-genera fecha/hora, busca por documento, autocompleta datos y crea detalle automático.
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toolbar } from "primereact/toolbar"; // Importar Toolbar
import DocumentoVisitanteCapture from "./DocumentoVisitanteCapture";
import TicketPrinter from "./TicketPrinter";
import { toUpperCaseSafe } from "../../utils/utils";


// Importar los nuevos componentes Card
import DatosAccesoCard from "./cards/DatosAccesoCard";
import VehiculoEquiposCard from "./cards/VehiculoEquiposCard";
import ObservacionesIncidentesCard from "./cards/ObservacionesIncidentesCard";
import DocumentosAdjuntosCard from "./cards/DocumentosAdjuntosCard";
import MovimientosCard from "./cards/MovimientosCard";

// APIs necesarias para el modelo Prisma AccesoInstalacion
import { getAllTipoAccesoInstalacion } from "../../api/tipoAccesoInstalacion";
import { getAllMotivoAcceso } from "../../api/motivoAcceso";
import { getAllTipoPersona } from "../../api/tipoPersona";
import { getTiposEquipo } from "../../api/tipoEquipo";
import { getVehiculosEntidad } from "../../api/vehiculoEntidad";
import { getAreasFisicas } from "../../api/areasFisicas";
import { getTiposDocIdentidad } from "../../api/tiposDocIdentidad";
import { getSedes } from "../../api/sedes";
import { getEmpresas } from "../../api/empresa";
import { getPersonal } from "../../api/personal"; // Para personaFirmaDestinoVisitaId
import { obtenerTiposMovimientoAcceso } from "../../api/tipoMovimientoAcceso"; // Para tipos de movimiento
import { crearDetalleAccesoInstalacion, obtenerDetallesPorAccesoInstalacion } from "../../api/accesoInstalacionDetalle"; // Para crear y cargar movimientos
import {
  buscarPersonaPorDocumento,
  buscarVehiculoPorPlaca,
} from "../../api/accesoInstalacion";
import { consultarReniec } from "../../api/consultaExterna";

// Esquema de validación con Yup - Coincide exactamente con el modelo Prisma AccesoInstalacion
const schema = yup.object().shape({
  // Campos obligatorios según modelo Prisma
  sedeId: yup
    .number()
    .required("La sede es obligatoria")
    .typeError("Debe seleccionar una sede"),
  tipoAccesoId: yup
    .number()
    .required("El tipo de acceso es obligatorio")
    .typeError("Debe seleccionar un tipo de acceso"),
  fechaHora: yup
    .date()
    .required("La fecha y hora son obligatorias")
    .typeError("Fecha y hora inválidas"),

  // Campos opcionales según modelo Prisma
  empresaId: yup.number().nullable().typeError("Debe seleccionar una empresa"),
  areaDestinoVisitaId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar un área de destino"),
  tipoPersonaId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar un tipo de persona"),
  motivoId: yup.number().nullable().typeError("Debe seleccionar un motivo"),
  tipoEquipoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      // Convertir string vacío a null para evitar NaN
      return originalValue === "" ? null : value;
    })
    .typeError("Debe seleccionar un tipo de equipo válido"),

  // Datos de la persona
  nombrePersona: yup.string().max(255, "Máximo 255 caracteres"),
  tipoDocIdentidadId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar un tipo de documento"),
  numeroDocumento: yup.string().max(20, "Máximo 20 caracteres"),

  // Datos de vehículo del cliente
  vehiculoNroPlaca: yup.string().max(10, "Máximo 10 caracteres"),
  vehiculoMarca: yup.string().max(50, "Máximo 50 caracteres"),
  vehiculoModelo: yup.string().max(50, "Máximo 50 caracteres"),
  vehiculoColor: yup.string().max(30, "Máximo 30 caracteres"),

  // Datos de equipo del cliente
  equipoMarca: yup.string().max(50, "Máximo 50 caracteres"),
  equipoSerie: yup.string().max(50, "Máximo 50 caracteres"),

  // Persona destino de la visita
  personaFirmaDestinoVisitaId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar una persona"),
});

/**
 * Formulario profesional para gestión de Accesos a Instalaciones.
 * FLUJO ESPECIAL:
 * 1. Al crear nuevo: genera fecha/hora automática (no editables)
 * 2. Solicita número de documento para búsqueda
 * 3. Si existe: autocompleta datos de accesos previos
 * 4. Si no existe: permite registro manual
 * 5. Al guardar: crea registro en AccesoInstalacionDetalle automáticamente
 * Cumple estándar ERP Megui: validaciones, normalización, documentación.
 */
export default function AccesoInstalacionForm({
  item,
  onSave,
  onCancel,
  empresaId,
  sedeId,
  permisos = {},
  readOnly = false,
}) {
  const toast = useRef(null);

  // Estados para combos según modelo Prisma AccesoInstalacion
  const [sedes, setSedes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposAcceso, setTiposAcceso] = useState([]);
  const [tiposPersona, setTiposPersona] = useState([]);
  const [motivosAcceso, setMotivosAcceso] = useState([]);
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [areasDestino, setAreasDestino] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tiposDocIdentidad, setTiposDocIdentidad] = useState([]);
  const [personalDestino, setPersonalDestino] = useState([]);
  const [tiposMovimientoAcceso, setTiposMovimientoAcceso] = useState([]); // Estado para tipos de movimiento

  // Estados para datos completos (necesarios para el ticket)
  const [empresasCompletas, setEmpresasCompletas] = useState([]);
  const [sedesCompletas, setSedesCompletas] = useState([]);

  // Estados para el flujo de búsqueda
  const [loading, setLoading] = useState(false);
  const [buscandoDocumento, setBuscandoDocumento] = useState(false);
  const [buscandoPersona, setBuscandoPersona] = useState(false); // Estado para spinner de búsqueda
  const [personaEncontrada, setPersonaEncontrada] = useState(null);
  const [datosAutocompletados, setDatosAutocompletados] = useState(false);
  const [busquedaHabilitada, setBusquedaHabilitada] = useState(true); // Búsqueda automática siempre activa
  const [modalDocumentoVisible, setModalDocumentoVisible] = useState(false);

  // Estados para búsqueda de vehículo por placa
  const [buscandoVehiculo, setBuscandoVehiculo] = useState(false);
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [datosVehiculoAutocompletados, setDatosVehiculoAutocompletados] =
    useState(false);

  const modoEdicion = !!item;

  // Estado para la navegación por secciones
  const [activeCard, setActiveCard] = useState("datos");

  // Estado para movimientos
  const [movimientos, setMovimientos] = useState([]);

  // Estado para detectar si el acceso está sellado
  const accesoSellado = item?.accesoSellado || false;
  const tieneSalidaDefinitiva = item?.fechaHoraSalidaDefinitiva ? true : false;

  // Función para generar hora actual en formato HH:MM:SS
  const generarHoraActual = () => {
    const ahora = new Date();
    return ahora.toTimeString().slice(0, 8); // HH:MM:SS
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      // Campos obligatorios
      sedeId: sedeId ? Number(sedeId) : "", // Precargar desde estado global
      tipoAccesoId: 1, // Valor por defecto (ID=1)
      fechaHora: new Date(), // Generar automáticamente fecha y hora actual

      // Campos opcionales
      empresaId: empresaId ? Number(empresaId) : "", // Precargar desde estado global
      areaDestinoVisitaId: "",
      vehiculoId: "",
      tipoPersonaId: "",
      motivoId: "",
      tipoEquipoId: "",

      // Datos de la persona
      nombrePersona: "",
      tipoDocIdentidadId: 1, // DNI por defecto (ID 1 suele ser DNI)
      numeroDocumento: "",

      // Datos de vehículo del cliente
      vehiculoNroPlaca: "",
      vehiculoMarca: "",
      vehiculoModelo: "",
      vehiculoColor: "",

      // Datos de equipo del cliente
      equipoTipo: "",
      equipoMarca: "",
      equipoModelo: "",
      equipoSerie: "",

      // Persona destino de la visita
      personaFirmaDestinoVisitaId: "",
      personaDestinoVisita: "",

      // Otros campos
      observaciones: "",
      incidenteResaltante: false,
      descripcionIncidente: "",
      imprimeTicketIng: false,
      urlImpresionTicket: "",
      urlDocumentoVisitante: "",
    },
  });

  // ELIMINADO: watch de numeroDocumento para evitar búsqueda automática mientras se escribe
  // La búsqueda ahora se ejecuta solo en el evento onBlur del campo

  // Función para buscar persona por documento usando el endpoint implementado
  const buscarPersonaPorDoc = async (numDoc) => {
    if (!numDoc || numDoc.length < 8) return;

    setBuscandoPersona(true);
    setPersonaEncontrada(null);
    setDatosAutocompletados(false);

    try {
      // Buscar persona usando el endpoint implementado
      const respuesta = await buscarPersonaPorDocumento(numDoc);

      if (respuesta && respuesta.encontrada && respuesta.persona) {
        const persona = respuesta.persona;

        // Autocompletar ÚNICAMENTE los campos específicos del último registro:
        // tipoPersonaId, nombrePersona, tipoDocIdentidadId, numeroDocumento

        setValue("nombrePersona", persona.nombrePersona || "");
        setValue(
          "tipoDocIdentidadId",
          persona.tipoDocIdentidadId ? Number(persona.tipoDocIdentidadId) : 1
        );
        setValue("numeroDocumento", persona.numeroDocumento || "");

        // Autocompletar tipoPersonaId si existe en el último registro
        if (persona.tipoPersonaId) {
          setValue("tipoPersonaId", Number(persona.tipoPersonaId));
        }

        setPersonaEncontrada(persona);
        setDatosAutocompletados(true);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Datos del último acceso encontrados para: ${persona.nombrePersona}`,
          life: 3000,
        });
      } else {
        // Si no se encuentra en la base de datos local, buscar en RENIEC
        const numeroDoc = numDoc.trim();
        // Solo buscar en RENIEC si es un DNI (8 dígitos numéricos)
        if (numeroDoc.length === 8 && /^\d+$/.test(numeroDoc)) {
          toast.current?.show({
            severity: "info",
            summary: "Buscando en RENIEC",
            detail: "Persona no encontrada localmente. Consultando RENIEC...",
            life: 2000,
          });
          try {
            const respuestaReniec = await consultarReniec(numeroDoc);
            if (respuestaReniec) {
              // Construir nombre completo: first_name + first_last_name + second_last_name
              const nombreCompleto = [
                respuestaReniec.first_name,
                respuestaReniec.first_last_name,
                respuestaReniec.second_last_name
              ].filter(Boolean).join(' ');
              
              // Autocompletar con datos de RENIEC
              setValue("nombrePersona", nombreCompleto || "");
              setValue("tipoDocIdentidadId", 1); // DNI por defecto
              setValue("numeroDocumento", numeroDoc);
              
              setDatosAutocompletados(true);
              
              toast.current?.show({
                severity: "success",
                summary: "Datos encontrados en RENIEC",
                detail: `Datos autocompletados para: ${nombreCompleto}`,
                life: 3000,
              });
            } else {
              // No encontrado en RENIEC tampoco
              setPersonaEncontrada(null);
              setDatosAutocompletados(false);
              
              toast.current?.show({
                severity: "warn",
                summary: "No encontrado",
                detail: "Persona no encontrada en RENIEC. Complete los datos manualmente.",
                life: 3000,
              });
            }
          } catch (errorReniec) {
            console.error("Error consultando RENIEC:", errorReniec);
            
            toast.current?.show({
              severity: "error",
              summary: "Error en RENIEC",
              detail: "Error al consultar RENIEC. Complete los datos manualmente.",
              life: 3000,
            });
          }
        } else {
          // No es DNI, mostrar mensaje normal
          setPersonaEncontrada(null);
          setDatosAutocompletados(false);

          toast.current?.show({
            severity: "info",
            summary: "Información",
            detail: "Persona no encontrada. Complete los datos manualmente.",
            life: 3000,
          });
        }
      }
    } catch (error) {
      setPersonaEncontrada(null);
      setDatosAutocompletados(false);

      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Error en la búsqueda. Complete los datos manualmente.",
        life: 3000,
      });
    } finally {
      setBuscandoPersona(false);
    }
  };

  // ELIMINADO: watch de vehiculoNroPlaca para evitar búsqueda automática mientras se escribe
  // La búsqueda ahora se ejecuta solo en el evento onBlur del campo

  // Función para buscar vehículo por número de placa usando el endpoint implementado
  const buscarVehiculoPorPlacaFunc = async (numeroPlaca) => {
    if (!numeroPlaca || numeroPlaca.length < 3) return;

    setBuscandoVehiculo(true);
    setVehiculoEncontrado(null);
    setDatosVehiculoAutocompletados(false);

    try {
      // Buscar vehículo usando el endpoint implementado
      const respuesta = await buscarVehiculoPorPlaca(numeroPlaca);

      if (respuesta && respuesta.encontrado && respuesta.vehiculo) {
        const vehiculo = respuesta.vehiculo;

        // Autocompletar TODOS los campos de vehículo del registro más reciente:
        // vehiculoNroPlaca, vehiculoMarca, vehiculoModelo, vehiculoColor
        setValue("vehiculoNroPlaca", vehiculo.vehiculoNroPlaca || "");
        setValue("vehiculoMarca", vehiculo.vehiculoMarca || "");
        setValue("vehiculoModelo", vehiculo.vehiculoModelo || "");
        setValue("vehiculoColor", vehiculo.vehiculoColor || "");

        setVehiculoEncontrado(vehiculo);
        setDatosVehiculoAutocompletados(true);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Datos del vehículo encontrados: ${vehiculo.vehiculoMarca} ${vehiculo.vehiculoModelo} (${vehiculo.vehiculoColor})`,
          life: 3000,
        });
      } else {
        setVehiculoEncontrado(null);
        setDatosVehiculoAutocompletados(false);

        toast.current?.show({
          severity: "info",
          summary: "Información",
          detail:
            "Vehículo no encontrado o sin datos completos. Complete los datos manualmente.",
          life: 3000,
        });
      }
    } catch (error) {
      setVehiculoEncontrado(null);
      setDatosVehiculoAutocompletados(false);

      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail:
          "Error en la búsqueda de vehículo. Complete los datos manualmente.",
        life: 3000,
      });
    } finally {
      setBuscandoVehiculo(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (item) {
      // Cargar datos del item para edición según modelo Prisma AccesoInstalacion
      const datosEdicion = {
        // Campos obligatorios
        sedeId: item.sedeId ? Number(item.sedeId) : "",
        tipoAccesoId: item.tipoAccesoId ? Number(item.tipoAccesoId) : "",
        fechaHora: item.fechaHora ? new Date(item.fechaHora) : new Date(),

        // Campos opcionales
        empresaId: item.empresaId ? Number(item.empresaId) : "",
        areaDestinoVisitaId: item.areaDestinoVisitaId
          ? Number(item.areaDestinoVisitaId)
          : "",
        vehiculoId: item.vehiculoId ? Number(item.vehiculoId) : "",
        tipoPersonaId: item.tipoPersonaId ? Number(item.tipoPersonaId) : "",
        motivoId: item.motivoId ? Number(item.motivoId) : "",
        tipoEquipoId: item.tipoEquipoId ? Number(item.tipoEquipoId) : "",

        // Datos de la persona
        nombrePersona: item.nombrePersona || "",
        tipoDocIdentidadId: item.tipoDocIdentidadId
          ? Number(item.tipoDocIdentidadId)
          : "",
        numeroDocumento: item.numeroDocumento || "",

        // Datos de vehículo del cliente
        vehiculoNroPlaca: item.vehiculoNroPlaca || "",
        vehiculoMarca: item.vehiculoMarca || "",
        vehiculoModelo: item.vehiculoModelo || "",
        vehiculoColor: item.vehiculoColor || "",

        // Datos de equipo del cliente
        equipoMarca: item.equipoMarca || "",
        equipoSerie: item.equipoSerie || "",

        // Persona destino de la visita
        personaFirmaDestinoVisitaId: item.personaFirmaDestinoVisitaId
          ? Number(item.personaFirmaDestinoVisitaId)
          : "",

        // Otros campos
        observaciones: item.observaciones || "",
        incidenteResaltante: item.incidenteResaltante || false,
        descripcionIncidente: item.descripcionIncidente || "",
        imprimeTicketIng:
          item.imprimeTicketIng !== undefined ? item.imprimeTicketIng : false,
        urlImpresionTicket: item.urlImpresionTicket || "",
        urlDocumentoVisitante: item.urlDocumentoVisitante || "",
      };

      // Función async para cargar movimientos existentes
      const cargarMovimientos = async () => {
        if (item.id) {
          try {
            const movimientosExistentes = await obtenerDetallesPorAccesoInstalacion(Number(item.id));
            setMovimientos(movimientosExistentes);
          } catch (error) {
            // Inicializar con array vacío si hay error
            setMovimientos([]);
            toast.current?.show({
              severity: 'warn',
              summary: 'Error de Carga',
              detail: 'No se pudieron cargar los movimientos existentes',
              life: 3000
            });
          }
        } else {
          // Nuevo registro - inicializar con array vacío
          setMovimientos([]);
        }
      };

      // Cargar movimientos
      cargarMovimientos();

      reset(datosEdicion);
    } else {
      // Para nuevo registro: generar fecha y hora automáticamente
      const fechaHoraActual = new Date();
      // Mantener los valores por defecto pero asegurar fecha/hora actual
      setValue("fechaHora", fechaHoraActual);
      // Inicializar movimientos vacío para nuevo registro
      setMovimientos([]);
    }
  }, [item, setValue, reset]);

  /**
   * Carga todos los datos necesarios para los combos según modelo Prisma AccesoInstalacion
   */
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        sedesData,
        empresasData,
        tiposAccesoData,
        tiposPersonaData,
        motivosAccesoData,
        tiposEquipoData,
        areasDestinoData,
        vehiculosData,
        tiposDocIdentidadData,
        personalDestinoData,
        tiposMovimientoAccesoData, // Cargar tipos de movimiento
      ] = await Promise.all([
        getSedes(),
        getEmpresas(),
        getAllTipoAccesoInstalacion(),
        getAllTipoPersona(),
        getAllMotivoAcceso(),
        getTiposEquipo(),
        getAreasFisicas(),
        getVehiculosEntidad(),
        getTiposDocIdentidad(),
        getPersonal(),
        obtenerTiposMovimientoAcceso(), // Cargar tipos de movimiento
      ]);

      // Normalizar datos según regla ERP Megui
      setSedes(
        sedesData.map((s) => ({
          label: s.nombre || "",
          value: Number(s.id),
        }))
      );

      setEmpresas(
        empresasData.map((e) => ({
          label: e.razonSocial || "",
          value: Number(e.id),
        }))
      );

      setTiposAcceso(
        tiposAccesoData.map((t) => ({
          label: t.nombre || "",
          value: Number(t.id),
        }))
      );

      setTiposPersona(
        tiposPersonaData.map((t) => ({
          label: t.descripcion || t.nombre || "",
          value: Number(t.id),
        }))
      );

      setMotivosAcceso(
        motivosAccesoData.map((m) => ({
          label: m.descripcion || m.nombre || "",
          value: Number(m.id),
        }))
      );

      setTiposEquipo(
        tiposEquipoData.map((e) => ({
          label: e.descripcion || e.nombre || "",
          value: Number(e.id),
        }))
      );

      setAreasDestino(
        areasDestinoData.map((a) => ({
          label: a.nombre || "",
          value: Number(a.id),
        }))
      );

      setVehiculos(
        vehiculosData.map((v) => ({
          label: `${v.placa || ""} - ${v.marca || ""} ${v.modelo || ""}`.trim(),
          value: Number(v.id),
        }))
      );

      setTiposDocIdentidad(
        tiposDocIdentidadData.map((t) => ({
          label: t.codigo,
          value: Number(t.id),
        }))
      );

      setPersonalDestino(
        personalDestinoData.map((p) => ({
          label: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
          value: Number(p.id),
        }))
      );

      setTiposMovimientoAcceso(
        tiposMovimientoAccesoData.map((t) => ({
          label: t.nombre || "",
          value: Number(t.id),
        }))
      );

      // Guardar datos completos de empresas y sedes
      setEmpresasCompletas(empresasData);
      setSedesCompletas(sedesData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos del formulario",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función de envío del formulario con creación automática de detalle
   * FLUJO ESPECIAL: Al guardar, crea automáticamente el registro en AccesoInstalacionDetalle
   */
  const onSubmit = async (data) => {    
    setLoading(true);
    try {
      // Normalizar datos antes de enviar según regla ERP Megui
      const datosNormalizados = {
        // Campos obligatorios según modelo Prisma AccesoInstalacion
        // En modo edición usar valores del formulario, en modo nuevo usar estado global
        sedeId: modoEdicion
          ? data.sedeId
            ? Number(data.sedeId)
            : ""
          : sedeId
          ? Number(sedeId)
          : "",
        empresaId: modoEdicion
          ? data.empresaId
            ? Number(data.empresaId)
            : ""
          : empresaId
          ? Number(empresaId)
          : "",
        tipoAccesoId: data.tipoAccesoId ? Number(data.tipoAccesoId) : "",
        fechaHora: data.fechaHora || new Date(),

        // Campos opcionales según modelo Prisma
        areaDestinoVisitaId: data.areaDestinoVisitaId
          ? Number(data.areaDestinoVisitaId)
          : "",
        tipoPersonaId: data.tipoPersonaId ? Number(data.tipoPersonaId) : "",
        motivoId: data.motivoId ? Number(data.motivoId) : "",
        tipoEquipoId: data.tipoEquipoId ? Number(data.tipoEquipoId) : null,

        // Datos de la persona - TODOS EN MAYÚSCULAS
        nombrePersona: toUpperCaseSafe(data.nombrePersona),
        tipoDocIdentidadId: data.tipoDocIdentidadId
          ? Number(data.tipoDocIdentidadId)
          : "",
        numeroDocumento: toUpperCaseSafe(data.numeroDocumento),

        // Datos de vehículo - TODOS EN MAYÚSCULAS
        vehiculoNroPlaca: toUpperCaseSafe(data.vehiculoNroPlaca),
        vehiculoMarca: toUpperCaseSafe(data.vehiculoMarca),
        vehiculoModelo: toUpperCaseSafe(data.vehiculoModelo),
        vehiculoColor: toUpperCaseSafe(data.vehiculoColor),

        // Datos de equipo - TODOS EN MAYÚSCULAS
        equipoMarca: toUpperCaseSafe(data.equipoMarca),
        equipoSerie: toUpperCaseSafe(data.equipoSerie),

        // Persona destino de la visita
        personaFirmaDestinoVisitaId: data.personaFirmaDestinoVisitaId
          ? Number(data.personaFirmaDestinoVisitaId)
          : "",

        // Otros campos - STRINGS EN MAYÚSCULAS
        observaciones: toUpperCaseSafe(data.observaciones),
        incidenteResaltante: Boolean(data.incidenteResaltante),
        descripcionIncidente: toUpperCaseSafe(data.descripcionIncidente),
        imprimeTicketIng: Boolean(data.imprimeTicketIng),
        urlImpresionTicket: data.urlImpresionTicket?.trim() || "",
        urlDocumentoVisitante: data.urlDocumentoVisitante?.trim() || "",
      };
      // Llamar a la función de guardado del componente padre
      await onSave(datosNormalizados);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: modoEdicion
          ? "Acceso actualizado correctamente"
          : "Acceso registrado correctamente. Se creó el detalle de entrada automáticamente.",
      });
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      
      // Manejo detallado de errores para mostrar mensajes específicos al usuario
      let mensajeError = "Error desconocido al guardar el registro";
      let detalleError = "";

      if (error.response) {
        // Errores del backend (con respuesta HTTP)
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            // Error de validación del backend
            mensajeError = "Error de Validación";
            detalleError = data?.message || data?.error || "Los datos ingresados no son válidos. Verifique los campos requeridos.";
            break;
            
          case 404:
            mensajeError = "Recurso No Encontrado";
            detalleError = data?.message || "El endpoint solicitado no existe en el servidor.";
            break;
            
          case 409:
            // Error de conflicto (duplicados, etc.)
            mensajeError = "Conflicto de Datos";
            detalleError = data?.message || "Ya existe un registro con estos datos.";
            break;
            
          case 422:
            // Error de validación específica
            mensajeError = "Datos Inválidos";
            detalleError = data?.message || "Los datos proporcionados no cumplen con las reglas de validación.";
            break;
            
          case 500:
            mensajeError = "Error Interno del Servidor";
            detalleError = data?.message || "Error interno del servidor. Contacte al administrador del sistema.";
            break;
            
          default:
            mensajeError = `Error HTTP ${status}`;
            detalleError = data?.message || `Error del servidor con código ${status}.`;
        }
      } else if (error.request) {
        // Error de red (sin respuesta del servidor)
        mensajeError = "Error de Conexión";
        detalleError = "No se pudo conectar con el servidor. Verifique su conexión a internet.";
      } else if (error.name === 'ValidationError') {
        // Errores de validación del frontend (YUP/React Hook Form)
        mensajeError = "Error de Validación del Formulario";
        detalleError = error.message || "Hay campos con errores de validación. Revise el formulario.";
      } else {
        // Otros errores (JavaScript, lógica, etc.)
        mensajeError = "Error Inesperado";
        detalleError = error.message || "Ha ocurrido un error inesperado. Intente nuevamente.";
      }

      // Mostrar toast de error con mensaje específico
      toast.current?.show({
        severity: "error",
        summary: mensajeError,
        detail: detalleError,
        life: 6000, // 6 segundos para que el usuario pueda leer el mensaje completo
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para buscar persona por documento
   * Se ejecuta cuando el usuario ingresa un número de documento
   */
  const handleBuscarPersona = async (numeroDoc) => {
    if (!numeroDoc || numeroDoc.length < 8 || modoEdicion || !busquedaHabilitada) {
      return;
    }

    setBuscandoPersona(true);
    try {
      // Aquí iría la lógica de búsqueda por documento
      // Por ahora, solo mostramos que la función existe
      
      // TODO: Implementar búsqueda real cuando esté disponible en el backend
      // const persona = await buscarPersonaPorDocumento(numeroDoc);
      // if (persona) {
      //   setValue('nombrePersona', persona.nombres);
      //   setValue('tipoDocIdentidadId', persona.tipoDocIdentidadId);
      // }
      
    } catch (error) {
      console.error('Error buscando persona:', error);
      toast.current?.show({
        severity: 'warn',
        summary: 'Búsqueda',
        detail: 'No se pudo buscar la persona. Ingrese los datos manualmente.'
      });
    } finally {
      setBuscandoPersona(false);
    }
  };

  // Función para manejar cuando se sube un documento de visitante
  const handleDocumentoSubido = (urlDocumento) => {
    // Actualizar el campo urlDocumentoVisitante en el formulario
    setValue("urlDocumentoVisitante", urlDocumento);
    setModalDocumentoVisible(false);

    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento del visitante se ha guardado correctamente",
      life: 4000,
    });
  };

  // Función para mostrar mensajes de error de validación YUP
  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name]?.message}</small>
    );
  };

  const handleMovimientoAgregado = async (movimiento) => {
    try {
      // Validar que estemos en modo edición (necesitamos el ID del acceso)
      if (!modoEdicion || !item?.id) {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se puede agregar movimiento a un registro no guardado. Guarde primero el acceso.',
          life: 3000
        });
        return;
      }

      // Preparar datos para la API según modelo Prisma AccesoInstalacionDetalle
      const datosMovimiento = {
        accesoInstalacionId: Number(item.id),
        fechaHora: movimiento.fechaHora,
        tipoMovimientoId: Number(movimiento.tipoMovimientoId),
        areaDestinoVisitaId: movimiento.areaDestinoVisitaId ? Number(movimiento.areaDestinoVisitaId) : null,
        observaciones: toUpperCaseSafe(movimiento.observaciones)
      };

      // Llamar a la API para crear el movimiento real
      const nuevoMovimiento = await crearDetalleAccesoInstalacion(datosMovimiento);

      // Actualizar el estado local con el movimiento creado (incluye ID generado)
      setMovimientos([...movimientos, nuevoMovimiento]);

      // Mostrar mensaje de éxito
      toast.current.show({
        severity: 'success',
        summary: 'Movimiento Creado',
        detail: 'El movimiento se ha registrado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('❌ Error al crear movimiento:', error);

      // Manejo de errores profesional
      let mensajeError = 'Error al crear movimiento';
      let detalleError = '';

      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            // Error de validación del backend
            mensajeError = 'Error de Validación';
            detalleError = data?.message || 'Los datos del movimiento no son válidos';
            break;
            
          case 404:
            mensajeError = 'Recurso No Encontrado';
            detalleError = 'El acceso a instalación no existe';
            break;
            
          case 422:
            // Error de validación específica
            mensajeError = 'Error de Validación';
            detalleError = data?.message || 'Datos del movimiento incorrectos';
            break;
            
          case 500:
            mensajeError = 'Error del Servidor';
            detalleError = 'Error interno del servidor. Contacte al administrador.';
            break;
            
          default:
            mensajeError = `Error HTTP ${status}`;
            detalleError = data?.message || `Error del servidor con código ${status}`;
        }
      } else if (error.request) {
        mensajeError = 'Error de Conexión';
        detalleError = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      }

      // Mostrar mensaje de error
      toast.current.show({
        severity: 'error',
        summary: mensajeError,
        detail: detalleError,
        life: 5000
      });
    }
  };

  // Función para manejar la Salida Definitiva
  const handleSalidaDefinitiva = async () => {
    try {
      // Validar que estemos en modo edición (necesitamos el ID del acceso)
      if (!modoEdicion || !item?.id) {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se puede procesar la salida definitiva en un registro no guardado',
          life: 3000
        });
        return;
      }

      // Validar que no haya ya una salida definitiva
      const yaHaySalidaDefinitiva = movimientos.some(m => m.tipoMovimientoId === 4);
      if (yaHaySalidaDefinitiva) {
        toast.current.show({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Este registro ya tiene una salida definitiva registrada',
          life: 3000
        });
        return;
      }


      // Llamar a la API para procesar salida definitiva (actualiza campos Y crea movimiento automáticamente)
      const { procesarSalidaDefinitiva } = await import('../../api/accesoInstalacion');
      const accesoActualizado = await procesarSalidaDefinitiva(Number(item.id));

      // Actualizar los valores del formulario con los datos actualizados
      setValue('fechaHoraSalidaDefinitiva', accesoActualizado.fechaHoraSalidaDefinitiva);
      setValue('accesoSellado', accesoActualizado.accesoSellado);

      // Recargar movimientos desde la base de datos para incluir el nuevo movimiento de salida
      await recargarMovimientos();

      // Mostrar mensaje de éxito
      toast.current.show({
        severity: 'success',
        summary: 'Salida Procesada',
        detail: 'Salida definitiva registrada correctamente. El acceso ha sido sellado.',
        life: 4000
      });

      // Cerrar el formulario automáticamente después de procesar la salida definitiva
      // y notificar al componente padre para que actualice la lista
      setTimeout(() => {
        if (onCancel) {
          onCancel(true); // Pasar true para indicar que debe recargar la lista
        }
      }, 1500); // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito

    } catch (error) {
      console.error('❌ Error al procesar salida definitiva:', error);
      
      // Mostrar mensaje de error
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al procesar la salida definitiva',
        life: 5000
      });
    }
  };

  // Función para recargar movimientos desde la base de datos
  const recargarMovimientos = async () => {
    if (!modoEdicion || !item?.id) {
      return;
    }

    try {
      const movimientosActualizados = await obtenerDetallesPorAccesoInstalacion(Number(item.id));
      setMovimientos(movimientosActualizados);
      
      toast.current?.show({
        severity: 'info',
        summary: 'Movimientos Actualizados',
        detail: 'La lista de movimientos se ha actualizado correctamente',
        life: 2000
      });
    } catch (error) {
      console.error('❌ Error al recargar movimientos:', error);
      toast.current?.show({
        severity: 'warn',
        summary: 'Error de Actualización',
        detail: 'No se pudieron actualizar los movimientos',
        life: 3000
      });
    }
  };

  // Función para manejar el clic en el card de movimientos
  const handleMovimientosCardClick = () => {
    setActiveCard('movimientos');
    // Recargar movimientos automáticamente al hacer clic en el card
    recargarMovimientos();
  };

  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: "200px" }}
      >
        <ProgressSpinner size="50" strokeWidth="4" />
      </div>
    );
  }
  return (
    <div>
      <Toast ref={toast} />

      <form 
        onSubmit={(e) => {          
          // Llamar a handleSubmit y capturar cualquier error
          const submitHandler = handleSubmit(
            (data) => {
              onSubmit(data);
            },
            (errors) => {
              console.error('❌ [DEBUG] Errores de validación en handleSubmit:', errors);
              console.error('❌ [DEBUG] Errores detallados:', JSON.stringify(errors, null, 2));
            }
          );
          
          submitHandler(e);
        }} 
        className="p-fluid"
      >
        {/* Navegación elegante por secciones con Toolbar nativo */}
        <Toolbar
          className="mb-4"
          center={
            <ButtonGroup>
              <Button
                icon="pi pi-user"
                tooltip="Datos de la Persona, Tipo de Persona, Motivo, Area y Persona Destino"
                tooltipOptions={{ position: 'bottom' }}
                className={activeCard === 'datos' ? 'p-button-primary' : 'p-button-outlined'}
                onClick={() => setActiveCard('datos')}
                type="button"
              />
              <Button
                icon="pi pi-car"
                tooltip="Datos delVehículo y/o Equipos"
                tooltipOptions={{ position: 'bottom' }}
                className={activeCard === 'vehiculo' ? 'p-button-primary' : 'p-button-outlined'}
                onClick={() => setActiveCard('vehiculo')}
                type="button"
              />
              <Button
                icon="pi pi-file-edit"
                tooltip="Observaciones e Incidentes Resaltantes"
                tooltipOptions={{ position: 'bottom' }}
                className={activeCard === 'observaciones' ? 'p-button-primary' : 'p-button-outlined'}
                onClick={() => setActiveCard('observaciones')}
                type="button"
              />
              <Button
                icon="pi pi-file-pdf"
                tooltip="Documentacion del visitante"
                tooltipOptions={{ position: 'bottom' }}
                className={activeCard === 'documentos' ? 'p-button-primary' : 'p-button-outlined'}
                onClick={() => setActiveCard('documentos')}
                type="button"
              />
              {modoEdicion && (
                <Button
                  icon="pi pi-chart-line"
                  tooltip="Movimientos"
                  tooltipOptions={{ position: 'bottom' }}
                  className={activeCard === 'movimientos' ? 'p-button-primary' : 'p-button-outlined'}
                  onClick={handleMovimientosCardClick}
                  type="button"
                />
              )}
            </ButtonGroup>
          }
        />

        {/* Contenido de la Card activa */}
        <div className="card-content">
          {activeCard === 'datos' && (
            <DatosAccesoCard
              control={control}
              watch={watch}
              getFormErrorMessage={getFormErrorMessage}
              tiposDocumento={tiposDocIdentidad}
              tiposPersona={tiposPersona}
              tiposAcceso={tiposAcceso}
              motivosAcceso={motivosAcceso}
              personalDestino={personalDestino}
              areasDestino={areasDestino}
              modoEdicion={modoEdicion}
              buscandoPersona={buscandoPersona}
              onDocumentBlur={buscarPersonaPorDoc}
              accesoSellado={accesoSellado}
              readOnly={readOnly}
            />
          )}

          {activeCard === 'vehiculo' && (
            <VehiculoEquiposCard
              control={control}
              watch={watch}
              getFormErrorMessage={getFormErrorMessage}
              tiposEquipo={tiposEquipo}
              buscandoVehiculo={buscandoVehiculo}
              onPlacaBlur={buscarVehiculoPorPlacaFunc}
              accesoSellado={accesoSellado}
              readOnly={readOnly}
            />
          )}

          {activeCard === 'observaciones' && (
            <ObservacionesIncidentesCard
              control={control}
              watch={watch}
              setValue={setValue}
              getFormErrorMessage={getFormErrorMessage}
              accesoSellado={accesoSellado}
              readOnly={readOnly}
            />
          )}

          {activeCard === 'documentos' && (
            <DocumentosAdjuntosCard
              control={control}
              watch={watch}
              getFormErrorMessage={getFormErrorMessage}
              setValue={setValue}
              toast={toast}
              accesoSellado={accesoSellado}
              readOnly={readOnly}
            />
          )}

          {activeCard === 'movimientos' && (
            <MovimientosCard
              movimientos={movimientos}
              onMovimientoAgregado={handleMovimientoAgregado}
              areasDestino={areasDestino}
              tiposMovimientoAcceso={tiposMovimientoAcceso} // Pasar tipos de movimiento
              modoEdicion={modoEdicion}
              accesoSellado={accesoSellado}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* SECCIÓN DE BOTONES - Actualizada para manejar sellado */}
        <div className="flex flex-column gap-3 mt-4">
          {/* Mensaje informativo si el acceso está sellado */}
          {accesoSellado && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
              <div className="flex items-center">
                <i className="pi pi-lock text-yellow-600 mr-2"></i>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    🔒 Acceso Sellado
                  </p>
                  <p className="text-xs text-yellow-600">
                    Este acceso tiene salida definitiva y no puede ser modificado. Solo se permite imprimir ticket.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grupo de botones principales */}
          <ButtonGroup>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{ minWidth: "120px" }}
            />
            <Button
              label={modoEdicion ? "Actualizar" : "Registrar"}
              icon={modoEdicion ? "pi pi-check" : "pi pi-plus"}
              className="p-button-success"
              type="submit"
              loading={loading}
              disabled={readOnly || accesoSellado || !permisos.puedeEditar}
              tooltip={readOnly ? "Modo solo lectura" : !permisos.puedeEditar ? "No tiene permisos para editar" : accesoSellado ? "Acceso sellado" : ""}
              style={{ minWidth: "120px" }}
            />
          </ButtonGroup>
          
          {/* Grupo de botones secundarios (solo en modo edición) */}
          {modoEdicion && (
            <ButtonGroup>
              <Button
                label="Salida Definitiva"
                icon="pi pi-sign-out"
                className="p-button-warning"
                type="button"
                onClick={handleSalidaDefinitiva}
                disabled={loading || accesoSellado || tieneSalidaDefinitiva}
                style={{ minWidth: "120px" }}
              />
              
              {/* Botón Ticket - Solo si imprimeTicketIng está marcado - SIEMPRE HABILITADO */}
              {(() => {
                const imprimeTicket = watch("imprimeTicketIng");
                return (
                  imprimeTicket && (
                    <TicketPrinter
                      datosAcceso={{
                        id: item?.id || "NUEVO",
                        fechaHora: watch("fechaHora"),
                        nombrePersona: watch("nombrePersona"),
                        numeroDocumento: watch("numeroDocumento"),
                        tipoPersona: tiposPersona.find(
                          (tp) => tp.value === watch("tipoPersonaId")
                        ),
                        motivoAcceso: motivosAcceso.find(
                          (ma) => ma.value === watch("motivoAccesoId")
                        ),
                        empresa: empresasCompletas.find(
                          (e) => Number(e.id) === Number(watch("empresaId"))
                        ),
                        sede: sedesCompletas.find(
                          (s) => Number(s.id) === Number(watch("sedeId"))
                        ),
                        vehiculoNroPlaca: watch("vehiculoNroPlaca"),
                        vehiculoMarca: watch("vehiculoMarca"),
                        vehiculoModelo: watch("vehiculoModelo"),
                        vehiculoColor: watch("vehiculoColor"),
                        equipoTipo: watch("equipoTipo"),
                        equipoMarca: watch("equipoMarca"),
                        equipoModelo: watch("equipoModelo"),
                        equipoSerie: watch("equipoSerie"),
                        areaDestino: areasDestino.find(
                          (af) => af.value === watch("areaDestinoVisitaId")
                        ),
                        personaDestino:
                          personalDestino.find(
                            (p) =>
                              p.value === watch("personaFirmaDestinoVisitaId")
                          )?.label || "",
                      }}
                      toast={toast}
                      buttonStyle={{
                        style: { minWidth: "120px" },
                        className: "p-button-info",
                      }}
                      buttonLabel="Ticket"
                    />
                  )
                );
              })()}
            </ButtonGroup>
          )}
        </div>

        {/* Modal para captura de documentos */}
        <DocumentoVisitanteCapture
          visible={modalDocumentoVisible}
          onHide={() => setModalDocumentoVisible(false)}
          onDocumentoSubido={handleDocumentoSubido}
          numeroDocumento={watch("numeroDocumento")}
          nombrePersona={watch("nombrePersona")}
        />
      </form>
    </div>
  );
}
