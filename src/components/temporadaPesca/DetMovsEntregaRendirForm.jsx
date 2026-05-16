/**
 * DetMovsEntregaRendirForm.jsx
 * Formulario para crear y editar registros de DetMovsEntregaRendir.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 * La lógica de negocio correcta. El dropdown debe mostrar solo los movimientos que son asignaciones (iniciales o adicionales) y que forman parte del cálculo de la entrega a rendir.
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
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getModulos } from "../../api/moduloSistema";
import { Card } from "primereact/card";
import PdfDetMovEntregaRendirCard from "./PdfDetMovEntregaRendirCard";
import PdfComprobanteOperacionDetMovCard from "./PdfComprobanteOperacionDetMovCard";
import { formatearFechaHora, formatearNumero } from "../../utils/utils";
import DetGastosPlanificadosTable from "../detGastosPlanificados/DetGastosPlanificadosTable";
import { getGastosPlanificados } from "../../api/detGastosPlanificados";
import LiquidacionEntregaARendirCard from "./LiquidacionEntregaARendirCard";
import {
  obtenerTodasAsignacionesNoLiquidadas,
  obtenerValoresIniciales,
} from "../../api/detMovsEntregaRendir";
import { getEmbarcaciones } from "../../api/embarcacion";

const DetMovsEntregaRendirForm = ({
  movimiento = null,
  temporadaPesca = null,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  categorias = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  productos = [],
  movimientosAsignacionEntregaRendir = [],
  onGuardadoExitoso,
  onCancelar,
  permisos = {},
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();
  const [modulosPescaIndustrial, setModulosPescaIndustrial] = useState(null);
  const [cardActiva, setCardActiva] = useState("datos");
  const [familiaFiltroId, setFamiliaFiltroId] = useState(null);
  const [subfamiliaFiltroId, setSubfamiliaFiltroId] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(127);
  const [gastosPlanificadosAsignacion, setGastosPlanificadosAsignacion] =
    useState([]);
  const [gastoPlanificadoSeleccionado, setGastoPlanificadoSeleccionado] =
    useState(null);
  const [asignacionesNoLiquidadas, setAsignacionesNoLiquidadas] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      empresaId: 1,
      moduloOrigenId: 2,
      documentoOrigenId: null,
      responsableId: "",
      fechaMovimiento: new Date(),
      tipoMovimientoId: "",
      centroCostoId: "",
      monto: 0,
      monedaId: 1,
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
      productoId: "",
      detalleGastosPlanificados: "",
      asignacionOrigenId: 0,
      formaParteCalculoLiquidacionTripulantes: false,
      formaParteCalculoEntregaARendir: false,
      formaParteCalculoLiqAlquilerCuota: false,
      entregaARendirLiquidada: false,
      fechaLiquidacionEntregaARendir: null,
      urlLiquidacionEntregaARendir: null,
      enlaceAOtroDetalleGastoId: null,
      embarcacionId: null,
      enlaceGastosPlanificadosId: null,
    },
  });
  const urlComprobanteMovimiento = watch("urlComprobanteMovimiento");
  const validadoTesoreria = watch("validadoTesoreria");
  const operacionSinFactura = watch("operacionSinFactura");
  const formaParteCalculoLiquidacionTripulantes = watch(
    "formaParteCalculoLiquidacionTripulantes",
  );
  const formaParteCalculoEntregaARendir = watch(
    "formaParteCalculoEntregaARendir",
  );
  const formaParteCalculoLiqAlquilerCuota = watch(
    "formaParteCalculoLiqAlquilerCuota",
  );
  const fechaOperacionMovCaja = watch("fechaOperacionMovCaja");
  const operacionMovCajaId = watch("operacionMovCajaId");
  const moduloOrigenMovCajaId = watch("moduloOrigenMovCajaId");
  const urlComprobanteOperacionMovCaja = watch(
    "urlComprobanteOperacionMovCaja",
  );
  const tipoMovimientoId = watch("tipoMovimientoId");
  const asignacionOrigenId = watch("asignacionOrigenId");

  useEffect(() => {
    if (isEditing && movimiento) {
      reset({
        empresaId: movimiento.empresaId ? Number(movimiento.empresaId) : 1,
        moduloOrigenId: movimiento.moduloOrigenId ? Number(movimiento.moduloOrigenId) : 2,
        documentoOrigenId: movimiento.documentoOrigenId ? Number(movimiento.documentoOrigenId) : null,
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
        validadoTesoreria: movimiento.validadoTesoreria ?? false,
        fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria || null,
        operacionSinFactura: movimiento.operacionSinFactura ?? false,
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
          : null,
        detalleGastosPlanificados: movimiento.detalleGastosPlanificados || "",
        asignacionOrigenId: movimiento.asignacionOrigenId
          ? Number(movimiento.asignacionOrigenId)
          : movimiento.formaParteCalculoEntregaARendir === true
            ? 0
            : null,
        formaParteCalculoLiquidacionTripulantes:
          movimiento.formaParteCalculoLiquidacionTripulantes ?? false,
        formaParteCalculoEntregaARendir:
          movimiento.formaParteCalculoEntregaARendir ?? false,
        formaParteCalculoLiqAlquilerCuota:
          movimiento.formaParteCalculoLiqAlquilerCuota ?? false,
        entregaARendirLiquidada: movimiento.entregaARendirLiquidada ?? false,
        fechaLiquidacionEntregaARendir:
          movimiento.fechaLiquidacionEntregaARendir || null,
        urlLiquidacionEntregaARendir:
          movimiento.urlLiquidacionEntregaARendir || null,
        enlaceAOtroDetalleGastoId: movimiento.enlaceAOtroDetalleGastoId
          ? Number(movimiento.enlaceAOtroDetalleGastoId)
          : null,
        embarcacionId: movimiento.embarcacionId
          ? Number(movimiento.embarcacionId)
          : null,
        enlaceGastosPlanificadosId: movimiento.enlaceGastosPlanificadosId
          ? Number(movimiento.enlaceGastosPlanificadosId)
          : null,
      });

      if (movimiento.tipoMovimientoId) {
        const tipoMovimiento = tiposMovimiento.find(
          (tm) => Number(tm.id) === Number(movimiento.tipoMovimientoId),
        );
        if (tipoMovimiento?.categoriaId) {
          setCategoriaSeleccionada(Number(tipoMovimiento.categoriaId));
        }
      }
    } else {
      if (temporadaPesca) {
        setValue("empresaId", Number(temporadaPesca.empresaId) || 1);
        setValue("moduloOrigenId", 2);
        setValue("documentoOrigenId", Number(temporadaPesca.id));
      }
      setValue("fechaMovimiento", new Date());
      setValue("moduloOrigenMovCajaId", 2);
      if (usuario?.personalId) {
        setValue("responsableId", Number(usuario.personalId));
        setTimeout(() => {
          trigger("responsableId");
        }, 500);
      }
    }
  }, [movimiento, isEditing, temporadaPesca, reset, setValue, usuario]);

  useEffect(() => {
    const cargarModuloPescaIndustrial = async () => {
      try {
        const modulos = await getModulos();
        const moduloPescaIndustrial = modulos.find(
          (m) => Number(m.id) === 2,
        );
        setModulosPescaIndustrial(moduloPescaIndustrial);
      } catch (error) {
        console.error("Error al cargar módulos:", error);
      }
    };
    cargarModuloPescaIndustrial();
  }, []);

  useEffect(() => {
    const tipoMovimiento = tiposMovimiento.find(
      (tm) => Number(tm.id) === Number(tipoMovimientoId),
    );
    if (tipoMovimiento?.categoriaId) {
      setCategoriaSeleccionada(Number(tipoMovimiento.categoriaId));
    }
  }, [tipoMovimientoId, tiposMovimiento]);

  useEffect(() => {
    const cargarAsignacionesNoLiquidadas = async () => {
      try {
        const asignaciones = await obtenerTodasAsignacionesNoLiquidadas();
        setAsignacionesNoLiquidadas(asignaciones || []);
      } catch (error) {
        console.error("Error al cargar asignaciones no liquidadas:", error);
        setAsignacionesNoLiquidadas([]);
      }
    };
    cargarAsignacionesNoLiquidadas();
  }, []);

  useEffect(() => {
    const cargarGastosPlanificados = async () => {
      if (asignacionOrigenId && Number(asignacionOrigenId) > 0) {
        try {
          const gastos = await getGastosPlanificados(
            Number(asignacionOrigenId),
          );
          setGastosPlanificadosAsignacion(gastos || []);
        } catch (error) {
          console.error("Error al cargar gastos planificados:", error);
          setGastosPlanificadosAsignacion([]);
        }
      } else {
        setGastosPlanificadosAsignacion([]);
      }
    };
    cargarGastosPlanificados();
  }, [asignacionOrigenId]);

  useEffect(() => {
    const cargarValoresIniciales = async () => {
      if (!isEditing && temporadaPesca) {
        try {
          const valores = await obtenerValoresIniciales(
            "PESCA_INDUSTRIAL",
            Number(temporadaPesca.id),
          );

          setValue(
            "enlaceAOtroDetalleGastoId",
            valores.enlaceAOtroDetalleGastoId
              ? Number(valores.enlaceAOtroDetalleGastoId)
              : null,
          );

          if (valores.embarcacionId) {
            setValue("embarcacionId", Number(valores.embarcacionId));
          }
        } catch (error) {
          console.error("Error al cargar valores iniciales:", error);
        }
      }
    };

    cargarValoresIniciales();
  }, [isEditing, temporadaPesca, setValue]);

  useEffect(() => {
    const cargarEmbarcaciones = async () => {
      try {
        const data = await getEmbarcaciones();
        setEmbarcaciones(data || []);
      } catch (error) {
        console.error("Error al cargar embarcaciones:", error);
        setEmbarcaciones([]);
      }
    };
    cargarEmbarcaciones();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (!data.tipoMovimientoId) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Debe seleccionar un tipo de movimiento",
          life: 3000,
        });
        return;
      }

      if (!data.responsableId) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Debe seleccionar un responsable",
          life: 3000,
        });
        return;
      }

      if (!data.centroCostoId) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Debe seleccionar un centro de costo",
          life: 3000,
        });
        return;
      }

      if (!data.monedaId) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Debe seleccionar una moneda",
          life: 3000,
        });
        return;
      }

      const tipoMovimiento = tiposMovimiento.find(
        (tm) => Number(tm.id) === Number(data.tipoMovimientoId),
      );
      const esAsignacion = tipoMovimiento?.categoriaId === 17;

      if (esAsignacion) {
        data.formaParteCalculoEntregaARendir = true;
      }

      if (
        !esAsignacion &&
        data.formaParteCalculoEntregaARendir === true &&
        (data.asignacionOrigenId === null ||
          data.asignacionOrigenId === undefined)
      ) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            "Debe especificar una asignación origen cuando el movimiento forma parte del cálculo de entrega a rendir.",
          life: 3000,
        });
        return;
      }

      const datosNormalizados = {
        empresaId: data.empresaId ? Number(data.empresaId) : 1,
        moduloOrigenId: data.moduloOrigenId ? Number(data.moduloOrigenId) : 2,
        documentoOrigenId: data.documentoOrigenId ? Number(data.documentoOrigenId) : null,
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        tipoMovimientoId: data.tipoMovimientoId
          ? Number(data.tipoMovimientoId)
          : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto) || 0,
        monedaId: data.monedaId ? Number(data.monedaId) : null,
        descripcion: data.descripcion ? data.descripcion.toUpperCase().trim() : null,
        fechaMovimiento: data.fechaMovimiento || new Date(),
        entidadComercialId: data.entidadComercialId
          ? Number(data.entidadComercialId)
          : null,
        urlComprobanteMovimiento: data.urlComprobanteMovimiento || null,
        validadoTesoreria: data.validadoTesoreria,
        fechaValidacionTesoreria: data.fechaValidacionTesoreria || null,
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
        productoId: data.productoId ? Number(data.productoId) : null,
        detalleGastosPlanificados: data.detalleGastosPlanificados
          ? data.detalleGastosPlanificados.toUpperCase().trim()
          : null,
        asignacionOrigenId: data.asignacionOrigenId
          ? Number(data.asignacionOrigenId)
          : data.formaParteCalculoEntregaARendir === true
            ? 0
            : null,
        formaParteCalculoLiquidacionTripulantes:
          data.formaParteCalculoLiquidacionTripulantes,
        formaParteCalculoEntregaARendir: data.formaParteCalculoEntregaARendir,
        formaParteCalculoLiqAlquilerCuota:
          data.formaParteCalculoLiqAlquilerCuota,
        entregaARendirLiquidada: data.entregaARendirLiquidada,
        fechaLiquidacionEntregaARendir: data.fechaLiquidacionEntregaARendir,
        urlLiquidacionEntregaARendir: data.urlLiquidacionEntregaARendir,
        enlaceAOtroDetalleGastoId: data.enlaceAOtroDetalleGastoId
          ? Number(data.enlaceAOtroDetalleGastoId)
          : null,
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        enlaceGastosPlanificadosId: data.enlaceGastosPlanificadosId
          ? Number(data.enlaceGastosPlanificadosId)
          : null,
        actualizadoEn: new Date(),
      };

      if (!isEditing) {
        datosNormalizados.creadoEn = new Date();
      }

      onGuardadoExitoso?.(datosNormalizados);
    } catch (error) {
      console.error("Error al procesar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar los datos del formulario",
        life: 3000,
      });
    }
  };

  const formularioDeshabilitado = getValues("validadoTesoreria");

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
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
                <label
                  htmlFor="tipoMovimientoId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo de Movimiento <span style={{ color: "red" }}>*</span>
                </label>
                <Controller
                  name="tipoMovimientoId"
                  control={control}
                  rules={{ required: "Tipo de movimiento es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoMovimientoId"
                      value={field.value ? Number(field.value) : null}
                      options={tiposMovimiento.map((tm) => ({
                        ...tm,
                        id: Number(tm.id),
                        label: tm.nombre || tm.descripcion,
                        value: Number(tm.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione tipo de movimiento"
                      filter
                      filterBy="label"
                      className={classNames({
                        "p-invalid": errors.tipoMovimientoId,
                      })}
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
                {errors.tipoMovimientoId && (
                  <small className="p-error">
                    {errors.tipoMovimientoId.message}
                  </small>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="responsableId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Responsable <span style={{ color: "red" }}>*</span>
                </label>
                <Controller
                  name="responsableId"
                  control={control}
                  rules={{ required: "Responsable es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableId"
                      value={field.value ? Number(field.value) : null}
                      options={personal.map((p) => ({
                        ...p,
                        id: Number(p.id),
                        label: `${p.nombres} ${p.apellidos}`,
                        value: Number(p.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione responsable"
                      filter
                      filterBy="label"
                      className={classNames({
                        "p-invalid": errors.responsableId,
                      })}
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
                {errors.responsableId && (
                  <small className="p-error">
                    {errors.responsableId.message}
                  </small>
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
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="fechaMovimiento"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Fecha Movimiento <span style={{ color: "red" }}>*</span>
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: "Fecha es obligatoria" }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      dateFormat="dd/mm/yy"
                      showIcon
                      showButtonBar
                      className={classNames({
                        "p-invalid": errors.fechaMovimiento,
                      })}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.fechaMovimiento && (
                  <small className="p-error">
                    {errors.fechaMovimiento.message}
                  </small>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="centroCostoId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Centro de Costo <span style={{ color: "red" }}>*</span>
                </label>
                <Controller
                  name="centroCostoId"
                  control={control}
                  rules={{ required: "Centro de costo es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="centroCostoId"
                      value={field.value ? Number(field.value) : null}
                      options={centrosCosto.map((cc) => ({
                        ...cc,
                        id: Number(cc.id),
                        label: `${cc.Codigo} - ${cc.Nombre}`,
                        value: Number(cc.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione centro de costo"
                      filter
                      filterBy="label"
                      className={classNames({
                        "p-invalid": errors.centroCostoId,
                      })}
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
                {errors.centroCostoId && (
                  <small className="p-error">
                    {errors.centroCostoId.message}
                  </small>
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
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="monto"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Monto <span style={{ color: "red" }}>*</span>
                </label>
                <Controller
                  name="monto"
                  control={control}
                  rules={{
                    required: "Monto es obligatorio",
                    min: { value: 0, message: "Monto debe ser mayor a 0" },
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="monto"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      className={classNames({ "p-invalid": errors.monto })}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.monto && (
                  <small className="p-error">{errors.monto.message}</small>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="monedaId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Moneda <span style={{ color: "red" }}>*</span>
                </label>
                <Controller
                  name="monedaId"
                  control={control}
                  rules={{ required: "Moneda es obligatoria" }}
                  render={({ field }) => (
                    <Dropdown
                      id="monedaId"
                      value={field.value ? Number(field.value) : null}
                      options={monedas.map((m) => ({
                        ...m,
                        id: Number(m.id),
                        label: `${m.codigo} - ${m.nombre}`,
                        value: Number(m.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione moneda"
                      filter
                      filterBy="label"
                      className={classNames({ "p-invalid": errors.monedaId })}
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
                {errors.monedaId && (
                  <small className="p-error">{errors.monedaId.message}</small>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
              <label
                htmlFor="descripcion"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Descripción
              </label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="descripcion"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    rows={3}
                    disabled={formularioDeshabilitado}
                  />
                )}
              />
            </div>
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
                  htmlFor="entidadComercialId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Entidad Comercial
                </label>
                <Controller
                  name="entidadComercialId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="entidadComercialId"
                      value={field.value ? Number(field.value) : null}
                      options={entidadesComerciales.map((ec) => ({
                        ...ec,
                        id: Number(ec.id),
                        label: ec.razonSocial,
                        value: Number(ec.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione entidad comercial"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="productoId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Producto/Gasto
                </label>
                <Controller
                  name="productoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="productoId"
                      value={field.value ? Number(field.value) : null}
                      options={productos.map((p) => ({
                        ...p,
                        id: Number(p.id),
                        label: p.descripcionArmada || p.descripcionBase || p.codigo,
                        value: Number(p.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione producto"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
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
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoDocumentoId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Tipo Documento
                </label>
                <Controller
                  name="tipoDocumentoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipoDocumentoId"
                      value={field.value ? Number(field.value) : null}
                      options={tiposDocumento.map((td) => ({
                        ...td,
                        id: Number(td.id),
                        label: td.descripcion,
                        value: Number(td.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione tipo documento"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="numeroSerieComprobante"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Serie
                </label>
                <Controller
                  name="numeroSerieComprobante"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroSerieComprobante"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      placeholder="Ej: F001"
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="numeroCorrelativoComprobante"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Correlativo
                </label>
                <Controller
                  name="numeroCorrelativoComprobante"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="numeroCorrelativoComprobante"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Ej: 00001234"
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
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
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="asignacionOrigenId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Asignación Origen
                </label>
                <Controller
                  name="asignacionOrigenId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="asignacionOrigenId"
                      value={field.value ? Number(field.value) : null}
                      options={movimientosAsignacionEntregaRendir.map((m) => ({
                        ...m,
                        id: Number(m.id),
                        label: `#${m.id} - ${formatearFechaHora(m.fechaMovimiento)} - ${m.descripcion || "Sin descripción"}`,
                        value: Number(m.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione asignación"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="enlaceAOtroDetalleGastoId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Enlace a Otro Detalle
                </label>
                <Controller
                  name="enlaceAOtroDetalleGastoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="enlaceAOtroDetalleGastoId"
                      value={field.value ? Number(field.value) : null}
                      options={asignacionesNoLiquidadas.map((a) => ({
                        id: Number(a.id),
                        label: a.label,
                        value: Number(a.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione enlace"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="embarcacionId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Embarcación
                </label>
                <Controller
                  name="embarcacionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="embarcacionId"
                      value={field.value ? Number(field.value) : null}
                      options={embarcaciones.map((e) => ({
                        ...e,
                        id: Number(e.id),
                        label: e.activo?.nombre || e.matricula || `Embarcación ${e.id}`,
                        value: Number(e.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione embarcación"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
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
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="enlaceGastosPlanificadosId"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Enlace Gasto Planificado
                </label>
                <Controller
                  name="enlaceGastosPlanificadosId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="enlaceGastosPlanificadosId"
                      value={field.value ? Number(field.value) : null}
                      options={gastosPlanificadosAsignacion.map((g) => ({
                        id: Number(g.id),
                        label: `${g.producto?.descripcionArmada || "Sin producto"} - ${formatearNumero(g.montoPlanificado)}`,
                        value: Number(g.id),
                      }))}
                      onChange={(e) => field.onChange(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione gasto planificado"
                      filter
                      filterBy="label"
                      disabled={formularioDeshabilitado}
                      showClear
                    />
                  )}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                alignItems: "center",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Validado Tesorería
                </label>
                <InputText
                  value={validadoTesoreria ? "SÍ" : "NO"}
                  readOnly
                  disabled
                  style={{
                    fontWeight: "bold",
                    backgroundColor: validadoTesoreria ? "#c8e6c9" : "#ffcdd2",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Operación Sin Factura
                </label>
                <InputText
                  value={operacionSinFactura ? "SÍ" : "NO"}
                  readOnly
                  disabled
                  style={{
                    fontWeight: "bold",
                    backgroundColor: operacionSinFactura ? "#fff9c4" : "#e0e0e0",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Liquidación Tripulantes
                </label>
                <InputText
                  value={formaParteCalculoLiquidacionTripulantes ? "SÍ" : "NO"}
                  readOnly
                  disabled
                  style={{
                    fontWeight: "bold",
                    backgroundColor: formaParteCalculoLiquidacionTripulantes
                      ? "#c8e6c9"
                      : "#e0e0e0",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Entrega a Rendir
                </label>
                <InputText
                  value={formaParteCalculoEntregaARendir ? "SÍ" : "NO"}
                  readOnly
                  disabled
                  style={{
                    fontWeight: "bold",
                    backgroundColor: formaParteCalculoEntregaARendir
                      ? "#c8e6c9"
                      : "#e0e0e0",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Liq. Alquiler Cuota
                </label>
                <InputText
                  value={formaParteCalculoLiqAlquilerCuota ? "SÍ" : "NO"}
                  readOnly
                  disabled
                  style={{
                    fontWeight: "bold",
                    backgroundColor: formaParteCalculoLiqAlquilerCuota
                      ? "#c8e6c9"
                      : "#e0e0e0",
                  }}
                />
              </div>
            </div>

            {movimiento && (
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
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Fecha Creación
                  </label>
                  <InputText
                    value={
                      movimiento.creadoEn
                        ? formatearFechaHora(movimiento.creadoEn)
                        : ""
                    }
                    readOnly
                    disabled
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Última Actualización
                  </label>
                  <InputText
                    value={
                      movimiento.actualizadoEn
                        ? formatearFechaHora(movimiento.actualizadoEn)
                        : ""
                    }
                    readOnly
                    disabled
                  />
                </div>
              </div>
            )}
          </form>
        </Card>
      )}

      {cardActiva === "pdf" && (
        <PdfDetMovEntregaRendirCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={getValues()}
          detMovId={movimiento?.id}
          readOnly={false}
        />
      )}

      {cardActiva === "pdfOperacion" && (
        <PdfComprobanteOperacionDetMovCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={getValues()}
          detMovId={movimiento?.id}
          readOnly={false}
        />
      )}

      {cardActiva === "liquidacion" && (
        <LiquidacionEntregaARendirCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={getValues()}
          detMovId={movimiento?.id}
          readOnly={false}
          movimientoData={movimiento}
          onLiquidacionExitosa={async () => {
            if (movimiento?.id) {
              try {
                const token = useAuthStore.getState().token;
                const response = await fetch(
                  `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir/${movimiento.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
                if (response.ok) {
                  const movimientoActualizado = await response.json();
                  setValue(
                    "saldoInicialAsignacion",
                    movimientoActualizado.saldoInicialAsignacion,
                  );
                  setValue(
                    "saldoFinalAsignacion",
                    movimientoActualizado.saldoFinalAsignacion,
                  );

                  toast.current?.show({
                    severity: "success",
                    summary: "Saldo Actualizado",
                    detail: `Saldo Final: ${movimientoActualizado.moneda?.simbolo || ""} ${formatearNumero(movimientoActualizado.saldoFinalAsignacion || 0)}`,
                    life: 5000,
                  });
                }
              } catch (error) {
                console.error("Error al recargar movimiento:", error);
              }
            }
          }}
          onGuardarMovimiento={() => handleSubmit(onSubmit)()}
          permisos={permisos}
        />
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: "1rem",
          justifyContent: "space-between",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            icon="pi pi-file-edit"
            className={
              cardActiva === "datos" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("datos")}
            tooltip="Datos Generales"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-file-pdf"
            className={
              cardActiva === "pdf" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("pdf")}
            tooltip="Comprobante PDF"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-receipt"
            className={
              cardActiva === "pdfOperacion"
                ? "p-button-primary"
                : "p-button-outlined"
            }
            onClick={() => setCardActiva("pdfOperacion")}
            tooltip="Comprobante Operación"
            tooltipOptions={{ position: "top" }}
          />
          {movimiento &&
            !getValues("asignacionOrigenId") &&
            getValues("formaParteCalculoEntregaARendir") && (
              <Button
                icon="pi pi-file-check"
                className={
                  cardActiva === "liquidacion"
                    ? "p-button-primary"
                    : "p-button-outlined"
                }
                onClick={() => setCardActiva("liquidacion")}
                tooltip="Liquidación"
                tooltipOptions={{ position: "top" }}
              />
            )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            severity="warning"
            onClick={onCancelar}
          />
          <Button
            type="button"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            severity="success"
            onClick={handleSubmit(onSubmit)}
            disabled={formularioDeshabilitado}
          />
        </div>
      </div>
    </div>
  );
};

export default DetMovsEntregaRendirForm;