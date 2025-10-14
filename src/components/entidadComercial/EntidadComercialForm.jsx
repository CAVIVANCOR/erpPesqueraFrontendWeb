/**
 * EntidadComercialForm.jsx
 *
 * Formulario modular para crear y editar entidades comerciales.
 * Implementa React Hook Form con validaciones Yup y navegación por Cards modulares.
 * Sigue el patrón profesional ERP Megui con componentes reutilizables.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import { Tag } from "primereact/tag";

import {
  getEntidadesComerciales,
  getEntidadComercialPorId,
  crearEntidadComercial,
  actualizarEntidadComercial,
  getAgenciasEnvio,
} from "../../api/entidadComercial";
import {
  crearDireccionEntidad,
  obtenerDireccionFiscalPorEntidad,
  actualizarDireccionEntidad,
} from "../../api/direccionEntidad";
import { getEmpresas } from "../../api/empresa";
import { getTiposDocIdentidad } from "../../api/tiposDocIdentidad";
import { getTiposEntidad } from "../../api/tipoEntidad";
import { getFormasPago } from "../../api/formaPago";
import { getAgrupacionesEntidad } from "../../api/agrupacionEntidad";
import { getVendedoresPorEmpresa } from "../../api/personal";

// Importar componentes de cards
import DatosGeneralesEntidad from "./DatosGeneralesEntidad";
import DatosOperativosEntidad from "./DatosOperativosEntidad";
import DetalleContactosEntidad from "./DetalleContactosEntidad";
import DetalleDireccionesEntidad from "./DetalleDireccionesEntidad";
import DetalleVehiculosEntidad from "./DetalleVehiculosEntidad";
import DetallePreciosEntidad from "./DetallePreciosEntidad";
import DetalleLineasCreditoEntidad from "./DetalleLineasCreditoEntidad";

// Esquema de validación básico para EntidadComercial
const validationSchema = yup.object().shape({
  // Solo validaciones básicas requeridas para el guardado principal
  empresaId: yup.number().required("La empresa es requerida"),
  tipoDocumentoId: yup.number().required("El tipo de documento es requerido"),
  tipoEntidadId: yup.number().required("El tipo de entidad es requerido"),
  formaPagoId: yup.number().required("La forma de pago es requerida"),
  numeroDocumento: yup
    .string()
    .required("El número de documento es requerido")
    .max(20, "Máximo 20 caracteres"),
  razonSocial: yup
    .string()
    .required("La razón social es requerida")
    .max(255, "Máximo 255 caracteres"),
  nombreComercial: yup.string().max(255, "Máximo 255 caracteres"),
  agrupacionEntidadId: yup.number(),
  esCliente: yup.boolean(),
  esProveedor: yup.boolean(),
  esCorporativo: yup.boolean(),
  estado: yup.boolean(),
  estadoActivoSUNAT: yup.boolean(),
  condicionHabidoSUNAT: yup.boolean(),
  esAgenteRetencion: yup.boolean(),
  codigoErpFinanciero: yup.string().max(255, "Máximo 255 caracteres"),
  sujetoRetencion: yup.boolean(),
  sujetoPercepcion: yup.boolean(),
});

const EntidadComercialForm = ({ entidadComercial, onGuardar, onCancelar }) => {
  // Estados del componente
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [datosGenerales, setDatosGenerales] = useState({});
  const [datosOperativos, setDatosOperativos] = useState({});

  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposEntidad, setTiposEntidad] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [agrupaciones, setAgrupaciones] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [agenciasEnvio, setAgenciasEnvio] = useState([]);

  const toast = useRef(null);
  const direccionesRef = useRef(null);
  const contactosRef = useRef(null);
  const vehiculosRef = useRef(null);
  const lineasCreditoRef = useRef(null);
  const preciosRef = useRef(null);
  const esEdicion = !!(entidadComercial && entidadComercial.id);

  // Configuración del formulario principal (solo para datos básicos)
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      empresaId: null,
      tipoDocumentoId: null,
      tipoEntidadId: null,
      formaPagoId: null,
      vendedorId: null,
      agenciaEnvioId: null,
      agrupacionEntidadId: null,
      numeroDocumento: "",
      razonSocial: "",
      nombreComercial: "", // Cambiar de null a ""
      codigoErpFinanciero: "", // Cambiar de null a ""
      observaciones: "", // Cambiar de null a ""
      esCliente: false,
      esProveedor: false,
      esCorporativo: false,
      estado: true,
      estadoActivoSUNAT: false,
      condicionHabidoSUNAT: false,
      esAgenteRetencion: false,
      sujetoRetencion: false,
      sujetoPercepcion: false,
      custodiaStock: false,
      controlLote: false,
      controlFechaVenc: false,
      controlFechaProd: false,
      controlFechaIngreso: false,
      controlSerie: false,
      controlEnvase: false,
    },
  });

  /**
   * Carga todos los catálogos necesarios para el formulario
   */
  const cargarCatalogos = async () => {
    try {
      const [
        empresasData,
        tiposDocData,
        tiposEntData,
        formasPagoData,
        agrupacionesData,
      ] = await Promise.all([
        getEmpresas(),
        getTiposDocIdentidad(),
        getTiposEntidad(),
        getFormasPago(),
        getAgrupacionesEntidad(),
      ]);
      setEmpresas(empresasData || []);
      setTiposDocumento(tiposDocData || []);
      setTiposEntidad(tiposEntData || []);
      setFormasPago(formasPagoData || []);
      setAgrupaciones(agrupacionesData || []);
    } catch (error) {
      console.error(" Error al cargar catálogos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los catálogos necesarios",
        life: 3000,
      });
    }
  };

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar catálogos básicos
        await cargarCatalogos();
        
        // Cargar agencias de envío
        const agencias = await getAgenciasEnvio();
        setAgenciasEnvio(agencias || []);
        
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los datos iniciales',
          life: 3000,
        });
      }
    };
    
    cargarDatosIniciales();
  }, []);

  // Cargar datos si es edición
  useEffect(() => {
    if (entidadComercial) {
      // Cargar datos generales
      const generales = {
        empresaId: entidadComercial.empresaId,
        tipoDocumentoId: entidadComercial.tipoDocumentoId,
        numeroDocumento: entidadComercial.numeroDocumento,
        tipoEntidadId: entidadComercial.tipoEntidadId,
        formaPagoId: entidadComercial.formaPagoId,
        razonSocial: entidadComercial.razonSocial,
        nombreComercial: entidadComercial.nombreComercial,
        agrupacionEntidadId: entidadComercial.agrupacionEntidadId,
        esCliente: entidadComercial.esCliente,
        esProveedor: entidadComercial.esProveedor,
        esCorporativo: entidadComercial.esCorporativo,
        estado: entidadComercial.estado,
        estadoActivoSUNAT: entidadComercial.estadoActivoSUNAT,
        condicionHabidoSUNAT: entidadComercial.condicionHabidoSUNAT,
        esAgenteRetencion: entidadComercial.esAgenteRetencion,
        codigoErpFinanciero: entidadComercial.codigoErpFinanciero,
        sujetoRetencion: entidadComercial.sujetoRetencion,
        sujetoPercepcion: entidadComercial.sujetoPercepcion,
      };
      setDatosGenerales(generales);

      // Cargar datos operativos
      const operativos = {
        vendedorId: entidadComercial.vendedorId,
        agenciaEnvioId: entidadComercial.agenciaEnvioId,
        observaciones: entidadComercial.observaciones,
        custodiaStock: entidadComercial.custodiaStock,
        controlLote: entidadComercial.controlLote,
        controlFechaVenc: entidadComercial.controlFechaVenc,
        controlFechaProd: entidadComercial.controlFechaProd,
        controlFechaIngreso: entidadComercial.controlFechaIngreso,
        controlSerie: entidadComercial.controlSerie,
        controlEnvase: entidadComercial.controlEnvase,
      };
      setDatosOperativos(operativos);

      // Cargar vendedores filtrados por empresa en modo edición
      if (entidadComercial.empresaId) {
        getVendedoresPorEmpresa(Number(entidadComercial.empresaId))
          .then((vendedoresData) => {
            setVendedores(vendedoresData || []);
          })
          .catch((error) => {
            console.error("Error al cargar vendedores en modo edición:", error);
            setVendedores([]);
          });
      }

      // IMPORTANTE: Convertir a números para que coincidan con las opciones
      setValue("empresaId", Number(entidadComercial.empresaId));
      setValue("tipoDocumentoId", Number(entidadComercial.tipoDocumentoId));
      setValue("tipoEntidadId", Number(entidadComercial.tipoEntidadId));
      setValue(
        "formaPagoId",
        entidadComercial.formaPagoId
          ? Number(entidadComercial.formaPagoId)
          : null
      );
      setValue(
        "vendedorId",
        entidadComercial.vendedorId ? Number(entidadComercial.vendedorId) : null
      );
      setValue(
        "agenciaEnvioId",
        entidadComercial.agenciaEnvioId
          ? Number(entidadComercial.agenciaEnvioId)
          : null
      );
      setValue(
        "agrupacionEntidadId",
        entidadComercial.agrupacionEntidadId
          ? Number(entidadComercial.agrupacionEntidadId)
          : null
      );
      setValue("numeroDocumento", entidadComercial.numeroDocumento || "");
      setValue("razonSocial", entidadComercial.razonSocial || "");
      setValue("nombreComercial", entidadComercial.nombreComercial || "");
      setValue(
        "codigoErpFinanciero",
        entidadComercial.codigoErpFinanciero || ""
      );
      setValue("observaciones", entidadComercial.observaciones || "");
      setValue("esCliente", entidadComercial.esCliente);
      setValue("esProveedor", entidadComercial.esProveedor);
      setValue("esCorporativo", entidadComercial.esCorporativo);
      setValue("estado", entidadComercial.estado);
      setValue("estadoActivoSUNAT", entidadComercial.estadoActivoSUNAT);
      setValue("condicionHabidoSUNAT", entidadComercial.condicionHabidoSUNAT);
      setValue("esAgenteRetencion", entidadComercial.esAgenteRetencion);
      setValue("sujetoRetencion", entidadComercial.sujetoRetencion);
      setValue("sujetoPercepcion", entidadComercial.sujetoPercepcion);
      setValue("custodiaStock", entidadComercial.custodiaStock);
      setValue("controlLote", entidadComercial.controlLote);
      setValue("controlFechaVenc", entidadComercial.controlFechaVenc);
      setValue("controlFechaProd", entidadComercial.controlFechaProd);
      setValue("controlFechaIngreso", entidadComercial.controlFechaIngreso);
      setValue("controlSerie", entidadComercial.controlSerie);
      setValue("controlEnvase", entidadComercial.controlEnvase);
    }
  }, [entidadComercial, setValue]);

  /**
   * Maneja el cambio de datos generales
   */
  const handleDatosGeneralesChange = async (datos) => {
    setDatosGenerales(datos);

    // Actualizar campos principales del formulario
    setValue("empresaId", datos.empresaId);
    setValue("tipoDocumentoId", datos.tipoDocumentoId);
    setValue("tipoEntidadId", datos.tipoEntidadId);
    setValue("numeroDocumento", datos.numeroDocumento);
    setValue("razonSocial", datos.razonSocial);
    setValue("nombreComercial", datos.nombreComercial);
    setValue("formaPagoId", datos.formaPagoId);
    setValue("agrupacionEntidadId", datos.agrupacionEntidadId);
    setValue("esCliente", datos.esCliente);
    setValue("esProveedor", datos.esProveedor);
    setValue("esCorporativo", datos.esCorporativo);
    setValue("estado", datos.estado);
    setValue("codigoErpFinanciero", datos.codigoErpFinanciero);
    setValue("sujetoRetencion", datos.sujetoRetencion);
    setValue("sujetoPercepcion", datos.sujetoPercepcion);
    setValue("estadoActivoSUNAT", datos.estadoActivoSUNAT);
    setValue("condicionHabidoSUNAT", datos.condicionHabidoSUNAT);
    setValue("esAgenteRetencion", datos.esAgenteRetencion);

    // Manejar dirección fiscal automática de SUNAT
    if (datos.direccionFiscalAutomatica) {
      try {
        // Buscar si existe una dirección fiscal para la entidad comercial
        const direccionFiscalExistente = await obtenerDireccionFiscalPorEntidad(
          Number(entidadComercial.id)
        );

        if (direccionFiscalExistente) {
          // Actualizar la dirección fiscal existente
          const resultadoActualizacion = await actualizarDireccionEntidad(
            direccionFiscalExistente.id,
            datos.direccionFiscalAutomatica
          );
        } else {
          const datosNuevaDireccion = {
            ...datos.direccionFiscalAutomatica,
            entidadComercialId: Number(entidadComercial.id),
          };

          // Crear la dirección fiscal directamente en la base de datos
          const resultadoCreacion = await crearDireccionEntidad(
            datosNuevaDireccion
          );
        }

        // Notificar al componente de direcciones que recargue
        direccionesRef.current?.recargar();

        // Mostrar notificación al usuario
        toast.current?.show({
          severity: "info",
          summary: "Dirección Fiscal",
          detail: "Dirección fiscal agregada automáticamente desde datos SUNAT",
          life: 4000,
        });
      } catch (error) {
        console.error(
          "❌ [FRONTEND] Error al procesar dirección fiscal automática:",
          error
        );
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No se pudo crear la dirección fiscal automáticamente",
          life: 4000,
        });
      }
    }
  };

  /**
   * Maneja el cambio de datos operativos
   */
  const handleDatosOperativosChange = (datos) => {
    setDatosOperativos(datos);
  };

  /**
   * Maneja el cambio de card activo y carga los datos correspondientes
   */
  const handleCardChange = (cardName) => {
    setActiveCard(cardName);

    // No intentamos cargar datos aquí porque los componentes no están montados aún
    // Los datos se cargarán en useEffect después del montaje
  };

  // Efecto para recargar datos cuando cambia el card activo
  useEffect(() => {
    // Cargar datos del componente correspondiente después de que se monte
    switch (activeCard) {
      case "contactos":
        contactosRef.current?.recargar();
        break;
      case "direcciones":
        direccionesRef.current?.recargar();
        break;
      case "precios":
        preciosRef.current?.recargar();
        break;
      case "vehiculos":
        vehiculosRef.current?.recargar();
        break;
      case "lineas-credito":
        lineasCreditoRef.current?.recargar();
        break;
      default:
        // Para datos-generales y datos-operativos no necesitamos cargar datos adicionales
        break;
    }
  }, [activeCard]); // Se ejecuta cada vez que cambia activeCard

  /**
   * Maneja el guardado de la entidad comercial
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos nativos de EntidadComercial únicamente
      const entidadNormalizada = {
        empresaId: Number(data.empresaId),
        tipoDocumentoId: Number(data.tipoDocumentoId),
        tipoEntidadId: Number(data.tipoEntidadId),
        formaPagoId: data.formaPagoId ? Number(data.formaPagoId) : null,
        agrupacionEntidadId: data.agrupacionEntidadId
          ? Number(data.agrupacionEntidadId)
          : null,
        vendedorId: data.vendedorId ? Number(data.vendedorId) : null,
        agenciaEnvioId: data.agenciaEnvioId
          ? Number(data.agenciaEnvioId)
          : null,
        numeroDocumento: data.numeroDocumento?.trim().toUpperCase(),
        razonSocial: data.razonSocial?.trim().toUpperCase(),
        nombreComercial: data.nombreComercial?.trim().toUpperCase() || null,
        codigoErpFinanciero:
          data.codigoErpFinanciero?.trim().toUpperCase() || null,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
        esCliente: Boolean(data.esCliente),
        esProveedor: Boolean(data.esProveedor),
        esCorporativo: Boolean(data.esCorporativo),
        estado: Boolean(data.estado),
        estadoActivoSUNAT: Boolean(data.estadoActivoSUNAT),
        condicionHabidoSUNAT: Boolean(data.condicionHabidoSUNAT),
        esAgenteRetencion: Boolean(data.esAgenteRetencion),
        custodiaStock: Boolean(data.custodiaStock),
        controlLote: Boolean(data.controlLote),
        controlFechaVenc: Boolean(data.controlFechaVenc),
        controlFechaProd: Boolean(data.controlFechaProd),
        controlFechaIngreso: Boolean(data.controlFechaIngreso),
        controlSerie: Boolean(data.controlSerie),
        controlEnvase: Boolean(data.controlEnvase),
        sujetoRetencion: Boolean(data.sujetoRetencion),
        sujetoPercepcion: Boolean(data.sujetoPercepcion),
      };

      let resultado;
      if (esEdicion) {
        resultado = await actualizarEntidadComercial(
          entidadComercial.id,
          entidadNormalizada
        );
      } else {
        resultado = await crearEntidadComercial(entidadNormalizada);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion
          ? "Entidad comercial actualizada correctamente"
          : "Entidad comercial creada correctamente",
        life: 3000,
      });

      onGuardar?.(resultado);
    } catch (error) {
      console.error("Error al guardar entidad comercial:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al guardar la entidad comercial",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !esEdicion) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="entidad-comercial-form">
      <Toast ref={toast} />

      {/* Mostrar Razón Social con Tag de PrimeReact */}
      <div className="flex justify-content-center mb-4">
        <Tag
          value={datosGenerales.razonSocial || "Nueva Entidad Comercial"}
          severity={esEdicion ? "info" : "success"}
          style={{
            fontSize: "1.1rem",
            padding: "0.75rem 1.25rem",
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
          }}
        />
      </div>

      {/* Sistema de navegación con botones de iconos */}
      <Toolbar
        className="mb-4"
        center={
          <ButtonGroup>
            <Button
              icon="pi pi-user"
              tooltip="Datos Generales - Información básica de la entidad"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "datos-generales"
                  ? "p-button-primary"
                  : "p-button-outlined"
              }
              onClick={() => handleCardChange("datos-generales")}
              type="button"
            />
            <Button
              icon="pi pi-cog"
              tooltip="Datos Operativos - Vendedores, agencias y controles"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "datos-operativos"
                  ? "p-button-success"
                  : "p-button-outlined"
              }
              onClick={() => handleCardChange("datos-operativos")}
              type="button"
            />
            <Button
              icon="pi pi-map-marker"
              tooltip="Direcciones - Ubicaciones y direcciones"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "direcciones"
                  ? "p-button-warning"
                  : "p-button-outlined"
              }
              onClick={() => handleCardChange("direcciones")}
              type="button"
            />
            <Button
              icon="pi pi-phone"
              tooltip="Contactos - Personas de contacto de la entidad"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "contactos"
                  ? "p-button-info"
                  : "p-button-outlined"
              }
              onClick={() => handleCardChange("contactos")}
              type="button"
            />

            <Button
              icon="pi pi-dollar"
              tooltip="Precios - Lista de precios especiales"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "precios" ? "p-button-help" : "p-button-outlined"
              }
              onClick={() => handleCardChange("precios")}
              type="button"
            />
            <Button
              icon="pi pi-car"
              tooltip="Vehículos - Flota de vehículos de la entidad"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "vehiculos"
                  ? "p-button-secondary"
                  : "p-button-outlined"
              }
              onClick={() => handleCardChange("vehiculos")}
              type="button"
            />
            <Button
              icon="pi pi-credit-card"
              tooltip="Líneas de Crédito - Líneas de crédito de la entidad"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "lineas-credito"
                  ? "p-button-danger"
                  : "p-button-outlined"
              }
              onClick={() => handleCardChange("lineas-credito")}
              type="button"
            />
          </ButtonGroup>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Contenido de los cards */}
        {activeCard === "datos-generales" && (
          <DatosGeneralesEntidad
            control={control}
            errors={errors}
            empresas={empresas}
            tiposDocumento={tiposDocumento}
            tiposEntidad={tiposEntidad}
            formasPago={formasPago}
            agrupaciones={agrupaciones}
            entidadComercialId={entidadComercial?.id}
            onDatosGeneralesChange={handleDatosGeneralesChange}
            setValue={setValue}
            getValues={getValues}
            toast={toast}
          />
        )}

        {activeCard === "datos-operativos" && (
          <DatosOperativosEntidad
            control={control}
            errors={errors}
            entidadComercialId={entidadComercial?.id}
            datosOperativos={datosOperativos}
            onDatosOperativosChange={handleDatosOperativosChange}
            vendedores={vendedores}
            agenciasEnvio={agenciasEnvio} // Pasar agencias de envío
          />
        )}

        {activeCard === "contactos" && (
          <DetalleContactosEntidad
            entidadComercialId={entidadComercial?.id}
            // contactos={contactos}
            // onContactosChange={setContactos}
            tiposContacto={[]} // Se cargarán desde el componente
            ref={contactosRef}
          />
        )}

        {activeCard === "direcciones" && (
          <DetalleDireccionesEntidad
            entidadComercialId={entidadComercial?.id}
            ref={direccionesRef}
          />
        )}

        {activeCard === "precios" && (
          <DetallePreciosEntidad
            entidadComercialId={entidadComercial?.id}
            empresaId={entidadComercial?.empresaId}
            // precios={precios}
            // onPreciosChange={setPrecios}
            productos={[]} // Se cargarán desde el componente
            monedas={[]} // Se cargarán desde el componente
            ref={preciosRef}
          />
        )}

        {activeCard === "vehiculos" && (
          <DetalleVehiculosEntidad
            entidadComercialId={entidadComercial?.id}
            entidadComercial={entidadComercial}
            //vehiculos={vehiculos}
            //onVehiculosChange={setVehiculos}
            tiposVehiculo={[]} // Se cargarán desde el componente
            ref={vehiculosRef}
          />
        )}

        {activeCard === "lineas-credito" && (
          <DetalleLineasCreditoEntidad
            entidadComercialId={entidadComercial?.id}
            // lineasCredito={lineasCredito}
            // onLineasCreditoChange={setLineasCredito}
            monedas={[]} // Se cargarán desde el componente
            ref={lineasCreditoRef}
          />
        )}
        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
            marginTop: 10,
          }}
        >
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancelar}
            disabled={loading}
            raised
            size="small"
            outlined
          />
          <Button
            type="button"
            label={esEdicion ? "Actualizar" : "Crear"}
            icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
            className="p-button-success"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            raised
            size="small"
            outlined
          />
        </div>
      </form>
    </div>
  );
};

export default EntidadComercialForm;
