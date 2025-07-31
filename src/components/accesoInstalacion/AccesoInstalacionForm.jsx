// src/components/accesoInstalacion/AccesoInstalacionForm.jsx
// Formulario profesional para AccesoInstalacion. Cumple la regla transversal ERP Megui.
// FLUJO ESPECIAL: Auto-genera fecha/hora, busca por documento, autocompleta datos y crea detalle automático.
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { TabView, TabPanel } from "primereact/tabview";

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
  obtenerDatosAccesoPrevio,
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

  // Datos de equipo del cliente
  equipoMarca: yup.string().max(50, "Máximo 50 caracteres"),
  equipoSerie: yup.string().max(50, "Máximo 50 caracteres"),

  // Persona destino de la visita
  personaFirmaDestinoVisitaId: yup
    .number()
    .nullable()
    .typeError("Debe seleccionar una persona"),
  nombreDestinoVisita: yup.string().max(255, "Máximo 255 caracteres"),

  // Otros campos
  observaciones: yup.string().max(500, "Máximo 500 caracteres"),
  incidenteResaltante: yup.boolean().required(),
  descripcionIncidente: yup.string().max(500, "Máximo 500 caracteres"),
  imprimeTicketIng: yup.boolean().required(),
  urlImpresionTicket: yup.string().url("URL inválida"),
  urlDocumentoVisitante: yup.string().url("URL inválida"),
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
  console.log("Carga empresaId:", empresaId);
  console.log("Carga sedeId:", sedeId);
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

  // Estados para el flujo de búsqueda
  const [loading, setLoading] = useState(false);
  const [buscandoDocumento, setBuscandoDocumento] = useState(false);
  const [buscandoPersona, setBuscandoPersona] = useState(false); // Estado para spinner de búsqueda
  const [personaEncontrada, setPersonaEncontrada] = useState(null);
  const [datosAutocompletados, setDatosAutocompletados] = useState(false);
  const [busquedaHabilitada, setBusquedaHabilitada] = useState(true); // Búsqueda automática siempre activa

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
      sedeId: sedeId ? Number(sedeId) : null, // Precargar desde estado global
      tipoAccesoId: null,
      fechaHora: new Date(), // Generar automáticamente fecha y hora actual

      // Campos opcionales
      empresaId: empresaId ? Number(empresaId) : null, // Precargar desde estado global
      areaDestinoVisitaId: null,
      vehiculoId: null,
      tipoPersonaId: null,
      motivoId: null,
      tipoEquipoId: null,

      // Datos de la persona
      nombrePersona: "",
      tipoDocIdentidadId: 1, // DNI por defecto (ID 1 suele ser DNI)
      numeroDocumento: "",

      // Datos de vehículo del cliente
      vehiculoNroPlaca: "",
      vehiculoMarca: "",

      // Datos de equipo del cliente
      equipoMarca: "",
      equipoSerie: "",

      // Persona destino de la visita
      personaFirmaDestinoVisitaId: null,
      nombreDestinoVisita: "",

      // Otros campos
      observaciones: "",
      incidenteResaltante: false,
      descripcionIncidente: "",
      imprimeTicketIng: true,
      urlImpresionTicket: "",
      urlDocumentoVisitante: "",
    },
  });

  // Observar cambios en el número de documento para búsqueda automática
  const numeroDocumento = watch("numeroDocumento");

  // Función para buscar persona por documento
  const buscarPersonaPorDoc = async (numDoc) => {
    if (!numDoc || numDoc.length < 8) return;

    setBuscandoPersona(true);
    setPersonaEncontrada(null);
    setDatosAutocompletados(false);

    try {
      console.log("Buscando persona con documento:", numDoc);

      // Intentar buscar la persona por documento
      const personaEncontrada = await buscarPersonaPorDocumento(numDoc);

      if (personaEncontrada) {
        console.log("Persona encontrada:", personaEncontrada);

        // Autocompletar datos encontrados
        setValue(
          "nombrePersona",
          personaEncontrada.nombreCompleto || personaEncontrada.nombres || ""
        );
        setValue(
          "tipoDocIdentidadId",
          personaEncontrada.tipoDocIdentidadId
            ? Number(personaEncontrada.tipoDocIdentidadId)
            : 1
        );

        // Obtener datos de acceso previo si existen
        try {
          const datosAccesoPrevio = await obtenerDatosAccesoPrevio(numDoc);
          if (datosAccesoPrevio) {
            console.log(
              "Datos de acceso previo encontrados:",
              datosAccesoPrevio
            );

            // Autocompletar con datos del último acceso
            if (datosAccesoPrevio.tipoPersonaId) {
              setValue(
                "tipoPersonaId",
                Number(datosAccesoPrevio.tipoPersonaId)
              );
            }
            if (datosAccesoPrevio.empresaId) {
              setValue("empresaId", Number(datosAccesoPrevio.empresaId));
            }
            if (datosAccesoPrevio.motivoId) {
              setValue("motivoId", Number(datosAccesoPrevio.motivoId));
            }
          }
        } catch (error) {
          console.log(
            "No se encontraron datos de acceso previo:",
            error.message
          );
        }

        setPersonaEncontrada(personaEncontrada);
        setDatosAutocompletados(true);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Datos encontrados para: ${
            personaEncontrada.nombreCompleto || personaEncontrada.nombres
          }`,
          life: 3000,
        });
      } else {
        console.log("Persona no encontrada, permitir registro manual");
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
      console.error("Error en búsqueda de persona:", error);
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

  // Efecto para búsqueda automática cuando cambia el número de documento
  useEffect(() => {
    if (
      numeroDocumento &&
      numeroDocumento.length >= 8 &&
      !modoEdicion &&
      busquedaHabilitada
    ) {
      // Debounce la búsqueda para evitar múltiples llamadas
      const timeoutId = setTimeout(() => {
        buscarPersonaPorDoc(numeroDocumento);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [numeroDocumento, modoEdicion, busquedaHabilitada]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (item) {
      // Cargar datos del item para edición según modelo Prisma AccesoInstalacion
      const datosEdicion = {
        // Campos obligatorios
        sedeId: item.sedeId ? Number(item.sedeId) : null,
        tipoAccesoId: item.tipoAccesoId ? Number(item.tipoAccesoId) : null,
        fechaHora: item.fechaHora ? new Date(item.fechaHora) : new Date(),

        // Campos opcionales
        empresaId: item.empresaId ? Number(item.empresaId) : null,
        areaDestinoVisitaId: item.areaDestinoVisitaId
          ? Number(item.areaDestinoVisitaId)
          : null,
        vehiculoId: item.vehiculoId ? Number(item.vehiculoId) : null,
        tipoPersonaId: item.tipoPersonaId ? Number(item.tipoPersonaId) : null,
        motivoId: item.motivoId ? Number(item.motivoId) : null,
        tipoEquipoId: item.tipoEquipoId ? Number(item.tipoEquipoId) : null,

        // Datos de la persona
        nombrePersona: item.nombrePersona || "",
        tipoDocIdentidadId: item.tipoDocIdentidadId
          ? Number(item.tipoDocIdentidadId)
          : null,
        numeroDocumento: item.numeroDocumento || "",

        // Datos de vehículo del cliente
        vehiculoNroPlaca: item.vehiculoNroPlaca || "",
        vehiculoMarca: item.vehiculoMarca || "",

        // Datos de equipo del cliente
        equipoMarca: item.equipoMarca || "",
        equipoSerie: item.equipoSerie || "",

        // Persona destino de la visita
        personaFirmaDestinoVisitaId: item.personaFirmaDestinoVisitaId
          ? Number(item.personaFirmaDestinoVisitaId)
          : null,
        nombreDestinoVisita: item.nombreDestinoVisita || "",

        // Otros campos
        observaciones: item.observaciones || "",
        incidenteResaltante: item.incidenteResaltante || false,
        descripcionIncidente: item.descripcionIncidente || "",
        imprimeTicketIng:
          item.imprimeTicketIng !== undefined ? item.imprimeTicketIng : true,
        urlImpresionTicket: item.urlImpresionTicket || "",
        urlDocumentoVisitante: item.urlDocumentoVisitante || "",
      };

      reset(datosEdicion);
    } else {
      // Para nuevo registro: generar fecha y hora automáticamente
      const fechaHoraActual = new Date();
      console.log(
        "Generando fecha y hora automática para nuevo registro:",
        fechaHoraActual
      );

      // Mantener los valores por defecto pero asegurar fecha/hora actual
      setValue("fechaHora", fechaHoraActual);
    }
  }, [item, setValue, reset]);

  useEffect(() => {
    if (!modoEdicion && numeroDocumento && numeroDocumento.length >= 8) {
      const timer = setTimeout(() => {
        buscarPorDocumento(numeroDocumento);
      }, 800); // Debounce de 800ms
      return () => clearTimeout(timer);
    }
  }, [numeroDocumento, modoEdicion]);

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
    } catch (error) {
      console.error("Error al cargar datos:", error);
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
   * Busca una persona por número de documento y autocompleta datos
   * NOTA: Temporalmente deshabilitado hasta que el backend implemente las APIs
   */
  const buscarPorDocumento = async (documento) => {
    if (buscandoDocumento) return;

    setBuscandoDocumento(true);
    try {
      // TEMPORAL: Simular búsqueda mientras el backend no esté listo
      console.log(`Buscando documento: ${documento}`);

      // Simular delay de búsqueda
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Por ahora, siempre indicar que no se encontró para permitir registro manual
      setPersonaEncontrada(null);
      setDatosAutocompletados(false);

      // Limpiar campos para registro manual
      setValue("nombres", "");
      setValue("apellidos", "");
      setValue("tipoPersonaId", null);

      toast.current?.show({
        severity: "info",
        summary: "Información",
        detail:
          "Función de búsqueda temporalmente deshabilitada. Complete los datos manualmente.",
      });

      // TODO: Implementar cuando el backend esté listo
      /*
      const datosAccesoPrevio = await obtenerDatosAccesoPrevio(documento);
      
      if (datosAccesoPrevio) {
        // Persona encontrada con datos de acceso previo - autocompletar todo
        setPersonaEncontrada(datosAccesoPrevio.persona);
        setDatosAutocompletados(true);
        
        // Autocompletar todos los campos...
      }
      */
    } catch (error) {
      console.error("Error al buscar por documento:", error);

      // No mostrar error, solo permitir registro manual
      setPersonaEncontrada(null);
      setDatosAutocompletados(false);

      toast.current?.show({
        severity: "info",
        summary: "Información",
        detail: "Complete los datos manualmente.",
      });
    } finally {
      setBuscandoDocumento(false);
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
        // Datos de persona (se crean/actualizan automáticamente en backend)
        persona: {
          numeroDocumento: data.numeroDocumento?.trim(),
          nombres: data.nombres?.trim(),
          apellidos: data.apellidos?.trim(),
          tipoPersonaId: data.tipoPersonaId ? Number(data.tipoPersonaId) : null,
        },

        // Datos del acceso principal
        tipoAccesoId: data.tipoAccesoId ? Number(data.tipoAccesoId) : null,
        fechaAcceso: data.fechaAcceso,
        horaAcceso: data.horaAcceso,
        motivoAccesoId: data.motivoAccesoId
          ? Number(data.motivoAccesoId)
          : null,
        areaDestinoVisitaId: data.areaDestinoVisitaId
          ? Number(data.areaDestinoVisitaId)
          : null,

        // Datos opcionales
        vehiculoId: data.vehiculoId ? Number(data.vehiculoId) : null,
        equipoId: data.equipoId ? Number(data.equipoId) : null,
        observaciones: data.observaciones?.trim() || null,
        activo: Boolean(data.activo),

        // Indicador para crear detalle automático (solo para nuevos registros)
        crearDetalleAutomatico: !modoEdicion,

        // Datos para el detalle automático (solo si es nuevo registro)
        ...(!modoEdicion && {
          detalleAutomatico: {
            tipoMovimientoId: 1, // Siempre 1 = "Entrada"
            areaDestinoVisitaId: data.areaDestinoVisitaId
              ? Number(data.areaDestinoVisitaId)
              : null,
            fechaMovimiento: data.fechaAcceso,
            horaMovimiento: data.horaAcceso,
            observaciones: "Registro automático de entrada",
            activo: true,
          },
        }),
      };

      // Log para debugging - mostrar datos que se envían
      console.log(
        "Datos normalizados a enviar:",
        JSON.stringify(datosNormalizados, null, 2)
      );

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
      console.error("Error al enviar formulario:", error);

      // Mostrar información más detallada del error
      let mensajeError = "Error al guardar el registro";

      if (error.response?.status === 400) {
        mensajeError = "Error de validación. Verifique los datos ingresados.";
        console.error("Detalles del error 400:", error.response.data);
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
                      if (!empresaId) return "No hay empresa seleccionada";
                      if (empresas.length === 0) return "Cargando empresa...";
                      const empresa = empresas.find((e) => {
                        const match = Number(e.value) === Number(empresaId);
                        return match;
                      });
                      return (
                        empresa?.label ||
                        `Empresa ID: ${empresaId} (no encontrada en ${empresas.length} empresas)`
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
                      <input type="hidden" {...field} value={empresaId || ""} />
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
                      if (!sedeId) return "No hay sede seleccionada";
                      if (sedes.length === 0) return "Cargando sede...";
                      const sede = sedes.find((s) => {
                        const match = Number(s.value) === Number(sedeId);
                        return match;
                      });
                      return (
                        sede?.label ||
                        `Sede ID: ${sedeId} (no encontrada en ${sedes.length} sedes)`
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
                      <input type="hidden" {...field} value={sedeId || ""} />
                    )}
                  />
                </div>
              </div>
              <h5 className="mb-3 mt-4">2. Identificación del Visitante</h5>
              <div
                className="formgrid grid"
                style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
              >
                <div
                  className="field"
                  style={{ flex: "1 1 30%", minWidth: "200px" }}
                >
                  <label
                    htmlFor="fechaHora"
                    className={`font-bold ${
                      errors.fechaHora ? "text-red-500" : ""
                    }`}
                  >
                    Fecha y Hora *
                  </label>
                  <Controller
                    name="fechaHora"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="fechaHora"
                        {...field}
                        showTime
                        hourFormat="24"
                        dateFormat="dd/mm/yy"
                        placeholder="dd/mm/aaaa hh:mm"
                        className={errors.fechaHora ? "p-invalid" : ""}
                        disabled={!modoEdicion} // Solo editable en modo edición
                        showIcon
                      />
                    )}
                  />
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
                  style={{ flex: "1 1 30%", minWidth: "200px" }}
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
                      />
                    )}
                  />
                  {getFormErrorMessage("numeroDocumento")}
                  {personaEncontrada && (
                    <small className="text-green-600">
                      ✓ Persona encontrada - datos autocompletados
                    </small>
                  )}
                  {!personaEncontrada && numeroDocumento && (
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
            </div>
          </TabPanel>
          {/* PESTAÑA 2: DATOS DE LA PERSONA */}
          <TabPanel header="Datos de la Persona" leftIcon="pi pi-user">
            <div className="card">
              <h5 className="mb-3">Información Personal del Visitante</h5>

              {!busquedaHabilitada && (
                <Message
                  severity="info"
                  text="La búsqueda automática por documento está temporalmente deshabilitada. Complete los datos manualmente."
                  className="mb-3"
                />
              )}

              <div className="formgrid grid">
                <div className="field col-12 md:col-6">
                  <label htmlFor="tipoPersonaId">Tipo de Persona</label>
                  <Controller
                    name="tipoPersonaId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoPersonaId"
                        {...field}
                        options={tiposPersona}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione tipo de persona"
                        showClear
                      />
                    )}
                  />
                  {getFormErrorMessage("tipoPersonaId")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="motivoId">Motivo de Acceso</label>
                  <Controller
                    name="motivoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="motivoId"
                        {...field}
                        options={motivosAcceso}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione motivo de acceso"
                        showClear
                      />
                    )}
                  />
                  {getFormErrorMessage("motivoId")}
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
                <div className="field col-12 md:col-6">
                  <label htmlFor="vehiculoNroPlaca">Placa del Vehículo</label>
                  <Controller
                    name="vehiculoNroPlaca"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="vehiculoNroPlaca"
                        {...field}
                        placeholder="Ej: ABC-123"
                        maxLength={10}
                      />
                    )}
                  />
                  {getFormErrorMessage("vehiculoNroPlaca")}
                  <small className="text-500">
                    Para vehículos no registrados
                  </small>
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="vehiculoMarca">Marca del Vehículo</label>
                  <Controller
                    name="vehiculoMarca"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="vehiculoMarca"
                        {...field}
                        placeholder="Ej: Toyota, Nissan"
                        maxLength={50}
                      />
                    )}
                  />
                  {getFormErrorMessage("vehiculoMarca")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="vehiculoModelo">Modelo del Vehículo</label>
                  <Controller
                    name="vehiculoModelo"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="vehiculoModelo"
                        {...field}
                        placeholder="Ej: Corolla, Sentra"
                        maxLength={50}
                      />
                    )}
                  />
                  {getFormErrorMessage("vehiculoModelo")}
                </div>

                <div className="field col-12 md:col-6">
                  <label htmlFor="vehiculoColor">Color del Vehículo</label>
                  <Controller
                    name="vehiculoColor"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="vehiculoColor"
                        {...field}
                        placeholder="Ej: Blanco, Negro"
                        maxLength={30}
                      />
                    )}
                  />
                  {getFormErrorMessage("vehiculoColor")}
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
            header="Destino y Observaciones"
            leftIcon="pi pi-map-marker"
          >
            <div className="card">
              <h5 className="mb-3">Información de Destino y Observaciones</h5>

              <div className="formgrid grid">
                <div className="field col-12">
                  <h6 className="text-primary">Persona de Contacto</h6>
                </div>

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
                        options={personal}
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
                  <label htmlFor="nombreDestinoVisita">
                    Nombre Destino Visita
                  </label>
                  <Controller
                    name="nombreDestinoVisita"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="nombreDestinoVisita"
                        {...field}
                        placeholder="Nombre de la persona a visitar"
                        maxLength={255}
                      />
                    )}
                  />
                  {getFormErrorMessage("nombreDestinoVisita")}
                  <small className="text-500">
                    Si no está en el personal registrado
                  </small>
                </div>

                <div className="field col-12">
                  <h6 className="text-primary mt-4">
                    Observaciones e Incidentes
                  </h6>
                </div>

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

                <div className="field col-12 md:col-6">
                  <label htmlFor="urlDocumentoVisitante">
                    URL Documento Visitante
                  </label>
                  <Controller
                    name="urlDocumentoVisitante"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="urlDocumentoVisitante"
                        {...field}
                        placeholder="URL del documento del visitante"
                      />
                    )}
                  />
                  {getFormErrorMessage("urlDocumentoVisitante")}
                </div>

                <div className="field col-12">
                  <Controller
                    name="activo"
                    control={control}
                    render={({ field }) => (
                      <div className="flex align-items-center">
                        <Checkbox
                          id="activo"
                          {...field}
                          checked={field.value}
                        />
                        <label htmlFor="activo" className="ml-2 font-bold">
                          Registro Activo
                        </label>
                      </div>
                    )}
                  />
                </div>
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
            className="p-button-text"
            type="button"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            label={modoEdicion ? "Actualizar" : "Registrar Acceso"}
            icon={modoEdicion ? "pi pi-check" : "pi pi-plus"}
            className="p-button-success"
            type="submit"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
}
