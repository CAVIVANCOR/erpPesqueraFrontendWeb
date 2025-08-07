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

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import { Card } from "primereact/card";

import {
  crearEntidadComercial,
  actualizarEntidadComercial,
} from "../../api/entidadComercial";
import { getEmpresas } from "../../api/empresa";
import { getTiposDocIdentidad } from "../../api/tiposDocIdentidad";
import { getTiposEntidad } from "../../api/tipoEntidad";
import { getFormasPago } from "../../api/formaPago";
import { getAgrupacionesEntidad } from "../../api/agrupacionEntidad";
import { getVendedores } from "../../api/vendedor";
import { getAgenciasEnvio } from "../../api/agenciaEnvio";

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
  const [contactos, setContactos] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [lineasCredito, setLineasCredito] = useState([]);

  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposEntidad, setTiposEntidad] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [agrupaciones, setAgrupaciones] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [agenciasEnvio, setAgenciasEnvio] = useState([]);

  const toast = useRef(null);
  const esEdicion = !!entidadComercial;

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
    cargarCatalogos();
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

      // Cargar datos relacionados (si existen en la entidad)
      setContactos(entidadComercial.contactos || []);
      setDirecciones(entidadComercial.direcciones || []);
      setPrecios(entidadComercial.precios || []);
      setVehiculos(entidadComercial.vehiculos || []);
      setLineasCredito(entidadComercial.lineasCredito || []);

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

    // Manejar dirección fiscal automática de SUNAT (código legacy - mantener por compatibilidad)
    if (datos.direccionFiscalAutomatica) {
      console.log(
        "Dirección fiscal automática recibida:",
        datos.direccionFiscalAutomatica
      );

      // Agregar la dirección fiscal a las direcciones existentes
      // Si ya existe una dirección fiscal, la reemplazamos
      const direccionesSinFiscal = direcciones.filter((dir) => !dir.fiscal);
      const nuevasDirecciones = [
        ...direccionesSinFiscal,
        datos.direccionFiscalAutomatica,
      ];

      setDirecciones(nuevasDirecciones);

      // Mostrar notificación al usuario
      toast.current?.show({
        severity: "info",
        summary: "Dirección Fiscal",
        detail: "Dirección fiscal agregada automáticamente desde datos SUNAT",
        life: 4000,
      });
    }
  };

  /**
   * Maneja el cambio de datos operativos
   */
  const handleDatosOperativosChange = (datos) => {
    setDatosOperativos(datos);
  };

  /**
   * Maneja el guardado de la entidad comercial
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Consolidar todos los datos
      const entidadCompleta = {
        ...datosGenerales,
        ...datosOperativos,
      };

      // Normalización de datos principales
      const entidadNormalizada = {
        empresaId: Number(entidadCompleta.empresaId),
        tipoDocumentoId: Number(entidadCompleta.tipoDocumentoId),
        tipoEntidadId: Number(entidadCompleta.tipoEntidadId),
        formaPagoId: entidadCompleta.formaPagoId
          ? Number(entidadCompleta.formaPagoId)
          : null,
        agrupacionEntidadId: entidadCompleta.agrupacionEntidadId
          ? Number(entidadCompleta.agrupacionEntidadId)
          : null,
        vendedorId: entidadCompleta.vendedorId
          ? Number(entidadCompleta.vendedorId)
          : null,
        agenciaEnvioId: entidadCompleta.agenciaEnvioId
          ? Number(entidadCompleta.agenciaEnvioId)
          : null,
        numeroDocumento: entidadCompleta.numeroDocumento?.trim().toUpperCase(),
        razonSocial: entidadCompleta.razonSocial?.trim().toUpperCase(),
        nombreComercial:
          entidadCompleta.nombreComercial?.trim().toUpperCase() || null,
        codigoErpFinanciero:
          entidadCompleta.codigoErpFinanciero?.trim().toUpperCase() || null,
        observaciones:
          entidadCompleta.observaciones?.trim().toUpperCase() || null,
        esCliente: Boolean(entidadCompleta.esCliente),
        esProveedor: Boolean(entidadCompleta.esProveedor),
        esCorporativo: Boolean(entidadCompleta.esCorporativo),
        estado: Boolean(entidadCompleta.estado),
        estadoActivoSUNAT: Boolean(entidadCompleta.estadoActivoSUNAT),
        condicionHabidoSUNAT: Boolean(entidadCompleta.condicionHabidoSUNAT),
        esAgenteRetencion: Boolean(entidadCompleta.esAgenteRetencion),
        custodiaStock: Boolean(entidadCompleta.custodiaStock),
        controlLote: Boolean(entidadCompleta.controlLote),
        controlFechaVenc: Boolean(entidadCompleta.controlFechaVenc),
        controlFechaProd: Boolean(entidadCompleta.controlFechaProd),
        controlFechaIngreso: Boolean(entidadCompleta.controlFechaIngreso),
        controlSerie: Boolean(entidadCompleta.controlSerie),
        controlEnvase: Boolean(entidadCompleta.controlEnvase),
        sujetoRetencion: Boolean(entidadCompleta.sujetoRetencion),
        sujetoPercepcion: Boolean(entidadCompleta.sujetoPercepcion),
      };

      // Solo agregar relaciones si tienen datos válidos
      if (contactos && contactos.length > 0) {
        entidadNormalizada.contactos = {
          create: contactos.map((contacto) => ({
            tipoContactoId: Number(contacto.tipoContactoId),
            nombres: contacto.nombres?.trim().toUpperCase(),
            apellidos: contacto.apellidos?.trim().toUpperCase(),
            cargo: contacto.cargo?.trim().toUpperCase() || null,
            telefono: contacto.telefono?.trim().toUpperCase() || null,
            email: contacto.email?.trim().toLowerCase() || null,
            esPrincipal: Boolean(contacto.esPrincipal),
            estado: Boolean(contacto.estado),
          })),
        };
      }

      if (precios && precios.length > 0) {
        entidadNormalizada.precios = {
          create: precios.map((precio) => ({
            productoId: Number(precio.productoId),
            tipoListaPrecioId: Number(precio.tipoListaPrecioId),
            precio: Number(precio.precio),
            descuento: precio.descuento ? Number(precio.descuento) : 0,
            fechaInicio: precio.fechaInicio
              ? new Date(precio.fechaInicio)
              : null,
            fechaFin: precio.fechaFin ? new Date(precio.fechaFin) : null,
            cantidadMinima: precio.cantidadMinima
              ? Number(precio.cantidadMinima)
              : null,
            estado: Boolean(precio.estado),
          })),
        };
      }

      if (vehiculos && vehiculos.length > 0) {
        entidadNormalizada.vehiculos = {
          create: vehiculos.map((vehiculo) => ({
            tipoVehiculoId: Number(vehiculo.tipoVehiculoId),
            placa: vehiculo.placa?.trim().toUpperCase(),
            marca: vehiculo.marca?.trim().toUpperCase(),
            modelo: vehiculo.modelo?.trim().toUpperCase(),
            color: vehiculo.color?.trim().toUpperCase(),
            anio: Number(vehiculo.anio),
            numeroMotor: vehiculo.numeroMotor?.trim().toUpperCase() || null,
            numeroChasis: vehiculo.numeroChasis?.trim().toUpperCase() || null,
            capacidadCarga: vehiculo.capacidadCarga
              ? Number(vehiculo.capacidadCarga)
              : null,
            esPrincipal: Boolean(vehiculo.esPrincipal),
            estado: Boolean(vehiculo.estado),
          })),
        };
      }

      if (lineasCredito && lineasCredito.length > 0) {
        entidadNormalizada.lineasCredito = {
          create: lineasCredito.map((lineaCredito) => ({
            tipoCreditoId: Number(lineaCredito.tipoCreditoId),
            monto: Number(lineaCredito.monto),
            plazo: Number(lineaCredito.plazo),
            tasaInteres: Number(lineaCredito.tasaInteres),
            estado: Boolean(lineaCredito.estado),
          })),
        };
      }

      let resultado;
      if (esEdicion) {
        resultado = await actualizarEntidadComercial(
          entidadComercial.id,
          entidadNormalizada
        );
      } else {
        // Solo en modo creación procesamos algunas relaciones básicas si las hay
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

  /**
   * Valida si se puede navegar a la siguiente pestaña
   */
  const puedeNavegar = () => {
    // Validar que al menos los datos básicos estén completos
    return (
      datosGenerales.empresaId &&
      datosGenerales.tipoDocumentoId &&
      datosGenerales.tipoEntidadId &&
      datosGenerales.numeroDocumento &&
      datosGenerales.razonSocial
    );
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
                onClick={() => setActiveCard("datos-generales")}
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
                onClick={() => setActiveCard("datos-operativos")}
                type="button"
                disabled={!puedeNavegar()}
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
                onClick={() => setActiveCard("direcciones")}
                type="button"
                disabled={!puedeNavegar()}
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
                onClick={() => setActiveCard("contactos")}
                type="button"
                disabled={!puedeNavegar()}
              />

              <Button
                icon="pi pi-dollar"
                tooltip="Precios - Lista de precios especiales"
                tooltipOptions={{ position: "bottom" }}
                className={
                  activeCard === "precios"
                    ? "p-button-help"
                    : "p-button-outlined"
                }
                onClick={() => setActiveCard("precios")}
                type="button"
                disabled={!puedeNavegar()}
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
                onClick={() => setActiveCard("vehiculos")}
                type="button"
                disabled={!puedeNavegar()}
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
                onClick={() => setActiveCard("lineas-credito")}
                type="button"
                disabled={!puedeNavegar()}
              />
            </ButtonGroup>
          }
        />
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
            esEdicion={esEdicion}
            entidadComercialId={entidadComercial?.id}
            datosGenerales={datosGenerales}
            onDatosGeneralesChange={handleDatosGeneralesChange}
            setValue={setValue}
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
            agenciasEnvio={agenciasEnvio}
          />
        )}

        {activeCard === "contactos" && (
          <DetalleContactosEntidad
            entidadComercialId={entidadComercial?.id}
            contactos={contactos}
            onContactosChange={setContactos}
            tiposContacto={[]} // Se cargarán desde el componente
          />
        )}

        {activeCard === "direcciones" && (
          <DetalleDireccionesEntidad
            entidadComercialId={entidadComercial?.id}
            direcciones={direcciones}
            onDireccionesChange={setDirecciones}
            tiposDireccion={[]} // Se cargarán desde el componente
          />
        )}

        {activeCard === "precios" && (
          <DetallePreciosEntidad
            entidadComercialId={entidadComercial?.id}
            precios={precios}
            onPreciosChange={setPrecios}
            productos={[]} // Se cargarán desde el componente
            monedas={[]} // Se cargarán desde el componente
          />
        )}

        {activeCard === "vehiculos" && (
          <DetalleVehiculosEntidad
            entidadComercialId={entidadComercial?.id}
            vehiculos={vehiculos}
            onVehiculosChange={setVehiculos}
            tiposVehiculo={[]} // Se cargarán desde el componente
          />
        )}

        {activeCard === "lineas-credito" && (
          <DetalleLineasCreditoEntidad
            entidadComercialId={entidadComercial?.id}
            lineasCredito={lineasCredito}
            onLineasCreditoChange={setLineasCredito}
            monedas={[]} // Se cargarán desde el componente
          />
        )}

        {/* Botones de acción */}
        <div className="flex justify-content-end mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancelar}
            disabled={loading}
          />
          <Button
            label={esEdicion ? "Actualizar" : "Crear"}
            icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
            className="p-button-success"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!puedeNavegar()}
          />
        </div>
      </form>

      {/* Indicador de progreso */}
      <div className="mt-4">
        <div className="flex justify-content-between align-items-center text-sm text-500">
          <span>
            Paso{" "}
            {activeCard === "datos-generales"
              ? 1
              : activeCard === "datos-operativos"
              ? 2
              : activeCard === "contactos"
              ? 3
              : activeCard === "direcciones"
              ? 4
              : activeCard === "precios"
              ? 5
              : activeCard === "vehiculos"
              ? 6
              : 7}{" "}
            de 7
          </span>
          <span>
            {!puedeNavegar() && activeCard !== "datos-generales" && (
              <i className="pi pi-exclamation-triangle text-orange-500 mr-1"></i>
            )}
            {puedeNavegar()
              ? "Datos básicos completos"
              : "Complete los datos generales"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((activeCard === "datos-generales"
                  ? 1
                  : activeCard === "datos-operativos"
                  ? 2
                  : activeCard === "contactos"
                  ? 3
                  : activeCard === "direcciones"
                  ? 4
                  : activeCard === "precios"
                  ? 5
                  : activeCard === "vehiculos"
                  ? 6
                  : 7) /
                  7) *
                100
              }%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default EntidadComercialForm;
