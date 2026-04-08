/**
 * DetMovsEntregaRendirForm.jsx
 * Formulario para crear y editar registros de DetMovsEntregaRendir.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 * La lógica de negocio correcta. El dropdown debe mostrar solo los movimientos que son asignaciones (iniciales o adicionales) y que forman parte del cálculo de la entrega a rendir.
 * @author ERP Megui
 * @version 1.0.0
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

const DetMovsEntregaRendirForm = ({
  movimiento = null,
  entregaARendirId,
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
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();
  const [modulosPescaIndustrial, setModulosPescaIndustrial] = useState(null);
  const [cardActiva, setCardActiva] = useState("datos");
  const [familiaFiltroId, setFamiliaFiltroId] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(127);
  const [gastosPlanificadosAsignacion, setGastosPlanificadosAsignacion] =
    useState([]);
  const [gastoPlanificadoSeleccionado, setGastoPlanificadoSeleccionado] =
    useState(null); // Por defecto: Categoría 127 (A rendir Pesca Industrial)
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
      entregaARendirId: entregaARendirId || "",
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
        entregaARendirId: Number(movimiento.entregaARendirId),
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
      });
    } else {
      setValue("entregaARendirId", Number(entregaARendirId));
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
  }, [movimiento, isEditing, entregaARendirId, reset, setValue, usuario]);

  useEffect(() => {
    const cargarModuloPescaIndustrial = async () => {
      try {
        const modulos = await getModulos();
        const moduloPesca = modulos.find(
          (m) => m.nombre === "PESCA INDUSTRIAL",
        );
        if (moduloPesca) {
          setModulosPescaIndustrial(moduloPesca);
          if (!isEditing) {
            setValue("moduloOrigenMovCajaId", Number(moduloPesca.id));
          }
        }
      } catch (error) {
        console.error("Error al cargar módulo PESCA INDUSTRIAL:", error);
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No se pudo cargar el módulo PESCA INDUSTRIAL",
          life: 3000,
        });
      }
    };
    cargarModuloPescaIndustrial();
  }, [setValue, isEditing]);

  // Auto-setear formaParteCalculoEntregaARendir cuando es asignación (tipo 1 o 2)
  useEffect(() => {
    if (tipoMovimientoId === 1 || tipoMovimientoId === 2) {
      setValue("formaParteCalculoEntregaARendir", true);
    }
  }, [tipoMovimientoId, setValue]);
  // Auto-seleccionar categoría 10 (EGRESO - PESCA INDUSTRIAL) al crear nuevo registro
  useEffect(() => {
    if (!isEditing) {
      setCategoriaSeleccionada(10); // EGRESO - PESCA INDUSTRIAL
    }
  }, [isEditing]);

  // Auto-cambiar categoría y tipo según estado de "Entrega a Rendir"
  useEffect(() => {
    if (formaParteCalculoEntregaARendir === true) {
      // ACTIVADO: Categoría 17 (GASTOS A RENDIR) + Tipo 127 (A RENDIR PESCA INDUSTRIAL)
      setCategoriaSeleccionada(17);
      setValue("tipoMovimientoId", 127);
      setValue("operacionSinFactura", true); // S/FACTURA automático
      if (!isEditing) {
        setValue("asignacionOrigenId", 0); // Reset a 0
      }
    } else if (!isEditing) {
      // DESACTIVADO (solo en modo creación): Volver a Categoría 10 + limpiar Tipo
      setCategoriaSeleccionada(10);
      setValue("tipoMovimientoId", "");
      setValue("operacionSinFactura", false);
      setValue("asignacionOrigenId", 0);
    }
  }, [formaParteCalculoEntregaARendir, setValue, isEditing]);

  // Cargar gastos planificados cuando se selecciona asignación origen
  useEffect(() => {
    const cargarGastosPlanificados = async () => {
      if (asignacionOrigenId && asignacionOrigenId > 0) {
        try {
          const gastos = await getGastosPlanificados({
            detMovEntregaRendirTemporadaPescaId: asignacionOrigenId,
          });
          setGastosPlanificadosAsignacion(gastos);
        } catch (error) {
          console.error("Error al cargar gastos planificados:", error);
          setGastosPlanificadosAsignacion([]);
        }
      } else {
        setGastosPlanificadosAsignacion([]);
        setGastoPlanificadoSeleccionado(null);
      }
    };
    cargarGastosPlanificados();
  }, [asignacionOrigenId]);

  
  // Cargar centro de costo desde asignación origen
  useEffect(() => {
    if (asignacionOrigenId && asignacionOrigenId > 0) {
      const asignacionOrigen = movimientosAsignacionEntregaRendir.find(
        (mov) => Number(mov.id) === Number(asignacionOrigenId)
      );
      
      if (asignacionOrigen && asignacionOrigen.centroCostoId) {
        console.log("✅ Cargando Centro de Costo desde Asignación Origen:", asignacionOrigen.centroCostoId);
        setValue("centroCostoId", Number(asignacionOrigen.centroCostoId));
      }
    }
  }, [asignacionOrigenId, movimientosAsignacionEntregaRendir, setValue]);

  

  // Auto-asignar entidadComercialId desde TemporadaPesca.empresa.entidadComercialId cuando es asignación
  useEffect(() => {
    if (tipoMovimientoId === 1 || tipoMovimientoId === 2) {
      if (
        temporadaPesca &&
        temporadaPesca.empresa &&
        temporadaPesca.empresa.entidadComercialId
      ) {
        setValue(
          "entidadComercialId",
          Number(temporadaPesca.empresa.entidadComercialId),
        );
      }
    }
  }, [tipoMovimientoId, temporadaPesca, setValue]);

  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: cc.Codigo + " - " + cc.Nombre || "N/A",
    value: Number(cc.id),
  }));

  // Función para obtener categorías disponibles (solo EGRESOS)
  const getCategoriasDisponibles = () => {
    // categoria.tipo: false=INGRESO, true=EGRESO
    // Filtrar solo categorías de EGRESO
    return categorias.filter((c) => c.tipo === true);
  };

  // Función para obtener tipos de movimiento disponibles según categoría seleccionada
  const getTiposMovimientoDisponibles = () => {
    let tiposDisponibles = [...tiposMovimiento];

    // Filtrar solo EGRESOS
    tiposDisponibles = tiposDisponibles.filter((tm) => tm.esIngreso === false);

    // Filtrar por categoría seleccionada
    if (categoriaSeleccionada) {
      tiposDisponibles = tiposDisponibles.filter(
        (tm) => Number(tm.categoriaId) === Number(categoriaSeleccionada),
      );
    }

    return tiposDisponibles;
  };

  const categoriaOptions = getCategoriasDisponibles()
    .filter((cat) => !cat.cesado)
    .map((cat) => ({
      label: cat.nombre,
      value: Number(cat.id),
    }));

  const tipoMovimientoOptions = getTiposMovimientoDisponibles().map((tm) => ({
    label: tm.nombre || "N/A",
    value: Number(tm.id),
  }));
  const monedaOptions = (monedas || []).map((m) => ({
    label: `${m.simbolo}`,
    value: Number(m.id),
  }));

  const tipoDocumentoOptions = tiposDocumento
    .filter((td) => td.esParaCompras === true || td.esParaVentas === true)
    .map((td) => ({
      label:
        td.activo === false ? `${td.descripcion} (INACTIVO)` : td.descripcion,
      value: Number(td.id),
    }));

  const familiasGastosIds = [2, 3, 4, 6, 7];

  const productosGastos = (productos || []).filter((p) =>
    familiasGastosIds.includes(Number(p.familiaId)),
  );

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

  const productosFiltrados = familiaFiltroId
    ? productosGastos.filter(
        (p) => Number(p.familiaId) === Number(familiaFiltroId),
      )
    : productosGastos;

  const productoOptions = productosFiltrados.map((p) => ({
    label: p.descripcionArmada || p.descripcionBase || p.codigo,
    value: Number(p.id),
  }));
  // Crear opciones de asignación origen desde los movimientos de asignación (inicial o adicional) que forman parte del cálculo
  const asignacionOrigenOptions = (
    movimientosAsignacionEntregaRendir || []
  ).map((mov) => ({
    label: `Mov #${mov.id} ${formatearFechaHora(mov.fechaMovimiento)} - ${mov.descripcion || "Sin descripción"} - ${mov.moneda?.simbolo || ""} ${formatearNumero(mov.monto)}`,
    value: Number(mov.id),
  }));
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

  const handleToggleCalculoLiquidacion = () => {
    const valorActual = getValues("formaParteCalculoLiquidacionTripulantes");
    setValue("formaParteCalculoLiquidacionTripulantes", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Incluido en cálculo de liquidación de tripulantes"
        : "Excluido de cálculo de liquidación de tripulantes",
      life: 2000,
    });
  };

  const handleToggleCalculoLiqAlquilerCuota = () => {
    const valorActual = getValues("formaParteCalculoLiqAlquilerCuota");
    setValue("formaParteCalculoLiqAlquilerCuota", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Incluido en cálculo de liquidación alquiler cuota"
        : "Excluido de cálculo de liquidación alquiler cuota",
      life: 2000,
    });
  };

  const handleToggleCalculoEntrega = () => {
    const valorActual = getValues("formaParteCalculoEntregaARendir");
    setValue("formaParteCalculoEntregaARendir", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Incluido en cálculo de entrega a rendir"
        : "Excluido de cálculo de entrega a rendir",
      life: 2000,
    });
  };

   const cargarDatosDesdeGastoPlanificado = (gastoId) => {
    console.log("🔍 cargarDatosDesdeGastoPlanificado - gastoId:", gastoId);
    console.log("🔍 gastosPlanificadosAsignacion:", gastosPlanificadosAsignacion);
    
    const gasto = gastosPlanificadosAsignacion.find(
      (g) => Number(g.id) === Number(gastoId),
    );
    
    console.log("🔍 Gasto encontrado:", gasto);
    
    if (gasto) {
      const productoId = gasto.productoId ? Number(gasto.productoId) : null;
      const monedaId = gasto.monedaId ? Number(gasto.monedaId) : null;
      const monto = gasto.montoPlanificado ? Number(gasto.montoPlanificado) : 0;
      const descripcion = gasto.descripcion || "";
      
      console.log("✅ Cargando valores:");
      console.log("  - productoId:", productoId);
      console.log("  - monedaId:", monedaId);
      console.log("  - monto:", monto);
      console.log("  - descripcion:", descripcion);
      
      setValue("productoId", productoId);
      setValue("monedaId", monedaId);
      setValue("monto", monto);
      setValue("descripcion", descripcion);
      setGastoPlanificadoSeleccionado(gastoId);
      
      console.log("✅ setValue ejecutado correctamente");
    } else {
      console.error("❌ No se encontró el gasto con ID:", gastoId);
    }
  };

  const onSubmit = async (data, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    try {
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      const datosNormalizados = {
        entregaARendirId: Number(data.entregaARendirId),
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        tipoMovimientoId: data.tipoMovimientoId
          ? Number(data.tipoMovimientoId)
          : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto),
        monedaId: data.monedaId ? Number(data.monedaId) : 1,
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
              <div style={{ flex: 0.8 }}>
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

              <div style={{ flex: 1 }}>
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
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Entrega a Rendir
                </label>
                <Button
                  type="button"
                  label={formaParteCalculoEntregaARendir ? "SI" : "NO"}
                  icon={
                    formaParteCalculoEntregaARendir
                      ? "pi pi-check-circle"
                      : "pi pi-times-circle"
                  }
                  className={
                    formaParteCalculoEntregaARendir
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  onClick={handleToggleCalculoEntrega}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              {/* FILTRO EN CASCADA: Categoría */}
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="categoriaSeleccionada"
                  className="block text-900 font-medium mb-2"
                >
                  Seleccione categoría
                </label>
                <Dropdown
                  id="categoriaSeleccionada"
                  value={categoriaSeleccionada}
                  options={categoriaOptions}
                  onChange={(e) => {
                    setCategoriaSeleccionada(e.value);
                    setValue("tipoMovimientoId", "");
                  }}
                  placeholder="Todas las categorías"
                  showClear
                  filter
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
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

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* ESCENARIO 1 y 2: Asignación Origen - Solo visible si formaParteCalculoEntregaARendir=true */}
              {formaParteCalculoEntregaARendir === true && (
                <div style={{ flex: 1 }}>
                  <label>Asignación Origen</label>
                  <Controller
                    name="asignacionOrigenId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="asignacionOrigenId"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.value);
                          if (e.value > 0) {
                            setGastoPlanificadoSeleccionado(null);
                            setValue("productoId", "");
                            setValue("monto", 0);
                            setValue("descripcion", "");
                          }
                        }}
                        options={asignacionOrigenOptions}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione asignación origen"
                        showClear
                        filter
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
              )}

              {/* ESCENARIO 2: Dropdown Gasto Planificado - Solo visible si asignacionOrigenId > 0 */}
              {formaParteCalculoEntregaARendir === true &&
                asignacionOrigenId > 0 && (
                  <div style={{ flex: 1 }}>
                    <label>Gasto Planificado *</label>
                    <Dropdown
                      id="gastoPlanificadoId"
                      value={gastoPlanificadoSeleccionado}
                      options={gastosPlanificadosAsignacion.map((g) => ({
                        label: `${g.producto?.descripcionArmada || g.producto?.nombre || "N/A"} - ${g.moneda?.simbolo || ""} ${Number(g.montoPlanificado || 0).toFixed(2)}`,
                        value: Number(g.id),
                      }))}
                      onChange={(e) =>
                        cargarDatosDesdeGastoPlanificado(e.value)
                      }
                      placeholder="Seleccione gasto planificado"
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  </div>
                )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Detalle Gastos Planificados - Solo visible para asignaciones (tipo 1 o 2) */}
              {(tipoMovimientoId === 1 || tipoMovimientoId === 2) && (
                <div style={{ flex: 1 }}>
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
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        rows={3}
                        placeholder="Ingrese detalle de gastos planificados para esta asignación"
                        className={classNames({
                          "p-invalid": errors.detalleGastosPlanificados,
                        })}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
              )}
            </div>
            {/* ESCENARIO 2 y 3: Entidad Comercial, Familia y Producto - Solo visible si NO es ESCENARIO 1 */}
            {(formaParteCalculoEntregaARendir === false ||
              (formaParteCalculoEntregaARendir === true &&
                asignacionOrigenId > 0)) && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: "0.5rem",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
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
                        options={entidadesComerciales
                          .filter((entidad) =>
                            temporadaPesca && temporadaPesca.empresaId
                              ? Number(entidad.empresaId) ===
                                Number(temporadaPesca.empresaId)
                              : true,
                          )
                          .map((entidad) => ({
                            label: entidad.razonSocial,
                            value: Number(entidad.id),
                          }))}
                        placeholder="Seleccione una entidad comercial"
                        className={classNames({
                          "p-invalid": errors.entidadComercialId,
                        })}
                        style={{ fontWeight: "bold" }}
                        showClear
                        filter
                        filterBy="label"
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
                <div style={{ flex: 1 }}>
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
                    <Message
                      severity="error"
                      text={errors.productoId.message}
                    />
                  )}
                </div>
              </div>
            )}

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
              <div style={{ flex: 0.5 }}>
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
                      className={classNames({
                        "p-invalid": errors.monedaId,
                      })}
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
              <div style={{ flex: 0.5 }}>
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
                      className={classNames({
                        "p-invalid": errors.monto,
                      })}
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
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Liquidación Tripulantes
                </label>
                <Button
                  type="button"
                  label={
                    formaParteCalculoLiquidacionTripulantes
                      ? "INCLUIDO"
                      : "EXCLUIDO"
                  }
                  icon={
                    formaParteCalculoLiquidacionTripulantes
                      ? "pi pi-check-circle"
                      : "pi pi-times-circle"
                  }
                  className={
                    formaParteCalculoLiquidacionTripulantes
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  onClick={handleToggleCalculoLiquidacion}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Liq. Alquiler Cuota
                </label>
                <Button
                  type="button"
                  label={
                    formaParteCalculoLiqAlquilerCuota ? "INCLUIDO" : "EXCLUIDO"
                  }
                  icon={
                    formaParteCalculoLiqAlquilerCuota
                      ? "pi pi-check-circle"
                      : "pi pi-times-circle"
                  }
                  className={
                    formaParteCalculoLiqAlquilerCuota
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  onClick={handleToggleCalculoLiqAlquilerCuota}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
            </div>

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

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={
                    movimiento?.creadoEn
                      ? new Date(movimiento.creadoEn).toLocaleString("es-PE")
                      : new Date().toLocaleString("es-PE")
                  }
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div style={{ flex: 0.5 }}>
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
              <div style={{ flex: 0.5 }}>
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
                    modulosPescaIndustrial
                      ? `${modulosPescaIndustrial.id} - ${modulosPescaIndustrial.nombre}`
                      : "2 - PESCA INDUSTRIAL"
                  }
                  readOnly
                  disabled
                  className="p-inputtext-sm"
                  style={{ color: "#2196F3" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={
                    movimiento?.actualizadoEn
                      ? new Date(movimiento.actualizadoEn).toLocaleString(
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

          {/* ESCENARIO 1: CRUD DetGastosPlanificados - Solo visible si asignacionOrigenId = 0 */}
          {formaParteCalculoEntregaARendir === true &&
            (!asignacionOrigenId || asignacionOrigenId === 0) && (
              <div style={{ marginTop: "1rem" }}>
                {!movimiento?.id ? (
                  <Message
                    severity="info"
                    text="Debe guardar el movimiento primero para poder agregar gastos planificados"
                    style={{ marginTop: "1rem" }}
                  />
                ) : (
                  <DetGastosPlanificadosTable
                    entregaRendirData={{
                      detMovEntregaRendirTemporadaPescaId: movimiento.id,
                    }}
                    monedaIdCabecera={watch("monedaId")}
                    toast={toast}
                    permisos={{
                      puedeCrear: true,
                      puedeEditar: true,
                      puedeEliminar: true,
                      puedeVer: true,
                    }}
                    readOnly={formularioDeshabilitado}
                  />
                )}
              </div>
            )}
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
export default DetMovsEntregaRendirForm;
