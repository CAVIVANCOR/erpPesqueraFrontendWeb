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
 * - Soporte para múltiples relaciones (empresa, activo, tipo, moneda)
 *
 * @author ERP Megui
 * @version 1.0.0
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
import {
  crearMovimientoActivoFijo,
  actualizarMovimientoActivoFijo,
} from "../../api/movimientoActivoFijo";
import { getEmpresas } from "../../api/empresa";
import { getActivos } from "../../api/activo";
import { getTiposMovimientoActivoFijo } from "../../api/tipoMovimientoActivoFijo";
import { getMonedas } from "../../api/moneda";

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
  depreciacionMensual: yup
    .number()
    .nullable()
    .min(0, "La depreciación mensual debe ser mayor o igual a 0"),
  depreciacionAcumulada: yup
    .number()
    .nullable()
    .min(0, "La depreciación acumulada debe ser mayor o igual a 0"),
  valorNeto: yup
    .number()
    .nullable()
    .min(0, "El valor neto debe ser mayor o igual a 0"),
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
  permisos = {},
  readOnly = false,
}) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);

  const esEdicion = !!movimiento;

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      empresaId: null,
      activoId: null,
      tipoMovimientoId: null,
      fechaMovimiento: new Date(),
      fechaContable: null,
      monto: 0,
      monedaId: null,
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
        fechaMovimiento: movimiento.fechaMovimiento
          ? new Date(movimiento.fechaMovimiento)
          : new Date(),
        fechaContable: movimiento.fechaContable
          ? new Date(movimiento.fechaContable)
          : null,
        monto: Number(movimiento.monto) || 0,
        monedaId: Number(movimiento.monedaId) || null,
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
        fechaMovimiento: new Date(),
        fechaContable: null,
        monto: 0,
        monedaId: null,
        depreciacionMensual: null,
        depreciacionAcumulada: null,
        valorNeto: null,
        observaciones: "",
      });
    }
  }, [movimiento, empresaIdInicial, activoIdInicial, reset]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [empresasData, activosData, tiposData, monedasData] =
        await Promise.all([
          getEmpresas(),
          getActivos(),
          getTiposMovimientoActivoFijo(),
          getMonedas(),
        ]);

      setEmpresas(empresasData);
      setActivos(activosData);
      setTiposMovimiento(tiposData);
      setMonedas(monedasData);
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
      const datosNormalizados = {
        empresaId: Number(data.empresaId),
        activoId: Number(data.activoId),
        tipoMovimientoId: Number(data.tipoMovimientoId),
        fechaMovimiento: data.fechaMovimiento,
        fechaContable: data.fechaContable || null,
        monto: Number(data.monto),
        monedaId: Number(data.monedaId),
        depreciacionMensual: data.depreciacionMensual
          ? Number(data.depreciacionMensual)
          : null,
        depreciacionAcumulada: data.depreciacionAcumulada
          ? Number(data.depreciacionAcumulada)
          : null,
        valorNeto: data.valorNeto ? Number(data.valorNeto) : null,
        observaciones: data.observaciones?.trim() || null,
      };

      let resultado;
      if (esEdicion) {
        // Actualizar movimiento existente
        resultado = await actualizarMovimientoActivoFijo(
          movimiento.id,
          datosNormalizados
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
        });
      } else {
        // Crear nuevo movimiento
        resultado = await crearMovimientoActivoFijo(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
        });
      }

      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
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
   * Obtiene la clase CSS para campos con errores
   */
  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
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

  return (
    <div className="formgrid grid">
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        {/* Empresa */}
        <div className="field col-12 md:col-6">
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

        {/* Activo */}
        <div className="field col-12 md:col-6">
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

        {/* Tipo de Movimiento */}
        <div className="field col-12 md:col-6">
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
                placeholder="Seleccione tipo de movimiento"
                className={getFieldClass("tipoMovimientoId")}
                filter
                showClear
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.tipoMovimientoId && (
            <small className="p-error">{errors.tipoMovimientoId.message}</small>
          )}
        </div>

        {/* Moneda */}
        <div className="field col-12 md:col-6">
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
                onChange={(e) => field.onChange(e.value)}
                options={monedasOptions}
                placeholder="Seleccione moneda"
                className={getFieldClass("monedaId")}
                filter
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

        {/* Fecha de Movimiento */}
        <div className="field col-12 md:col-6">
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
            <small className="p-error">{errors.fechaMovimiento.message}</small>
          )}
        </div>

        {/* Fecha Contable */}
        <div className="field col-12 md:col-6">
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

        {/* Monto */}
        <div className="field col-12 md:col-4">
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
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.monto && (
            <small className="p-error">{errors.monto.message}</small>
          )}
        </div>

        {/* Depreciación Mensual */}
        <div className="field col-12 md:col-4">
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
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.depreciacionMensual && (
            <small className="p-error">
              {errors.depreciacionMensual.message}
            </small>
          )}
        </div>

        {/* Depreciación Acumulada */}
        <div className="field col-12 md:col-4">
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
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.depreciacionAcumulada && (
            <small className="p-error">
              {errors.depreciacionAcumulada.message}
            </small>
          )}
        </div>

        {/* Valor Neto */}
        <div className="field col-12 md:col-4">
          <label htmlFor="valorNeto" className="font-bold">
            Valor Neto
          </label>
          <Controller
            name="valorNeto"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="valorNeto"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="0.00"
                className={getFieldClass("valorNeto")}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
          {errors.valorNeto && (
            <small className="p-error">{errors.valorNeto.message}</small>
          )}
        </div>

        {/* Observaciones */}
        <div className="field col-12">
          <label htmlFor="observaciones" className="font-bold">
            Observaciones
          </label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                {...field}
                placeholder="Observaciones del movimiento..."
                className={getFieldClass("observaciones")}
                rows={3}
                disabled={readOnly}
              />
            )}
          />
          {errors.observaciones && (
            <small className="p-error">{errors.observaciones.message}</small>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button
            type="button"
            label="Cancelar"
            className="p-button-text"
            onClick={handleCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={esEdicion ? "Actualizar" : "Crear"}
            icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
            loading={loading}
            disabled={
              readOnly ||
              (esEdicion && !permisos.puedeEditar) ||
              (!esEdicion && !permisos.puedeCrear)
            }
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !permisos.puedeEditar && esEdicion
                  ? "No tiene permisos para editar"
                  : !permisos.puedeCrear && !esEdicion
                    ? "No tiene permisos para crear"
                    : ""
            }
          />
        </div>
      </form>
    </div>
  );
};

export default MovimientoActivoFijoForm;