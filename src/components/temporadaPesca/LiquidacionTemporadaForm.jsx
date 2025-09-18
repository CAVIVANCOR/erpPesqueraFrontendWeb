/**
 * LiquidacionTemporadaForm.jsx
 *
 * Formulario para crear y editar registros de LiquidacionTemporadaPesca.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useRef } from "react";
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
import {
  crearLiquidacionTemporadaPesca,
  actualizarLiquidacionTemporadaPesca,
} from "../../api/liquidacionTemporadaPesca";

const LiquidacionTemporadaForm = ({
  liquidacion = null,
  temporadaPescaId,
  personal = [],
  empresasList = [],
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isEditing = !!liquidacion;

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      temporadaPescaId: temporadaPescaId || null,
      fechaLiquidacion: new Date(),
      empresaId: null,
      responsableId: null,
      verificadorId: null,
      saldoInicial: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      saldoFinal: 0,
      fechaVerificacion: null,
      observaciones: "",
    },
  });

  // Calcular saldo final automáticamente
  const saldoInicial = watch("saldoInicial");
  const totalIngresos = watch("totalIngresos");
  const totalEgresos = watch("totalEgresos");

  useEffect(() => {
    const saldoCalculado = Number(saldoInicial || 0) + Number(totalIngresos || 0) - Number(totalEgresos || 0);
    setValue("saldoFinal", saldoCalculado);
  }, [saldoInicial, totalIngresos, totalEgresos, setValue]);

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && liquidacion) {
      reset({
        temporadaPescaId: Number(liquidacion.temporadaPescaId),
        fechaLiquidacion: liquidacion.fechaLiquidacion ? new Date(liquidacion.fechaLiquidacion) : new Date(),
        empresaId: liquidacion.empresaId ? Number(liquidacion.empresaId) : null,
        responsableId: liquidacion.responsableId ? Number(liquidacion.responsableId) : null,
        verificadorId: liquidacion.verificadorId ? Number(liquidacion.verificadorId) : null,
        saldoInicial: Number(liquidacion.saldoInicial) || 0,
        totalIngresos: Number(liquidacion.totalIngresos) || 0,
        totalEgresos: Number(liquidacion.totalEgresos) || 0,
        saldoFinal: Number(liquidacion.saldoFinal) || 0,
        fechaVerificacion: liquidacion.fechaVerificacion ? new Date(liquidacion.fechaVerificacion) : null,
        observaciones: liquidacion.observaciones || "",
      });
    } else {
      // Para nuevo registro, establecer temporadaPescaId
      setValue("temporadaPescaId", Number(temporadaPescaId));
      setValue("fechaLiquidacion", new Date());
    }
  }, [liquidacion, isEditing, temporadaPescaId, reset, setValue]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const empresaOptions = empresasList.map((e) => ({
    label: e.razonSocial || e.nombre,
    value: Number(e.id),
  }));

  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    try {
      // Validaciones de negocio
      if (data.fechaVerificacion && !data.verificadorId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe seleccionar un verificador si hay fecha de verificación",
          life: 3000,
        });
        return;
      }

      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        ...data,
        temporadaPescaId: Number(data.temporadaPescaId),
        empresaId: data.empresaId ? Number(data.empresaId) : null,
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        verificadorId: data.verificadorId ? Number(data.verificadorId) : null,
        saldoInicial: Number(data.saldoInicial) || 0,
        totalIngresos: Number(data.totalIngresos) || 0,
        totalEgresos: Number(data.totalEgresos) || 0,
        saldoFinal: Number(data.saldoFinal) || 0,
        fechaLiquidacion: data.fechaLiquidacion,
        fechaVerificacion: data.fechaVerificacion || null,
        fechaActualizacion: new Date(),
      };

      let resultado;
      if (isEditing) {
        resultado = await actualizarLiquidacionTemporadaPesca(liquidacion.id, datosNormalizados);
      } else {
        datosNormalizados.fechaCreacion = new Date();
        resultado = await crearLiquidacionTemporadaPesca(datosNormalizados);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Liquidación ${isEditing ? "actualizada" : "creada"} correctamente`,
        life: 3000,
      });

      onGuardadoExitoso?.(resultado);
    } catch (error) {
      console.error("Error al guardar liquidación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al ${isEditing ? "actualizar" : "crear"} la liquidación`,
        life: 3000,
      });
    }
  };

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          {/* Fecha de Liquidación */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaLiquidacion" className="block text-900 font-medium mb-2">
              Fecha de Liquidación *
            </label>
            <Controller
              name="fechaLiquidacion"
              control={control}
              rules={{ required: "La fecha es obligatoria" }}
              render={({ field }) => (
                <Calendar
                  id="fechaLiquidacion"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showIcon
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha"
                  className={classNames({
                    "p-invalid": errors.fechaLiquidacion,
                  })}
                />
              )}
            />
            {errors.fechaLiquidacion && (
              <Message severity="error" text={errors.fechaLiquidacion.message} />
            )}
          </div>

          {/* Empresa */}
          <div className="col-12 md:col-6">
            <label htmlFor="empresaId" className="block text-900 font-medium mb-2">
              Empresa *
            </label>
            <Controller
              name="empresaId"
              control={control}
              rules={{ required: "La empresa es obligatoria" }}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  {...field}
                  value={field.value}
                  options={empresaOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione empresa"
                  className={classNames({
                    "p-invalid": errors.empresaId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.empresaId && (
              <Message severity="error" text={errors.empresaId.message} />
            )}
          </div>

          {/* Responsable */}
          <div className="col-12 md:col-6">
            <label htmlFor="responsableId" className="block text-900 font-medium mb-2">
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
                />
              )}
            />
            {errors.responsableId && (
              <Message severity="error" text={errors.responsableId.message} />
            )}
          </div>

          {/* Verificador */}
          <div className="col-12 md:col-6">
            <label htmlFor="verificadorId" className="block text-900 font-medium mb-2">
              Verificador
            </label>
            <Controller
              name="verificadorId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="verificadorId"
                  {...field}
                  value={field.value}
                  options={personalOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione verificador"
                  className={classNames({
                    "p-invalid": errors.verificadorId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.verificadorId && (
              <Message severity="error" text={errors.verificadorId.message} />
            )}
          </div>

          {/* Saldo Inicial */}
          <div className="col-12 md:col-4">
            <label htmlFor="saldoInicial" className="block text-900 font-medium mb-2">
              Saldo Inicial (S/)
            </label>
            <Controller
              name="saldoInicial"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="saldoInicial"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  className={classNames({
                    "p-invalid": errors.saldoInicial,
                  })}
                />
              )}
            />
            {errors.saldoInicial && (
              <Message severity="error" text={errors.saldoInicial.message} />
            )}
          </div>

          {/* Total Ingresos */}
          <div className="col-12 md:col-4">
            <label htmlFor="totalIngresos" className="block text-900 font-medium mb-2">
              Total Ingresos (S/)
            </label>
            <Controller
              name="totalIngresos"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="totalIngresos"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  className={classNames({
                    "p-invalid": errors.totalIngresos,
                  })}
                />
              )}
            />
            {errors.totalIngresos && (
              <Message severity="error" text={errors.totalIngresos.message} />
            )}
          </div>

          {/* Total Egresos */}
          <div className="col-12 md:col-4">
            <label htmlFor="totalEgresos" className="block text-900 font-medium mb-2">
              Total Egresos (S/)
            </label>
            <Controller
              name="totalEgresos"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="totalEgresos"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  className={classNames({
                    "p-invalid": errors.totalEgresos,
                  })}
                />
              )}
            />
            {errors.totalEgresos && (
              <Message severity="error" text={errors.totalEgresos.message} />
            )}
          </div>

          {/* Saldo Final - Solo lectura */}
          <div className="col-12">
            <label htmlFor="saldoFinal" className="block text-900 font-medium mb-2">
              Saldo Final (S/) - Calculado Automáticamente
            </label>
            <Controller
              name="saldoFinal"
              control={control}
              render={({ field }) => (
                <InputNumber
                  id="saldoFinal"
                  {...field}
                  value={field.value}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  readOnly
                  disabled
                  className="p-inputnumber-readonly"
                />
              )}
            />
          </div>

          {/* Fecha de Verificación */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaVerificacion" className="block text-900 font-medium mb-2">
              Fecha de Verificación
            </label>
            <Controller
              name="fechaVerificacion"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fechaVerificacion"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showIcon
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha"
                  className={classNames({
                    "p-invalid": errors.fechaVerificacion,
                  })}
                />
              )}
            />
            {errors.fechaVerificacion && (
              <Message severity="error" text={errors.fechaVerificacion.message} />
            )}
          </div>

          {/* Observaciones */}
          <div className="col-12">
            <label htmlFor="observaciones" className="block text-900 font-medium mb-2">
              Observaciones
            </label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={3}
                  placeholder="Ingrese observaciones sobre la liquidación"
                  className={classNames({
                    "p-invalid": errors.observaciones,
                  })}
                />
              )}
            />
            {errors.observaciones && (
              <Message severity="error" text={errors.observaciones.message} />
            )}
          </div>

          {/* Información de solo lectura para edición */}
          {isEditing && (
            <>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={liquidacion.fechaCreacion ? new Date(liquidacion.fechaCreacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={liquidacion.fechaActualizacion ? new Date(liquidacion.fechaActualizacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancelar}
          />
          <Button
            type="submit"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            className="p-button-primary"
          />
        </div>
      </form>

      <Toast ref={toast} />
    </div>
  );
};

export default LiquidacionTemporadaForm;
