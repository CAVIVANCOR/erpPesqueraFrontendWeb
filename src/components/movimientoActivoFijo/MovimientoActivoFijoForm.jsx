/**
 * Formulario profesional para MovimientoActivoFijo
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Gestiona movimientos de activos fijos con depreciación y valores monetarios.
 *
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de campos según regla ERP Megui
 * - Feedback visual con Toast para éxito y error
 * - Manejo profesional de estados de carga
 * - Soporte para múltiples relaciones (empresa, activo, tipo, moneda, período, centro costo)
 * - Botón para generar asiento contable desde el formulario
 *
 * @author ERP Megui
 * @version 1.1.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import {
  crearMovimientoActivoFijo,
  actualizarMovimientoActivoFijo,
} from "../../api/movimientoActivoFijo";
import { getEmpresas } from "../../api/empresa";
import { getActivos } from "../../api/activo";
import { getTiposMovimientoActivoFijo } from "../../api/tipoMovimientoActivoFijo";
import { getMonedas } from "../../api/moneda";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getCentrosCosto } from "../../api/centroCosto";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { eliminarAsientoContableMovimiento } from "../../api/movimientoActivoFijo";
/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  empresaId: yup
    .number()
    .required("La empresa es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  activoId: yup
    .number()
    .required("El activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tipoMovimientoId: yup
    .number()
    .required("El tipo de movimiento es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  periodoContableId: yup
    .number()
    .required("El período contable es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  fechaMovimiento: yup
    .date()
    .required("La fecha de movimiento es obligatoria")
    .nullable(),
  fechaContable: yup.date().nullable(),
  monto: yup
    .number()
    .required("El monto es obligatorio")
    .min(0, "El monto debe ser mayor o igual a 0"),
  monedaId: yup
    .number()
    .required("La moneda es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  centroCostoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  depreciacionMensual: yup
    .number()
    .nullable()
    .min(0, "La depreciación mensual debe ser mayor o igual a 0"),
  depreciacionAcumulada: yup
    .number()
    .nullable()
    .min(0, "La depreciación acumulada debe ser mayor o igual a 0"),
  observaciones: yup.string().nullable(),
});

/**
 * Componente MovimientoActivoFijoForm
 * Formulario para crear y editar movimientos de activos fijos
 */
