// src/components/accesoInstalacion/AccesoInstalacionForm.jsx
// Formulario profesional para AccesoInstalacion. Cumple la regla transversal ERP Megui.
// FLUJO ESPECIAL: Auto-genera fecha/hora, busca por documento, autocompleta datos y crea detalle automático.
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { TabView, TabPanel } from "primereact/tabview";
import DocumentoVisitanteCapture from "./DocumentoVisitanteCapture";
import PDFViewer from "./PDFViewer";
import TicketPrinter from "./TicketPrinter";
import { toUpperCaseSafe } from "../../utils/utils";

// Store de autenticación
import { useAuthStore } from "../../shared/stores/useAuthStore";

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
import {
  buscarPersonaPorDocumento,
  buscarVehiculoPorPlaca,
} from "../../api/accesoInstalacion";

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
  vehiculoId: yup.number().nullable().typeError("Debe seleccionar un vehículo"),
  tipoPersonaId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar un tipo de persona"),
  motivoId: yup.number().nullable().typeError("Debe seleccionar un motivo"),
  tipoEquipoId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar un tipo de equipo"),

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

  // Otros campos
  observaciones: yup.string().max(500, "Máximo 500 caracteres"),
  incidenteResaltante: yup.boolean().required(),
  descripcionIncidente: yup.string().max(500, "Máximo 500 caracteres"),
  imprimeTicketIng: yup.boolean().required(),
  urlImpresionTicket: yup.string().url("URL inválida"),
  urlDocumentoVisitante: yup
    .string()
    .test("url-or-path", "URL o ruta inválida", function (value) {
      if (!value) return true; // Campo opcional

      // Permitir URLs completas (http:// o https://)
      try {
        new URL(value);
        return true;
      } catch {
        // Si no es URL completa, verificar si es ruta relativa válida
        return value.startsWith("/") && value.length > 1;
      }
    }),
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
        setPersonaEncontrada(null);
        setDatosAutocompletados(false);

        toast.current?.show({
          severity: "info",
          summary: "Información",
          detail: "Persona no encontrada. Complete los datos manualmente.",
          life: 3000,
        });
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

      reset(datosEdicion);
    } else {
      // Para nuevo registro: generar fecha y hora automáticamente
      const fechaHoraActual = new Date();
      // Mantener los valores por defecto pero asegurar fecha/hora actual
      setValue("fechaHora", fechaHoraActual);
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
          label: t.descripcion || t.nombre || "",
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
          label: a.descripcion || a.nombre || "",
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
          label: `${t.codigo} - ${t.nombre}`,
          value: Number(t.id),
        }))
      );

      setPersonalDestino(
        personalDestinoData.map((p) => ({
          label: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
          value: Number(p.id),
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
        tipoEquipoId: data.tipoEquipoId ? Number(data.tipoEquipoId) : "",

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
      // Mostrar información más detallada del error
      let mensajeError = "Error al guardar el registro";

      if (error.response?.status === 400) {
        mensajeError = "Error de validación. Verifique los datos ingresados.";
      } else if (error.response?.status === 404) {
        mensajeError =
          "Endpoint no encontrado. El backend no está implementado.";
      } else if (error.response?.status === 500) {
        mensajeError = "Error interno del servidor. Contacte al administrador.";
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    } finally {
      setLoading(false);
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

  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name]?.message}</small>
    );
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

      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <TabView
          scrollable
          className="tabview-responsive"
          style={{
            fontSize: "14px",
          }}
        >
          {/* PESTAÑA 1: DATOS PRINCIPALES DEL ACCESO */}
          <TabPanel header="Datos del Acceso" leftIcon="pi pi-calendar">
            <div className="card">
              <h5 className="mb-3">1. Empresa y Sede</h5>

              {/* Empresa y Sede (mostrados como texto desde estado global) */}
              <div
                className="formgrid grid"
                style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
              >
                <div
                  className="field"
                  style={{ flex: "1 1 45%", minWidth: "250px" }}
                >
                  <label htmlFor="empresaTexto" className="font-bold">
                    Empresa *
                  </label>
                  <InputText
                    id="empresaTexto"
                    value={(() => {
                      // En modo edición, usar el valor del formulario; en modo nuevo usar el estado global
                      const empresaIdAUsar = modoEdicion
                        ? watch("empresaId")
                        : empresaId;

                      if (!empresaIdAUsar) return "No hay empresa seleccionada";
                      if (empresas.length === 0) return "Cargando empresa...";
                      const empresa = empresas.find((e) => {
                        const match =
                          Number(e.value) === Number(empresaIdAUsar);
                        return match;
                      });
                      return (
                        empresa?.label ||
                        `Empresa ID: ${empresaIdAUsar} (no encontrada en ${empresas.length} empresas)`
                      );
                    })()}
                    disabled
                    className="p-inputtext-sm"
                    style={{ backgroundColor: "#f8f9fa", color: "#495057" }}
                  />
                  {/* Campo oculto para mantener el valor en el formulario */}
                  <Controller
                    name="empresaId"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="hidden"
                        {...field}
                        value={modoEdicion ? field.value : empresaId || ""}
                      />
                    )}
                  />
                </div>
                <div
                  className="field"
                  style={{ flex: "1 1 45%", minWidth: "250px" }}
                >
                  <label htmlFor="sedeTexto" className="font-bold">
                    Sede *
                  </label>
                  <InputText
                    id="sedeTexto"
                    value={(() => {
                      // En modo edición, usar el valor del formulario; en modo nuevo usar el estado global
                      const sedeIdAUsar = modoEdicion
                        ? watch("sedeId")
                        : sedeId;

                      if (!sedeIdAUsar) return "No hay sede seleccionada";
                      if (sedes.length === 0) return "Cargando sede...";
                      const sede = sedes.find((s) => {
                        const match = Number(s.value) === Number(sedeIdAUsar);
                        return match;
                      });
                      return (
                        sede?.label ||
                        `Sede ID: ${sedeIdAUsar} (no encontrada en ${sedes.length} sedes)`
                      );
                    })()}
                    disabled
                    className="p-inputtext-sm"
                    style={{ backgroundColor: "#f8f9fa", color: "#495057" }}
                  />
                  {/* Campo oculto para mantener el valor en el formulario */}
                  <Controller
                    name="sedeId"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="hidden"
                        {...field}
                        value={modoEdicion ? field.value : sedeId || ""}
                      />
                    )}
                  />
                </div>
              </div>

              <h5 className="mb-3">2. Identificación del Visitante</h5>
              <div
                className="formgrid grid"
                style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
              >
                <div
                  className="field"
                  style={{ flex: "1 1 30%", minWidth: "200px" }}
                >
                  <label htmlFor="fechaHora" className="font-bold">
                    Fecha y Hora *
                  </label>
                  <div
                    className="p-inputtext p-component p-inputtext-sm"
                    style={{
                      backgroundColor: "#f8f9fa",
                      color: "#6c757d",
                      cursor: "not-allowed",
                      opacity: 0.7,
                      border: "1px solid #dee2e6",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      minHeight: "2.357rem",
                      display: "flex",
                      alignItems: "center",
                      userSelect: "none", // No seleccionable
                      pointerEvents: "none", // No interactivo
                    }}
                  >
                    {watch("fechaHora")
                      ? new Date(watch("fechaHora")).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                  {getFormErrorMessage("fechaHora")}
                  {!modoEdicion && (
                    <small className="text-blue-500">
                      Generada automáticamente
                    </small>
                  )}
                </div>
                <div
                  className="field"
                  style={{ flex: "1 1 30%", minWidth: "200px" }}
                >
                  <label htmlFor="tipoAccesoId" className="font-bold">
                    Tipo de Acceso *
                  </label>
                  <Controller
                    name="tipoAccesoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoAccesoId"
                        {...field}
                        value={field.value ? Number(field.value) : 1}
                        options={tiposAcceso.map((t) => ({
                          ...t,
                          id: Number(t.id),
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione tipo de acceso"
                        className={errors.tipoAccesoId ? "p-invalid" : ""}
                        showClear={false}
                      />
                    )}
                  />
                  {getFormErrorMessage("tipoAccesoId")}
                </div>
              </div>

              {/* Segunda línea: Tipo Documento y N° Documento */}
              <div
                className="formgrid grid"
                style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
              >
                <div
                  className="field"
                  style={{ flex: "1 1 45%", minWidth: "200px" }}
                >
                  <label htmlFor="tipoDocIdentidadId" className="font-bold">
                    Tipo Documento *
                  </label>
                  <Controller
                    name="tipoDocIdentidadId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoDocIdentidadId"
                        {...field}
                        value={field.value ? Number(field.value) : 1} // DNI por defecto (ID=1)
                        options={tiposDocIdentidad.map((t) => ({
                          ...t,
                          id: Number(t.id),
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Tipo de documento"
                        className={errors.tipoDocIdentidadId ? "p-invalid" : ""}
                        showClear={false} // No permitir limpiar, DNI por defecto
                      />
                    )}
                  />
                  {getFormErrorMessage("tipoDocIdentidadId")}
                </div>
                <div
                  className="field"
                  style={{ flex: "1 1 45%", minWidth: "200px" }}
                >
                  <label
                    htmlFor="numeroDocumento"
                    className={`font-bold ${
                      errors.numeroDocumento ? "text-red-500" : ""
                    }`}
                  >
                    📱 N° Documento{" "}
                    {buscandoPersona && (
                      <i className="pi pi-spin pi-spinner ml-2 text-blue-500"></i>
                    )}
                  </label>
                  <Controller
                    name="numeroDocumento"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroDocumento"
                        {...field}
                        placeholder="Escanee código de barras o ingrese DNI"
                        className={errors.numeroDocumento ? "p-invalid" : ""}
                        disabled={buscandoPersona}
                        maxLength={20}
                        autoFocus={!modoEdicion} // Foco automático para escaneo
                        onBlur={(e) => {
                          // Ejecutar búsqueda cuando pierda el foco y contenga datos
                          const valorDocumento = e.target.value?.trim();
                          if (
                            valorDocumento &&
                            valorDocumento.length >= 8 &&
                            !modoEdicion &&
                            busquedaHabilitada
                          ) {
                            buscarPersonaPorDoc(valorDocumento);
                          }
                        }}
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroDocumento")}
                  {personaEncontrada && (
                    <small className="text-green-600">
                      ✓ Persona encontrada - datos autocompletados
                    </small>
                  )}
                  {!personaEncontrada && watch("numeroDocumento") && (
                    <small className="text-orange-600">
                      ⚠ Persona nueva - complete los datos manualmente
                    </small>
                  )}
                </div>
              </div>

              {/* Campo de Nombre de Persona */}
              <div className="formgrid grid mt-3">
                <div className="field col-12">
                  <label
                    htmlFor="nombrePersona"
                    className={`font-bold ${
                      errors.nombrePersona ? "text-red-500" : ""
                    }`}
                  >
                    Nombre Completo
                  </label>
                  <Controller
                    name="nombrePersona"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="nombrePersona"
                        {...field}
                        placeholder="Nombre completo del visitante"
                        className={errors.nombrePersona ? "p-invalid" : ""}
                        maxLength={200}
                        disabled={buscandoPersona}
                        style={{ textTransform: "uppercase" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("nombrePersona")}
                  {datosAutocompletados && (
                    <small className="text-blue-500">
                      ℹ Autocompletado desde registros previos
                    </small>
                  )}
                </div>
              </div>

              {/* Campo de Tipo de Persona */}
              <div className="formgrid grid mt-3">
                <div
                  className="field"
                  style={{ flex: "1 1 30%", minWidth: "200px" }}
                >
                  <label htmlFor="tipoPersonaId" className="font-bold">
                    Tipo de Persona
                  </label>
                  <Controller
                    name="tipoPersonaId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoPersonaId"
                        {...field}
                        value={field.value ? Number(field.value) : ""}
                        options={tiposPersona.map((t) => ({
                          ...t,
                          id: Number(t.id),
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione tipo de persona"
                        className={errors.tipoPersonaId ? "p-invalid" : ""}
                        showClear
                        onChange={(e) => {
                          field.onChange(e.value);

                          // Autocompletar imprimeTicketIng desde TipoPersona
                          if (e.value) {
                            const tipoPersonaSeleccionado = tiposPersona.find(
                              (tp) => tp.value === e.value
                            );
                            if (
                              tipoPersonaSeleccionado &&
                              tipoPersonaSeleccionado.imprimeTicketIng !==
                                undefined
                            ) {
                              setValue(
                                "imprimeTicketIng",
                                tipoPersonaSeleccionado.imprimeTicketIng
                              );
                            }
                          } else {
                            // Si se limpia el tipo de persona, resetear a false
                            setValue("imprimeTicketIng", false);
                          }
                        }}
                      />
                    )}
                  />
                  {getFormErrorMessage("tipoPersonaId")}
                  {datosAutocompletados && (
                    <small className="text-blue-500">
                      ℹ Autocompletado desde registros previos
                    </small>
                  )}
                </div>
                <div
                  className="field"
                  style={{ flex: "1 1 30%", minWidth: "200px" }}
                >
                  <label htmlFor="motivoId" className="font-bold">
                    Motivo de Acceso
                  </label>
                  <Controller
                    name="motivoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="motivoId"
                        {...field}
                        value={field.value ? Number(field.value) : ""}
                        options={motivosAcceso.map((m) => ({
                          ...m,
                          id: Number(m.id),
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione motivo de acceso"
                        className={errors.motivoId ? "p-invalid" : ""}
                        showClear
                      />
                    )}
                  />
                  {getFormErrorMessage("motivoId")}
                  {datosAutocompletados && (
                    <small className="text-blue-500">
                      ℹ Autocompletado desde registros previos
                    </small>
                  )}
                </div>
              </div>

              {/* Campos de Destino */}
              <div className="formgrid grid mt-3">
                <div className="field col-12 md:col-6">
                  <label htmlFor="personaFirmaDestinoVisitaId">
                    Persona Destino (Personal)
                  </label>
                  <Controller
                    name="personaFirmaDestinoVisitaId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="personaFirmaDestinoVisitaId"
                        {...field}
                        value={field.value ? Number(field.value) : ""}
                        options={personalDestino.map((p) => ({
                          ...p,
                          id: Number(p.id),
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione persona del personal"
                        showClear
                        filter
                        filterBy="label"
                      />
                    )}
                  />
                  {getFormErrorMessage("personaFirmaDestinoVisitaId")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="areaDestinoVisitaId">Área de Destino *</label>
                  <Controller
                    name="areaDestinoVisitaId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="areaDestinoVisitaId"
                        {...field}
                        value={field.value ? Number(field.value) : ""}
                        options={areasDestino.map((a) => ({
                          ...a,
                          id: Number(a.id),
                        }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione área de destino"
                        showClear
                        filter
                        filterBy="label"
                      />
                    )}
                  />
                  {getFormErrorMessage("areaDestinoVisitaId")}
                  <small className="text-500">
                    Área física donde se dirige la visita
                  </small>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* PESTAÑA 3: VEHÍCULOS Y EQUIPOS */}
          <TabPanel header="Vehículos y Equipos" leftIcon="pi pi-car">
            <div className="card">
              <h5 className="mb-3">Información de Vehículos y Equipos</h5>

              <div className="formgrid grid">
                <div className="field col-12">
                  <h6 className="text-primary">Vehículos</h6>
                </div>

                {/* Campos de vehículo en una sola línea usando flexbox */}
                <div className="field col-12">
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <div style={{ flex: "1", minWidth: "150px" }}>
                      <label htmlFor="vehiculoNroPlaca" className="block mb-2">
                        🚗 N° Placa{" "}
                        {buscandoVehiculo && (
                          <i className="pi pi-spin pi-spinner ml-2 text-blue-500"></i>
                        )}
                      </label>
                      <Controller
                        name="vehiculoNroPlaca"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            id="vehiculoNroPlaca"
                            {...field}
                            placeholder="Ej: ABC-123"
                            maxLength={10}
                            className="w-full"
                            style={{ textTransform: "uppercase" }}
                            disabled={buscandoVehiculo}
                            onBlur={(e) => {
                              // Ejecutar búsqueda cuando pierda el foco y contenga datos
                              const valorPlaca = e.target.value?.trim();
                              if (valorPlaca && valorPlaca.length >= 3) {
                                buscarVehiculoPorPlacaFunc(valorPlaca);
                              }
                            }}
                          />
                        )}
                      />
                      {getFormErrorMessage("vehiculoNroPlaca")}
                      {vehiculoEncontrado && (
                        <small className="text-green-600">
                          ✓ Vehículo encontrado - datos autocompletados
                        </small>
                      )}
                      {!vehiculoEncontrado &&
                        watch("vehiculoNroPlaca") &&
                        watch("vehiculoNroPlaca").length >= 3 &&
                        !buscandoVehiculo && (
                          <small className="text-orange-600">
                            ⚠ Vehículo nuevo - complete los datos manualmente
                          </small>
                        )}
                      {datosVehiculoAutocompletados && (
                        <small className="text-blue-500">
                          ℹ Autocompletado desde registros previos
                        </small>
                      )}
                    </div>

                    <div style={{ flex: "1", minWidth: "150px" }}>
                      <label htmlFor="vehiculoMarca" className="block mb-2">
                        Marca
                      </label>
                      <Controller
                        name="vehiculoMarca"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            id="vehiculoMarca"
                            {...field}
                            placeholder="Ej: Toyota, Nissan"
                            maxLength={50}
                            className="w-full"
                            style={{ textTransform: "uppercase" }}
                          />
                        )}
                      />
                      {getFormErrorMessage("vehiculoMarca")}
                    </div>

                    <div style={{ flex: "1", minWidth: "150px" }}>
                      <label htmlFor="vehiculoModelo" className="block mb-2">
                        Modelo
                      </label>
                      <Controller
                        name="vehiculoModelo"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            id="vehiculoModelo"
                            {...field}
                            placeholder="Ej: Corolla, Sentra"
                            maxLength={50}
                            className="w-full"
                            style={{ textTransform: "uppercase" }}
                          />
                        )}
                      />
                      {getFormErrorMessage("vehiculoModelo")}
                    </div>

                    <div style={{ flex: "1", minWidth: "150px" }}>
                      <label htmlFor="vehiculoColor" className="block mb-2">
                        Color
                      </label>
                      <Controller
                        name="vehiculoColor"
                        control={control}
                        render={({ field }) => (
                          <InputText
                            id="vehiculoColor"
                            {...field}
                            placeholder="Ej: Blanco, Negro"
                            maxLength={30}
                            className="w-full"
                            style={{ textTransform: "uppercase" }}
                          />
                        )}
                      />
                      {getFormErrorMessage("vehiculoColor")}
                    </div>
                  </div>
                </div>

                <div className="field col-12">
                  <h6 className="text-primary mt-4">Equipos</h6>
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="tipoEquipoId">Tipo de Equipo</label>
                  <Controller
                    name="tipoEquipoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoEquipoId"
                        {...field}
                        options={tiposEquipo}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione tipo de equipo"
                        showClear
                      />
                    )}
                  />
                  {getFormErrorMessage("tipoEquipoId")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="equipoMarca">Marca del Equipo</label>
                  <Controller
                    name="equipoMarca"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="equipoMarca"
                        {...field}
                        placeholder="Ej: Dell, HP, Lenovo"
                        maxLength={50}
                        style={{ textTransform: "uppercase" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("equipoMarca")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="equipoModelo">Modelo del Equipo</label>
                  <Controller
                    name="equipoModelo"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="equipoModelo"
                        {...field}
                        placeholder="Modelo específico"
                        maxLength={50}
                        style={{ textTransform: "uppercase" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("equipoModelo")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="equipoSerie">Serie del Equipo</label>
                  <Controller
                    name="equipoSerie"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="equipoSerie"
                        {...field}
                        placeholder="Número de serie"
                        maxLength={50}
                        style={{ textTransform: "uppercase" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("equipoSerie")}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* PESTAÑA 4: DESTINO Y OBSERVACIONES */}
          <TabPanel
            header="Observaciones e Incidentes"
            leftIcon="pi pi-map-marker"
          >
            <div className="card">
              <div className="formgrid grid">
                <div className="field col-12">
                  <label htmlFor="observaciones">Observaciones</label>
                  <Controller
                    name="observaciones"
                    control={control}
                    render={({ field }) => (
                      <InputTextarea
                        id="observaciones"
                        {...field}
                        placeholder="Observaciones adicionales (opcional)"
                        rows={3}
                        maxLength={500}
                        style={{ textTransform: "uppercase" }}
                      />
                    )}
                  />
                  {getFormErrorMessage("observaciones")}
                </div>

                <div className="field col-12">
                  <Controller
                    name="incidenteResaltante"
                    control={control}
                    render={({ field }) => (
                      <div className="flex align-items-center">
                        <Checkbox
                          id="incidenteResaltante"
                          {...field}
                          checked={field.value}
                        />
                        <label
                          htmlFor="incidenteResaltante"
                          className="ml-2 font-bold"
                        >
                          ¿Hubo algún incidente resaltante?
                        </label>
                      </div>
                    )}
                  />
                </div>

                <div className="field col-12">
                  <label htmlFor="descripcionIncidente">
                    Descripción del Incidente
                  </label>
                  <Controller
                    name="descripcionIncidente"
                    control={control}
                    render={({ field }) => (
                      <InputTextarea
                        id="descripcionIncidente"
                        {...field}
                        placeholder="Describa el incidente si lo hubo"
                        rows={3}
                        maxLength={500}
                      />
                    )}
                  />
                  {getFormErrorMessage("descripcionIncidente")}
                </div>

                <div className="field col-12">
                  <h6 className="text-primary mt-4">
                    Configuración de Impresión
                  </h6>
                </div>

                <div className="field col-12">
                  <Controller
                    name="imprimeTicketIng"
                    control={control}
                    render={({ field }) => (
                      <div className="flex align-items-center">
                        <Checkbox
                          id="imprimeTicketIng"
                          {...field}
                          checked={field.value}
                        />
                        <label
                          htmlFor="imprimeTicketIng"
                          className="ml-2 font-bold"
                        >
                          Imprimir ticket de ingreso
                        </label>
                      </div>
                    )}
                  />
                  {getFormErrorMessage("imprimeTicketIng")}
                  <small className="text-500">
                    Marque si desea generar e imprimir un ticket para este
                    acceso
                  </small>
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="urlImpresionTicket">
                    URL Impresión Ticket
                  </label>
                  <Controller
                    name="urlImpresionTicket"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="urlImpresionTicket"
                        {...field}
                        placeholder="URL para impresión del ticket"
                      />
                    )}
                  />
                  {getFormErrorMessage("urlImpresionTicket")}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* PESTAÑA 5: DOCUMENTOS ADJUNTOS */}
          <TabPanel header="Documentos Adjuntos" leftIcon="pi pi-file-pdf">
            <div className="card">
              <h5 className="mb-3">Documentos del Visitante</h5>

              <div className="formgrid grid">
                <div className="field col-12">
                  <label htmlFor="urlDocumentoVisitante">
                    URL Documento Visitante
                  </label>
                  <div className="p-inputgroup">
                    <Controller
                      name="urlDocumentoVisitante"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          id="urlDocumentoVisitante"
                          {...field}
                          placeholder="URL del documento del visitante"
                          readOnly
                        />
                      )}
                    />
                    <Button
                      type="button"
                      icon="pi pi-camera"
                      className="p-button-success"
                      onClick={() => setModalDocumentoVisible(true)}
                      tooltip="Capturar fotos del documento"
                      disabled={
                        !watch("numeroDocumento") || !watch("nombrePersona")
                      }
                    />
                  </div>
                  {getFormErrorMessage("urlDocumentoVisitante")}
                  <small className="text-500">
                    Capture fotos del documento para generar PDF automáticamente
                  </small>
                </div>

                {/* Visor de PDF */}
                {watch("urlDocumentoVisitante") && (
                  <div className="field col-12">
                    <h6 className="text-primary mb-3">
                      Vista Previa del Documento
                    </h6>
                    <div
                      className="border-round p-3"
                      style={{ backgroundColor: "#f8f9fa" }}
                    >
                      <PDFViewer
                        urlDocumento={watch("urlDocumentoVisitante")}
                      />

                      {/* Botones de acción para el PDF */}
                      <div className="flex justify-content-between align-items-center mt-3">
                        <div className="flex align-items-center">
                          <i className="pi pi-file-pdf text-red-500 mr-2"></i>
                          <span className="text-sm text-600">
                            Documento PDF generado automáticamente
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                          }}
                        >
                          <Button
                            type="button"
                            label="Abrir"
                            icon="pi pi-external-link"
                            className="p-button-outlined p-button-sm"
                            onClick={async () => {
                              try {
                                const urlDocumento = watch(
                                  "urlDocumentoVisitante"
                                );
                                // Usar la misma lógica que PDFViewer para construir URL
                                let urlCompleta;
                                if (
                                  urlDocumento.startsWith(
                                    "/uploads/documentos-visitantes/"
                                  )
                                ) {
                                  const rutaArchivo = urlDocumento.replace(
                                    "/uploads/documentos-visitantes/",
                                    ""
                                  );
                                  urlCompleta = `${
                                    import.meta.env.VITE_API_URL
                                  }/documentos-visitantes/archivo/${rutaArchivo}`;
                                } else if (urlDocumento.startsWith("/api/")) {
                                  const rutaSinApi = urlDocumento.substring(4);
                                  urlCompleta = `${
                                    import.meta.env.VITE_API_URL
                                  }${rutaSinApi}`;
                                } else if (urlDocumento.startsWith("/")) {
                                  urlCompleta = `${
                                    import.meta.env.VITE_API_URL
                                  }${urlDocumento}`;
                                } else {
                                  urlCompleta = urlDocumento;
                                }
                                // Descargar con JWT y abrir en nueva ventana
                                const token = useAuthStore.getState().token;
                                const response = await fetch(urlCompleta, {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                });
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const blobUrl =
                                    window.URL.createObjectURL(blob);
                                  // Abrir en nueva ventana usando el blob URL
                                  const newWindow = window.open(
                                    blobUrl,
                                    "_blank"
                                  );
                                  // Limpiar el blob URL después de un tiempo para liberar memoria
                                  setTimeout(() => {
                                    window.URL.revokeObjectURL(blobUrl);
                                  }, 10000); // 10 segundos

                                  if (!newWindow) {
                                    toast.current?.show({
                                      severity: "warn",
                                      summary: "Aviso",
                                      detail:
                                        "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
                                    });
                                  }
                                } else {
                                  const errorText = await response.text();
                                  toast.current?.show({
                                    severity: "error",
                                    summary: "Error",
                                    detail: `No se pudo abrir el documento (${response.status})`,
                                  });
                                }
                              } catch (error) {
                                toast.current?.show({
                                  severity: "error",
                                  summary: "Error",
                                  detail: `Error al abrir el documento: ${error.message}`,
                                });
                              }
                            }}
                          />
                          <Button
                            type="button"
                            label="Descargar"
                            icon="pi pi-download"
                            className="p-button-outlined p-button-sm"
                            onClick={async () => {
                              try {
                                const urlDocumento = watch(
                                  "urlDocumentoVisitante"
                                );

                                // Usar la misma lógica que PDFViewer para construir URL
                                let urlCompleta;
                                if (
                                  urlDocumento.startsWith(
                                    "/uploads/documentos-visitantes/"
                                  )
                                ) {
                                  const rutaArchivo = urlDocumento.replace(
                                    "/uploads/documentos-visitantes/",
                                    ""
                                  );
                                  urlCompleta = `${
                                    import.meta.env.VITE_API_URL
                                  }/documentos-visitantes/archivo/${rutaArchivo}`;
                                } else if (urlDocumento.startsWith("/api/")) {
                                  const rutaSinApi = urlDocumento.substring(4);
                                  urlCompleta = `${
                                    import.meta.env.VITE_API_URL
                                  }${rutaSinApi}`;
                                } else if (urlDocumento.startsWith("/")) {
                                  urlCompleta = `${
                                    import.meta.env.VITE_API_URL
                                  }${urlDocumento}`;
                                } else {
                                  urlCompleta = urlDocumento;
                                }

                                const token = useAuthStore.getState().token;
                                const response = await fetch(urlCompleta, {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                });

                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `documento-visitante-${
                                    watch("numeroDocumento") || "sin-documento"
                                  }.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } else {
                                  toast.current?.show({
                                    severity: "error",
                                    summary: "Error",
                                    detail: "No se pudo descargar el documento",
                                  });
                                }
                              } catch (error) {
                                toast.current?.show({
                                  severity: "error",
                                  summary: "Error",
                                  detail: "Error al descargar el documento",
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabPanel>
        </TabView>

        {/* INFORMACIÓN DEL FLUJO ESPECIAL */}
        {!modoEdicion && (
          <div className="col-12 mt-3">
            <Message
              severity="info"
              text="Al guardar este registro se creará automáticamente un detalle de 'Entrada' en el sistema."
              className="w-full"
            />
          </div>
        )}

        {/* Botones del formulario - ButtonGroup Responsive */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          {/* Grupo de botones principales */}
          <ButtonGroup>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-danger p-button-outlined"
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
              style={{ minWidth: "120px" }}
            />
          </ButtonGroup>
          
          {/* Grupo de botones secundarios (solo en modo edición) */}
          {modoEdicion && (
            <ButtonGroup>
              <Button
                label="Salida"
                icon="pi pi-sign-out"
                className="p-button-warning"
                type="button"
                onClick={() => {
                  // TODO: Implementar lógica de salida
                  toast.current?.show({
                    severity: "info",
                    summary: "Funcionalidad pendiente",
                    detail:
                      "La lógica de salida se implementará en el siguiente paso",
                  });
                }}
                disabled={loading}
                style={{ minWidth: "120px" }}
              />
              
              {/* Botón Ticket - Solo si imprimeTicketIng está marcado */}
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
      </form>

      {/* Modal para captura de documentos */}
      <DocumentoVisitanteCapture
        visible={modalDocumentoVisible}
        onHide={() => setModalDocumentoVisible(false)}
        onDocumentoSubido={handleDocumentoSubido}
        numeroDocumento={watch("numeroDocumento")}
        nombrePersona={watch("nombrePersona")}
      />
    </div>
  );
}
