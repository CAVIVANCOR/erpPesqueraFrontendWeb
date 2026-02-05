/**
 * DetMovsEntregaRendirVentasForm.jsx
 *
 * Formulario para crear y editar movimientos de entregas a rendir en ventas.
 * Incluye navegación por cards y gestión de PDFs.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import PdfDetMovEntregaRendirVentasCard from "./PdfDetMovEntregaRendirVentasCard";
import PdfComprobanteOperacionDetMovVentasCard from "./PdfComprobanteOperacionDetMovVentasCard";
import { getModulos } from "../../api/moduloSistema";

const DetMovsEntregaRendirVentasForm = ({
  movimiento = null,
  entregaARendirPVentasId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  movimientosAsignacionEntregaRendir = [],
  productos = [], // Nueva prop para productos (gastos)
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();

  // Estados para navegación de cards
  const [cardActiva, setCardActiva] = useState("datos");
  const [modulosVentas, setModulosVentas] = useState(null);

  // Estado para filtro de familia de productos
  const [familiaFiltroId, setFamiliaFiltroId] = useState(null);

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      entregaARendirPVentasId: entregaARendirPVentasId || "",
      responsableId: "",
      fechaMovimiento: new Date(),
      tipoMovimientoId: "",
      centroCostoId: "",
      monto: 0,
      monedaId: "",
      descripcion: "",
      entidadComercialId: "",
      urlComprobanteMovimiento: "",
      validadoTesoreria: false,
      fechaValidacionTesoreria: null,
      operacionSinFactura: false,
      fechaOperacionMovCaja: null,
      operacionMovCajaId: null,
      moduloOrigenMovCajaId: 2,
      urlComprobanteOperacionMovCaja: "",
      tipoDocumentoId: "",
      numeroSerieComprobante: "",
      numeroCorrelativoComprobante: "",
      productoId: "", // Nuevo campo para producto (gasto)
      detalleGastosPlanificados: "",
      asignacionOrigenId: null,
    },
  });

  // Observar cambios
  const operacionSinFactura = watch("operacionSinFactura");
  const validadoTesoreria = watch("validadoTesoreria");
  const urlComprobanteMovimiento = watch("urlComprobanteMovimiento");
  const urlComprobanteOperacionMovCaja = watch(
    "urlComprobanteOperacionMovCaja",
  );

  // Cargar módulo VENTAS
  useEffect(() => {
    const cargarModuloVentas = async () => {
      try {
        const modulos = await getModulos();
        const moduloVenta = modulos.find((m) => m.nombre === "VENTAS");
        if (moduloVenta) {
          setModulosVentas(moduloVenta);
          if (!isEditing) {
            setValue("moduloOrigenMovCajaId", Number(moduloVenta.id));
          }
        }
      } catch (error) {
        console.error("Error al cargar módulo VENTAS:", error);
      }
    };
    cargarModuloVentas();
  }, [setValue, isEditing]);

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && movimiento) {
      reset({
        entregaARendirPVentasId: Number(movimiento.entregaARendirPVentasId),
        responsableId: movimiento.responsableId
          ? Number(movimiento.responsableId)
          : null,
        fechaMovimiento: movimiento.fechaMovimiento
          ? new Date(movimiento.fechaMovimiento)
          : new Date(),
        tipoMovimientoId: movimiento.tipoMovimientoId
          ? Number(movimiento.tipoMovimientoId)
          : null,
        centroCostoId: movimiento.centroCostoId
          ? Number(movimiento.centroCostoId)
          : null,
        monto: Number(movimiento.monto) || 0,
        monedaId: movimiento.monedaId ? Number(movimiento.monedaId) : null,
        descripcion: movimiento.descripcion || "",
        entidadComercialId: movimiento.entidadComercialId
          ? Number(movimiento.entidadComercialId)
          : null,
        urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento || "",
        validadoTesoreria: movimiento.validadoTesoreria || false,
        fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria || null,
        operacionSinFactura: movimiento.operacionSinFactura || false,
        fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja
          ? new Date(movimiento.fechaOperacionMovCaja)
          : null,
        operacionMovCajaId: movimiento.operacionMovCajaId
          ? Number(movimiento.operacionMovCajaId)
          : null,
        moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId
          ? Number(movimiento.moduloOrigenMovCajaId)
          : 2,
        urlComprobanteOperacionMovCaja:
          movimiento.urlComprobanteOperacionMovCaja || "",
        tipoDocumentoId: movimiento.tipoDocumentoId
          ? Number(movimiento.tipoDocumentoId)
          : null,
        numeroSerieComprobante: movimiento.numeroSerieComprobante || "",
        numeroCorrelativoComprobante:
          movimiento.numeroCorrelativoComprobante || "",
        productoId: movimiento.productoId
          ? Number(movimiento.productoId)
          : null, // Nuevo campo
        detalleGastosPlanificados: movimiento.detalleGastosPlanificados || "",
        asignacionOrigenId: movimiento.asignacionOrigenId
          ? Number(movimiento.asignacionOrigenId)
          : null,
      });
    } else {
      setValue("entregaARendirPVentasId", Number(entregaARendirPVentasId));
      setValue("fechaMovimiento", new Date());
      setValue("moduloOrigenMovCajaId", 2);

      if (usuario?.personalId) {
        setValue("responsableId", Number(usuario.personalId));
        setTimeout(() => {
          toast.current?.show({
            severity: "info",
            summary: "Responsable Asignado",
            detail:
              "Se ha asignado automáticamente como responsable del movimiento",
            life: 3000,
          });
        }, 500);
      }
    }
  }, [
    movimiento,
    isEditing,
    entregaARendirPVentasId,
    reset,
    setValue,
    usuario,
  ]);

  // Preparar opciones para dropdowns
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}`,
    value: Number(cc.id),
  }));

  const tipoMovimientoOptions = tiposMovimiento.map((tm) => ({
    label: tm.nombre,
    value: Number(tm.id),
  }));

  const monedaOptions = (monedas || []).map((m) => ({
    label: m.simbolo,
    value: Number(m.id),
  }));

  const entidadComercialOptions = entidadesComerciales.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const tipoDocumentoOptions = tiposDocumento
    .filter((td) => td.esParaCompras === true || td.esParaVentas === true)
    .map((td) => ({
      label:
        td.activo === false ? `${td.descripcion} (INACTIVO)` : td.descripcion,
      value: Number(td.id),
    }));

  // IDs de familias permitidas para gastos
  const familiasGastosIds = [2, 3, 4, 6, 7];

  // Filtrar productos por familias de gastos
  const productosGastos = (productos || []).filter((p) =>
    familiasGastosIds.includes(Number(p.familiaId)),
  );

  // Obtener familias únicas de los productos filtrados usando un Map para evitar duplicados
  const familiasMap = new Map();
  productosGastos.forEach((p) => {
    if (p.familia && p.familia.id && p.familia.nombre) {
      const familiaId = Number(p.familia.id);
      if (
        familiasGastosIds.includes(familiaId) &&
        !familiasMap.has(familiaId)
      ) {
        familiasMap.set(familiaId, {
          label: p.familia.nombre,
          value: familiaId,
        });
      }
    }
  });

  const familiasUnicas = Array.from(familiasMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  // Filtrar productos por familia seleccionada
  const productosFiltrados = familiaFiltroId
    ? productosGastos.filter(
        (p) => Number(p.familiaId) === Number(familiaFiltroId),
      )
    : productosGastos;

  // Opciones de productos para el dropdown
  const productoOptions = productosFiltrados.map((p) => ({
    label: p.descripcionArmada || p.descripcionBase || p.codigo,
    value: Number(p.id),
  }));
  // Crear opciones de asignación origen desde los movimientos de asignación (inicial o adicional) que forman parte del cálculo
  const asignacionOrigenOptions = (
    movimientosAsignacionEntregaRendir || []
  ).map((mov) => ({
    label: `Mov #${mov.id} - ${mov.descripcion || "Sin descripción"} - S/ ${mov.monto}`,
    value: Number(mov.id),
  }));
  // Función para toggle operación sin factura
  const handleToggleOperacionSinFactura = () => {
    const valorActual = getValues("operacionSinFactura");
    setValue("operacionSinFactura", !valorActual);
    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Operación marcada como SIN FACTURA"
        : "Operación marcada como CON FACTURA",
      life: 2000,
    });
  };

  // Función para manejar el envío
  const onSubmit = async (data, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    try {
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      const datosNormalizados = {
        entregaARendirPVentasId: Number(data.entregaARendirPVentasId),
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        tipoMovimientoId: data.tipoMovimientoId
          ? Number(data.tipoMovimientoId)
          : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto),
        monedaId: data.monedaId ? Number(data.monedaId) : null,
        fechaMovimiento: data.fechaMovimiento,
        descripcion: data.descripcion ? data.descripcion.toUpperCase() : null,
        entidadComercialId: data.entidadComercialId
          ? Number(data.entidadComercialId)
          : null,
        urlComprobanteMovimiento: data.urlComprobanteMovimiento?.trim() || null,
        urlComprobanteOperacionMovCaja:
          data.urlComprobanteOperacionMovCaja?.trim() || null,
        validadoTesoreria: data.validadoTesoreria,
        fechaValidacionTesoreria: data.fechaValidacionTesoreria,
        operacionSinFactura: data.operacionSinFactura,
        fechaOperacionMovCaja: data.fechaOperacionMovCaja,
        operacionMovCajaId: data.operacionMovCajaId
          ? Number(data.operacionMovCajaId)
          : null,
        moduloOrigenMovCajaId: data.moduloOrigenMovCajaId
          ? Number(data.moduloOrigenMovCajaId)
          : null,
        tipoDocumentoId: data.tipoDocumentoId
          ? Number(data.tipoDocumentoId)
          : null,
        numeroSerieComprobante: data.numeroSerieComprobante?.trim() || null,
        numeroCorrelativoComprobante:
          data.numeroCorrelativoComprobante?.trim() || null,
        productoId: data.productoId ? Number(data.productoId) : null, // Nuevo campo
        detalleGastosPlanificados: data.detalleGastosPlanificados
          ? data.detalleGastosPlanificados.toUpperCase().trim()
          : null,
        asignacionOrigenId: data.asignacionOrigenId
          ? Number(data.asignacionOrigenId)
          : null,
        fechaActualizacion: new Date(),
      };

      if (!isEditing) {
        datosNormalizados.fechaCreacion = new Date();
      }

      onGuardadoExitoso?.(datosNormalizados);
    } catch (error) {
      console.error("Error al procesar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar los datos",
        life: 3000,
      });
    }
  };

  const formularioDeshabilitado = getValues("validadoTesoreria");

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      {/* Card de Datos Generales */}
      {cardActiva === "datos" && (
        <Card
          title="Datos Generales del Movimiento"
          className="mb-4"
          pt={{
            header: { className: "pb-0" },
            content: { className: "pt-2" },
          }}
        >
          <form>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={
                    movimiento?.fechaCreacion
                      ? new Date(movimiento.fechaCreacion).toLocaleString(
                          "es-PE",
                        )
                      : new Date().toLocaleString("es-PE")
                  }
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="fechaMovimiento"
                  className="block text-900 font-medium mb-2"
                >
                  Fecha del Movimiento *
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: "La fecha es obligatoria" }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      showIcon
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      placeholder="Seleccione fecha y hora"
                      className={classNames({
                        "p-invalid": errors.fechaMovimiento,
                      })}
                      inputStyle={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.fechaMovimiento && (
                  <Message
                    severity="error"
                    text={errors.fechaMovimiento.message}
                  />
                )}
              </div>
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="responsableId"
                  className="block text-900 font-medium mb-2"
                >
                  Responsable *
                </label>
                <Controller
                  name="responsableId"
                  control={control}
                  rules={{ required: "El responsable es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableId"
                      {...field}
                      value={field.value}
                      options={personalOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione responsable"
                      className={classNames({
                        "p-invalid": errors.responsableId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.responsableId && (
                  <Message
                    severity="error"
                    text={errors.responsableId.message}
                  />
                )}
              </div>
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="tipoMovimientoId"
                  className="block text-900 font-medium mb-2"
                >
                  Tipo de Movimiento *
                </label>
                <Controller
                  name="tipoMovimientoId"
                  control={control}
                  rules={{ required: "El tipo de movimiento es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMovimientoId"
                      {...field}
                      value={field.value}
                      options={tipoMovimientoOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione tipo"
                      className={classNames({
                        "p-invalid": errors.tipoMovimientoId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.tipoMovimientoId && (
                  <Message
                    severity="error"
                    text={errors.tipoMovimientoId.message}
                  />
                )}
              </div>
            </div>
            {/* Entidad Comercial */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <div className="p-field">
                  <label htmlFor="entidadComercialId">
                    Entidad Comercial <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="entidadComercialId"
                    control={control}
                    rules={{ required: "La entidad comercial es obligatoria" }}
                    render={({ field }) => (
                      <Dropdown
                        {...field}
                        options={entidadComercialOptions}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione una entidad comercial"
                        className={classNames({
                          "p-invalid": errors.entidadComercialId,
                        })}
                        showClear
                        filter
                        filterBy="label"
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                  {errors.entidadComercialId && (
                    <Message
                      severity="error"
                      text={errors.entidadComercialId.message}
                    />
                  )}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {/* Filtro de Familia */}
                <label
                  htmlFor="familiaFiltro"
                  className="block text-900 font-medium mb-2"
                >
                  Filtrar Gastos por Familia
                </label>
                <Dropdown
                  id="familiaFiltro"
                  value={familiaFiltroId}
                  options={familiasUnicas}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todas las familias"
                  onChange={(e) => setFamiliaFiltroId(e.value)}
                  showClear
                  filter
                  style={{ fontWeight: "bold" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              <div style={{ flex: 2 }}>
                {/* Producto (Gasto) */}
                <label
                  htmlFor="productoId"
                  className="block text-900 font-medium mb-2"
                >
                  Gasto
                </label>
                <Controller
                  name="productoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="productoId"
                      {...field}
                      value={field.value}
                      options={productoOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione producto/gasto"
                      className={classNames({
                        "p-invalid": errors.productoId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.productoId && (
                  <Message severity="error" text={errors.productoId.message} />
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="asignacionOrigenId"
                  className="block text-900 font-medium mb-2"
                >
                  Asignación Origen
                </label>
                <Controller
                  name="asignacionOrigenId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="asignacionOrigenId"
                      {...field}
                      value={field.value}
                      options={asignacionOrigenOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione asignación origen"
                      className={classNames({
                        "p-invalid": errors.asignacionOrigenId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.asignacionOrigenId && (
                  <Message
                    severity="error"
                    text={errors.asignacionOrigenId.message}
                  />
                )}
              </div>

              <div style={{ flex: 3 }}>
                <label
                  htmlFor="detalleGastosPlanificados"
                  className="block text-900 font-medium mb-2"
                >
                  Detalle Gastos Planificados
                </label>
                <Controller
                  name="detalleGastosPlanificados"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="detalleGastosPlanificados"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={1}
                      placeholder="Ingrese detalle de gastos planificados"
                      className={classNames({
                        "p-invalid": errors.detalleGastosPlanificados,
                      })}
                      style={{ fontWeight: "bold", textTransform: "uppercase" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.detalleGastosPlanificados && (
                  <Message
                    severity="error"
                    text={errors.detalleGastosPlanificados.message}
                  />
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="centroCostoId"
                  className="block text-900 font-medium mb-2"
                >
                  Centro de Costo *
                </label>
                <Controller
                  name="centroCostoId"
                  control={control}
                  rules={{ required: "El centro de costo es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="centroCostoId"
                      {...field}
                      value={field.value}
                      options={centroCostoOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione centro de costo"
                      className={classNames({
                        "p-invalid": errors.centroCostoId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.centroCostoId && (
                  <Message
                    severity="error"
                    text={errors.centroCostoId.message}
                  />
                )}
              </div>

              <div style={{ flex: 3 }}>
                <label
                  htmlFor="descripcion"
                  className="block text-900 font-medium mb-2"
                >
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={1}
                      placeholder="Ingrese una descripción del movimiento"
                      className={classNames({
                        "p-invalid": errors.descripcion,
                      })}
                      style={{
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        color: "red",
                      }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.descripcion && (
                  <Message severity="error" text={errors.descripcion.message} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="monedaId"
                  className="block text-900 font-medium mb-2"
                >
                  Moneda *
                </label>
                <Controller
                  name="monedaId"
                  control={control}
                  rules={{ required: "La moneda es obligatoria" }}
                  render={({ field }) => (
                    <Dropdown
                      id="monedaId"
                      {...field}
                      value={field.value}
                      options={monedaOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione moneda"
                      className={classNames({ "p-invalid": errors.monedaId })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.monedaId && (
                  <Message severity="error" text={errors.monedaId.message} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="monto"
                  className="block text-900 font-medium mb-2"
                >
                  Monto *
                </label>
                <Controller
                  name="monto"
                  control={control}
                  rules={{
                    required: "El monto es obligatorio",
                    min: {
                      value: 0.01,
                      message: "El monto debe ser mayor a cero",
                    },
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="monto"
                      value={field.value || null}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      className={classNames({ "p-invalid": errors.monto })}
                      inputStyle={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.monto && (
                  <Message severity="error" text={errors.monto.message} />
                )}
              </div>
            </div>

            {/* Sección de Comprobante PDF */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Validado Tesorería
                </label>
                <Button
                  type="button"
                  label={validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
                  icon={
                    validadoTesoreria ? "pi pi-check-circle" : "pi pi-clock"
                  }
                  className={
                    validadoTesoreria ? "p-button-primary" : "p-button-danger"
                  }
                  disabled
                  size="small"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha de Validación
                </label>
                <Controller
                  name="fechaValidacionTesoreria"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toLocaleString("es-PE", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                          : ""
                      }
                      placeholder="Pendiente"
                      readOnly
                      disabled
                      className="p-inputtext-sm"
                    />
                  )}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Comprobante
                </label>
                <Button
                  type="button"
                  label={operacionSinFactura ? "S/FACTURA" : "C/FACTURA"}
                  icon={
                    operacionSinFactura
                      ? "pi pi-exclamation-triangle"
                      : "pi pi-check-circle"
                  }
                  className={
                    operacionSinFactura
                      ? "p-button-warning"
                      : "p-button-primary"
                  }
                  onClick={handleToggleOperacionSinFactura}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
            </div>

            {/* Tipo y Número de Documento (solo si NO es sin factura) */}
            {!operacionSinFactura && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: "0.5rem",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="tipoDocumentoId"
                    className="block text-900 font-medium mb-2"
                  >
                    Tipo Documento
                  </label>
                  <Controller
                    name="tipoDocumentoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoDocumentoId"
                        {...field}
                        value={field.value}
                        options={tipoDocumentoOptions}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione tipo"
                        filter
                        showClear
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="numeroSerieComprobante"
                    className="block text-900 font-medium mb-2"
                  >
                    Serie
                  </label>
                  <Controller
                    name="numeroSerieComprobante"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroSerieComprobante"
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value?.toUpperCase())
                        }
                        placeholder="Ej: F001"
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="numeroCorrelativoComprobante"
                    className="block text-900 font-medium mb-2"
                  >
                    Correlativo
                  </label>
                  <Controller
                    name="numeroCorrelativoComprobante"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroCorrelativoComprobante"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Ej: 00001234"
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Sección Movimiento de Caja */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha Operación Mov. Caja
                </label>
                <Controller
                  name="fechaOperacionMovCaja"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      value={
                        field.value
                          ? new Date(field.value).toLocaleString("es-PE")
                          : ""
                      }
                      placeholder="Pendiente"
                      readOnly
                      disabled
                      className="p-inputtext-sm"
                    />
                  )}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  ID Operación Mov. Caja
                </label>
                <Controller
                  name="operacionMovCajaId"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      value={field.value ? field.value.toString() : ""}
                      placeholder="Pendiente"
                      readOnly
                      disabled
                      className="p-inputtext-sm"
                    />
                  )}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Módulo Origen
                </label>
                <InputText
                  value={
                    modulosVentas
                      ? `${modulosVentas.id} - ${modulosVentas.nombre}`
                      : "2 - VENTAS"
                  }
                  readOnly
                  disabled
                  className="p-inputtext-sm"
                  style={{ color: "#2196F3" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={
                    movimiento?.fechaActualizacion
                      ? new Date(movimiento.fechaActualizacion).toLocaleString(
                          "es-PE",
                        )
                      : ""
                  }
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Card de PDF */}
      {cardActiva === "pdf" && (
        <PdfDetMovEntregaRendirVentasCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={{}}
          detMovId={movimiento?.id}
          readOnly={formularioDeshabilitado}
        />
      )}

      {/* Card de PDF Comprobante Operación MovCaja */}
      {cardActiva === "pdfOperacion" && (
        <PdfComprobanteOperacionDetMovVentasCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={{}}
          detMovId={movimiento?.id}
          readOnly={formularioDeshabilitado}
        />
      )}

      {/* Botones de Cards y Acciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          alignItems: "center",
          marginTop: "0.5rem",
          justifyContent: "space-between",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Grupo de botones de navegación - Izquierda */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            icon="pi pi-file-edit"
            className={
              cardActiva === "datos" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("datos")}
            size="small"
            tooltip="Datos Generales"
            raised
          />
          <Button
            icon="pi pi-file-pdf"
            className={
              cardActiva === "pdf" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("pdf")}
            size="small"
            tooltip="Comprobante PDF"
            raised
          />
          <Button
            icon="pi pi-receipt"
            className={
              cardActiva === "pdfOperacion"
                ? "p-button-primary"
                : "p-button-outlined"
            }
            onClick={() => setCardActiva("pdfOperacion")}
            size="small"
            tooltip="Comprobante Operación MovCaja"
            raised
          />
        </div>

        {/* Grupo de botones de acción - Derecha */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-warning"
            size="small"
            severity="warning"
            onClick={onCancelar}
          />
          <Button
            type="button"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            className="p-button-success"
            size="small"
            severity="success"
            onClick={handleSubmit(onSubmit)}
            disabled={formularioDeshabilitado}
          />
        </div>
      </div>
    </div>
  );
};

export default DetMovsEntregaRendirVentasForm;