const MovimientoActivoFijoForm = ({
  movimiento,
  empresaIdInicial,
  activoIdInicial,
  onSave,
  onCancel,
  onGenerarAsiento,
  permisos = {},
  readOnly = false,
}) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore(); // ← AGREGAR ESTA LÍNEA
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const esEdicion = !!movimiento;

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      empresaId: null,
      activoId: null,
      tipoMovimientoId: null,
      periodoContableId: null,
      fechaMovimiento: new Date(),
      fechaContable: null,
      monto: 0,
      monedaId: null,
      centroCostoId: null,
      depreciacionMensual: null,
      depreciacionAcumulada: null,
      valorNeto: null,
      observaciones: "",
    },
  });

  /**
   * Cargar datos de combos al montar
   */
  useEffect(() => {
    cargarCombos();
  }, []);

  /**
   * Efecto para cargar datos en modo edición o nuevo con filtros
   */
  useEffect(() => {
    if (movimiento) {
      // Modo edición: cargar datos del movimiento
      reset({
        empresaId: Number(movimiento.empresaId) || null,
        activoId: Number(movimiento.activoId) || null,
        tipoMovimientoId: Number(movimiento.tipoMovimientoId) || null,
        periodoContableId: Number(movimiento.periodoContableId) || null,
        fechaMovimiento: movimiento.fechaMovimiento
          ? new Date(movimiento.fechaMovimiento)
          : new Date(),
        fechaContable: movimiento.fechaContable
          ? new Date(movimiento.fechaContable)
          : null,
        monto: Number(movimiento.monto) || 0,
        monedaId: Number(movimiento.monedaId) || null,
        centroCostoId: movimiento.centroCostoId
          ? Number(movimiento.centroCostoId)
          : null,
        depreciacionMensual: movimiento.depreciacionMensual
          ? Number(movimiento.depreciacionMensual)
          : null,
        depreciacionAcumulada: movimiento.depreciacionAcumulada
          ? Number(movimiento.depreciacionAcumulada)
          : null,
        valorNeto: movimiento.valorNeto ? Number(movimiento.valorNeto) : null,
        observaciones: movimiento.observaciones || "",
      });
    } else {
      // Modo creación: usar filtros iniciales si existen
      reset({
        empresaId: empresaIdInicial ? Number(empresaIdInicial) : null,
        activoId: activoIdInicial ? Number(activoIdInicial) : null,
        tipoMovimientoId: null,
        periodoContableId: null,
        fechaMovimiento: new Date(),
        fechaContable: null,
        monto: 0,
        monedaId: null,
        centroCostoId: null,
        depreciacionMensual: null,
        depreciacionAcumulada: null,
        valorNeto: null,
        observaciones: "",
      });
    }
  }, [movimiento, empresaIdInicial, activoIdInicial, reset]);

  /**
   * Efecto para detectar cambio de moneda y actualizar color de fondo
   */
  useEffect(() => {
    // Si hay movimiento y monedas cargadas
    if (movimiento?.monedaId && monedas.length > 0) {
      // Primero intentar usar el objeto moneda completo si viene en el movimiento
      if (movimiento.moneda) {
        setMonedaSeleccionada(movimiento.moneda);
      } else {
        // Si no, buscar en el array de monedas
        const moneda = monedas.find(
          (m) => Number(m.id) === Number(movimiento.monedaId),
        );
        if (moneda) {
          setMonedaSeleccionada(moneda);
        }
      }
    } else if (!movimiento) {
      // Si no hay movimiento (modo creación), resetear
      setMonedaSeleccionada(null);
    }
  }, [movimiento, monedas]);

  /**
   * Efecto para calcular automáticamente el Valor Neto
   * Valor Neto = Monto - Depreciación Acumulada
   */
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "monto" || name === "depreciacionAcumulada") {
        const monto = Number(value.monto) || 0;
        const depreciacionAcumulada = Number(value.depreciacionAcumulada) || 0;
        const valorNeto = monto - depreciacionAcumulada;
        setValue("valorNeto", valorNeto);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [
        empresasData,
        activosData,
        tiposData,
        monedasData,
        periodosData,
        centrosData,
      ] = await Promise.all([
        getEmpresas(),
        getActivos(),
        getTiposMovimientoActivoFijo(),
        getMonedas(),
        getPeriodosContables(),
        getCentrosCosto(),
      ]);

      setEmpresas(empresasData);
      setActivos(activosData);
      setTiposMovimiento(tiposData);
      setMonedas(monedasData);
      setPeriodosContables(periodosData);
      setCentrosCosto(centrosData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos de los combos",
      });
    }
  };

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el movimiento según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const monto = Number(data.monto);
      const depreciacionAcumulada = data.depreciacionAcumulada
        ? Number(data.depreciacionAcumulada)
        : 0;
      const valorNeto = monto - depreciacionAcumulada;

      const datosNormalizados = {
        empresaId: Number(data.empresaId),
        activoId: Number(data.activoId),
        tipoMovimientoId: Number(data.tipoMovimientoId),
        periodoContableId: Number(data.periodoContableId),
        fechaMovimiento: data.fechaMovimiento,
        fechaContable: data.fechaContable || null,
        monto: monto,
        monedaId: Number(data.monedaId),
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        depreciacionMensual: data.depreciacionMensual
          ? Number(data.depreciacionMensual)
          : null,
        depreciacionAcumulada: depreciacionAcumulada || null,
        valorNeto: valorNeto,
        observaciones: data.observaciones?.trim() || null,
        creadoPor: Number(usuario?.id),
        actualizadoPor: Number(usuario?.id),
      };

      let resultado;
      if (esEdicion) {
        // Actualizar movimiento existente
        resultado = await actualizarMovimientoActivoFijo(
          movimiento.id,
          datosNormalizados,
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
        });

        // Actualizar los datos del formulario con la respuesta del servidor
        reset({
          empresaId: Number(resultado.empresaId),
          activoId: Number(resultado.activoId),
          tipoMovimientoId: Number(resultado.tipoMovimientoId),
          periodoContableId: Number(resultado.periodoContableId),
          fechaMovimiento: new Date(resultado.fechaMovimiento),
          fechaContable: resultado.fechaContable
            ? new Date(resultado.fechaContable)
            : null,
          monto: Number(resultado.monto),
          monedaId: Number(resultado.monedaId),
          centroCostoId: resultado.centroCostoId
            ? Number(resultado.centroCostoId)
            : null,
          depreciacionMensual: resultado.depreciacionMensual
            ? Number(resultado.depreciacionMensual)
            : null,
          depreciacionAcumulada: resultado.depreciacionAcumulada
            ? Number(resultado.depreciacionAcumulada)
            : null,
          valorNeto: resultado.valorNeto ? Number(resultado.valorNeto) : null,
          observaciones: resultado.observaciones || "",
        });
      } else {
        // Crear nuevo movimiento
        resultado = await crearMovimientoActivoFijo(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail:
            "Movimiento creado correctamente. Ahora puede continuar editando.",
        });

        // Cargar los datos del nuevo movimiento en el formulario (cambiar a modo edición)
        reset({
          empresaId: Number(resultado.empresaId),
          activoId: Number(resultado.activoId),
          tipoMovimientoId: Number(resultado.tipoMovimientoId),
          periodoContableId: Number(resultado.periodoContableId),
          fechaMovimiento: new Date(resultado.fechaMovimiento),
          fechaContable: resultado.fechaContable
            ? new Date(resultado.fechaContable)
            : null,
          monto: Number(resultado.monto),
          monedaId: Number(resultado.monedaId),
          centroCostoId: resultado.centroCostoId
            ? Number(resultado.centroCostoId)
            : null,
          depreciacionMensual: resultado.depreciacionMensual
            ? Number(resultado.depreciacionMensual)
            : null,
          depreciacionAcumulada: resultado.depreciacionAcumulada
            ? Number(resultado.depreciacionAcumulada)
            : null,
          valorNeto: resultado.valorNeto ? Number(resultado.valorNeto) : null,
          observaciones: resultado.observaciones || "",
        });
      }

      // Llamar callback de éxito SOLO para actualizar la lista en segundo plano
      // NO para cerrar el diálogo
      if (onSave) {
        onSave(resultado, false); // false = no cerrar diálogo
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);

      // Mostrar error específico del servidor o error genérico
      const mensajeError =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al guardar el movimiento";

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Maneja la generación de asiento contable
   */
  const handleGenerarAsiento = () => {
    if (onGenerarAsiento && movimiento) {
      onGenerarAsiento(movimiento);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   */
  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

const handleEliminarAsiento = () => {
  confirmDialog({
    message:
      "¿Está seguro de eliminar el asiento contable? Esta acción no se puede deshacer.",
    header: "Confirmar Eliminación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, Eliminar",
    rejectLabel: "Cancelar",
    acceptClassName: "p-button-danger",
    accept: async () => {
      setLoading(true);
      try {
        await eliminarAsientoContableMovimiento(movimiento.id);
        
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Asiento contable eliminado correctamente",
          life: 3000,
        });
        
        // Cerrar el formulario para que se recargue la lista
        if (onCancel) {
          onCancel();
        }
      } catch (error) {
        console.error("Error al eliminar asiento:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al eliminar el asiento contable",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
  });
};
  // Opciones para combos
  const empresasOptions = empresas.map((empresa) => ({
    label: empresa.razonSocial,
    value: Number(empresa.id),
  }));

  const activosOptions = activos.map((activo) => ({
    label: `${activo.nombre} - ${activo.tipo?.nombre || ""}`,
    value: Number(activo.id),
  }));

  const tiposMovimientoOptions = tiposMovimiento
    .filter((tipo) => tipo.activo)
    .map((tipo) => ({
      label: tipo.nombre,
      value: Number(tipo.id),
    }));

  const monedasOptions = monedas.map((moneda) => ({
    label: moneda.codigoSunat,
    value: Number(moneda.id),
  }));

  const periodosContablesOptions = periodosContables
    .filter((periodo) => {
      // Solo filtrar por estado "ABIERTO" (ID 73)
      const estaAbierto = Number(periodo.estadoId) === 73;
      return estaAbierto;
    })
    .map((periodo) => ({
      label: `${periodo.nombrePeriodo} (${new Date(periodo.fechaInicio).toLocaleDateString()} - ${new Date(periodo.fechaFin).toLocaleDateString()})`,
      value: Number(periodo.id),
    }));
  const centrosCostoOptions = centrosCosto.map((centro) => ({
    label: `${centro.Codigo} - ${centro.Nombre}`,
    value: Number(centro.id),
  }));

  const getMonedaBackgroundColor = () => {
    if (!monedaSeleccionada) return "transparent";
    const esUSD = monedaSeleccionada.codigoSunat === "USD";
    const esPEN = monedaSeleccionada.codigoSunat === "PEN";
    return esUSD ? "#d4edda" : esPEN ? "#fff3cd" : "transparent";
  };

  return (
    <div className="formgrid grid">
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Empresa */}
            <label htmlFor="empresaId" className="font-bold">
              Empresa <span className="p-error">*</span>
            </label>
            <Controller
              name="empresaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={empresasOptions}
                  placeholder="Seleccione una empresa"
                  className={getFieldClass("empresaId")}
                  filter
                  showClear
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Fecha de Movimiento */}
            <label htmlFor="fechaMovimiento" className="font-bold">
              Fecha de Movimiento <span className="p-error">*</span>
            </label>
            <Controller
              name="fechaMovimiento"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaMovimiento"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione fecha"
                  className={getFieldClass("fechaMovimiento")}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <small className="p-error">
                {errors.fechaMovimiento.message}
              </small>
            )}
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
            {/* Activo */}
            <label htmlFor="activoId" className="font-bold">
              Activo <span className="p-error">*</span>
            </label>
            <Controller
              name="activoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="activoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={activosOptions}
                  placeholder="Seleccione un activo"
                  className={getFieldClass("activoId")}
                  filter
                  showClear
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.activoId && (
              <small className="p-error">{errors.activoId.message}</small>
            )}
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
            {/* Tipo de Movimiento */}
            <label htmlFor="tipoMovimientoId" className="font-bold">
              Tipo de Movimiento <span className="p-error">*</span>
            </label>
            <Controller
              name="tipoMovimientoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipoMovimientoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposMovimientoOptions}
                  placeholder="Seleccione un tipo"
                  className={getFieldClass("tipoMovimientoId")}
                  filter
                  showClear
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
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
            {/* Período Contable */}
            <label htmlFor="periodoContableId" className="font-bold">
              Período Contable <span className="p-error">*</span>
            </label>
            <Controller
              name="periodoContableId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="periodoContableId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={periodosContablesOptions}
                  placeholder="Seleccione un período"
                  className={getFieldClass("periodoContableId")}
                  filter
                  showClear
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.periodoContableId && (
              <small className="p-error">
                {errors.periodoContableId.message}
              </small>
            )}
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
            {/* Fecha Contable */}
            <label htmlFor="fechaContable" className="font-bold">
              Fecha Contable
            </label>
            <Controller
              name="fechaContable"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaContable"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione fecha contable"
                  className={getFieldClass("fechaContable")}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.fechaContable && (
              <small className="p-error">{errors.fechaContable.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Moneda */}
            <label htmlFor="monedaId" className="font-bold">
              Moneda <span className="p-error">*</span>
            </label>
            <Controller
              name="monedaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="monedaId"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.value);
                    const moneda = monedas.find(
                      (m) => Number(m.id) === Number(e.value),
                    );
                    setMonedaSeleccionada(moneda || null);
                  }}
                  options={monedasOptions}
                  placeholder="Seleccione moneda"
                  className={getFieldClass("monedaId")}
                  showClear
                  disabled={readOnly}
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.monedaId && (
              <small className="p-error">{errors.monedaId.message}</small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Monto */}
            <label htmlFor="monto" className="font-bold">
              Monto <span className="p-error">*</span>
            </label>
            <Controller
              name="monto"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.00"
                  className={getFieldClass("monto")}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  disabled={readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: getMonedaBackgroundColor(),
                  }}
                />
              )}
            />
            {errors.monto && (
              <small className="p-error">{errors.monto.message}</small>
            )}
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
            {/* Depreciación Mensual */}
            <label htmlFor="depreciacionMensual" className="font-bold">
              Depreciación Mensual
            </label>
            <Controller
              name="depreciacionMensual"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="depreciacionMensual"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.00"
                  className={getFieldClass("depreciacionMensual")}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  disabled={readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: getMonedaBackgroundColor(),
                  }}
                />
              )}
            />
            {errors.depreciacionMensual && (
              <small className="p-error">
                {errors.depreciacionMensual.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Depreciación Acumulada */}
            <label htmlFor="depreciacionAcumulada" className="font-bold">
              Depreciación Acumulada
            </label>
            <Controller
              name="depreciacionAcumulada"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="depreciacionAcumulada"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  placeholder="0.00"
                  className={getFieldClass("depreciacionAcumulada")}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  disabled={readOnly}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: getMonedaBackgroundColor(),
                  }}
                />
              )}
            />
            {errors.depreciacionAcumulada && (
              <small className="p-error">
                {errors.depreciacionAcumulada.message}
              </small>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Valor Neto (Calculado) */}
            <label htmlFor="valorNeto" className="font-bold">
              Valor Neto (Calculado)
            </label>
            <Controller
              name="valorNeto"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="valorNeto"
                  value={field.value}
                  placeholder="0.00"
                  className={getFieldClass("valorNeto")}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={true}
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor: "#e9ecef",
                    color: "#495057",
                  }}
                />
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
            {/* Centro de Costo */}
            <label htmlFor="centroCostoId" className="font-bold">
              Centro de Costo
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={centrosCostoOptions}
                  placeholder="Seleccione un centro de costo (opcional)"
                  className={getFieldClass("centroCostoId")}
                  filter
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.centroCostoId && (
              <small className="p-error">{errors.centroCostoId.message}</small>
            )}
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
            {/* Observaciones */}
            <label htmlFor="observaciones" className="font-bold">
              Observaciones
            </label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Ingrese observaciones"
                  rows={3}
                  className={getFieldClass("observaciones")}
                  disabled={readOnly}
                />
              )}
            />
            {errors.observaciones && (
              <small className="p-error">{errors.observaciones.message}</small>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          {esEdicion &&
            onGenerarAsiento &&
            movimiento.periodoContable &&
            Number(movimiento.periodoContable.estadoId) === 73 && (
              <>
                <Button
                  type="button"
                  label={
                    movimiento.asientoContableId
                      ? "Regenerar Asiento"
                      : "Generar Asiento"
                  }
                  icon="pi pi-book"
                  className={
                    movimiento.asientoContableId
                      ? "p-button-warning"
                      : "p-button-info"
                  }
                  onClick={handleGenerarAsiento}
                  disabled={loading || readOnly}
                  tooltip={
                    movimiento.asientoContableId
                      ? "Regenerar el asiento contable existente"
                      : "Generar asiento contable para este movimiento"
                  }
                />
                {movimiento.asientoContableId && (
                  <Button
                    type="button"
                    label="Eliminar Asiento"
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={handleEliminarAsiento}
                    disabled={loading || readOnly}
                    tooltip="Eliminar el asiento contable y permitir modificar el movimiento"
                  />
                )}
              </>
            )}

          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={handleCancel}
            disabled={loading}
          />
          {!readOnly && (
            <Button
              type="submit"
              label={esEdicion ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              className="p-button-success"
              loading={loading}
            />
          )}
        </div>
      </form>
    </div>
  );
};

export default MovimientoActivoFijoForm;
