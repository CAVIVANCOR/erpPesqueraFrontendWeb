/**
 * MovLiquidacionTemporadaForm.jsx
 *
 * Formulario para crear y editar registros de MovLiquidacionTemporadaPesca.
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
  crearMovLiquidacionTemporadaPesca,
  actualizarMovLiquidacionTemporadaPesca,
} from "../../api/movLiquidacionTemporadaPesca";

const MovLiquidacionTemporadaForm = ({
  movimiento = null,
  liquidacionTemporadaId,
  centrosCosto = [],
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isEditing = !!movimiento;

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      liquidacionTemporadaId: liquidacionTemporadaId || null,
      fechaMovimiento: new Date(),
      tipoMovimientoId: null,
      monto: 0,
      centroCostoId: null,
      fechaRegistro: new Date(),
    },
  });

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && movimiento) {
      reset({
        liquidacionTemporadaId: Number(movimiento.liquidacionTemporadaId),
        fechaMovimiento: movimiento.fechaMovimiento ? new Date(movimiento.fechaMovimiento) : new Date(),
        tipoMovimientoId: movimiento.tipoMovimientoId ? Number(movimiento.tipoMovimientoId) : null,
        monto: Number(movimiento.monto) || 0,
        centroCostoId: movimiento.centroCostoId ? Number(movimiento.centroCostoId) : null,
        fechaRegistro: movimiento.fechaRegistro ? new Date(movimiento.fechaRegistro) : new Date(),
      });
    } else {
      // Para nuevo registro, establecer liquidacionTemporadaId
      setValue("liquidacionTemporadaId", Number(liquidacionTemporadaId));
      setValue("fechaMovimiento", new Date());
      setValue("fechaRegistro", new Date());
    }
  }, [movimiento, isEditing, liquidacionTemporadaId, reset, setValue]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: cc.descripcion || cc.nombre,
    value: Number(cc.id),
  }));

  // Tipos de movimiento predefinidos para liquidación
  const tipoMovimientoOptions = [
    { label: "Ingreso", value: 1 },
    { label: "Egreso", value: 2 },
    { label: "Ajuste", value: 3 },
    { label: "Transferencia", value: 4 },
  ];

  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    try {
      // Validaciones de negocio
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        ...data,
        liquidacionTemporadaId: Number(data.liquidacionTemporadaId),
        tipoMovimientoId: data.tipoMovimientoId ? Number(data.tipoMovimientoId) : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto),
        fechaMovimiento: data.fechaMovimiento,
        fechaRegistro: data.fechaRegistro || new Date(),
        fechaActualizacion: new Date(),
      };

      let resultado;
      if (isEditing) {
        resultado = await actualizarMovLiquidacionTemporadaPesca(movimiento.id, datosNormalizados);
      } else {
        datosNormalizados.fechaCreacion = new Date();
        resultado = await crearMovLiquidacionTemporadaPesca(datosNormalizados);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Movimiento de liquidación ${isEditing ? "actualizado" : "creado"} correctamente`,
        life: 3000,
      });

      onGuardadoExitoso?.(resultado);
    } catch (error) {
      console.error("Error al guardar movimiento de liquidación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al ${isEditing ? "actualizar" : "crear"} el movimiento de liquidación`,
        life: 3000,
      });
    }
  };

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          {/* Fecha del Movimiento */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaMovimiento" className="block text-900 font-medium mb-2">
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
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha"
                  className={classNames({
                    "p-invalid": errors.fechaMovimiento,
                  })}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <Message severity="error" text={errors.fechaMovimiento.message} />
            )}
          </div>

          {/* Tipo de Movimiento */}
          <div className="col-12 md:col-6">
            <label htmlFor="tipoMovimientoId" className="block text-900 font-medium mb-2">
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
                  showClear
                />
              )}
            />
            {errors.tipoMovimientoId && (
              <Message severity="error" text={errors.tipoMovimientoId.message} />
            )}
          </div>

          {/* Monto */}
          <div className="col-12 md:col-6">
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto (S/) *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{ 
                required: "El monto es obligatorio",
                min: { value: 0.01, message: "El monto debe ser mayor a cero" }
              }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  className={classNames({
                    "p-invalid": errors.monto,
                  })}
                />
              )}
            />
            {errors.monto && (
              <Message severity="error" text={errors.monto.message} />
            )}
          </div>

          {/* Centro de Costo */}
          <div className="col-12 md:col-6">
            <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
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
                />
              )}
            />
            {errors.centroCostoId && (
              <Message severity="error" text={errors.centroCostoId.message} />
            )}
          </div>

          {/* Fecha de Registro */}
          <div className="col-12">
            <label htmlFor="fechaRegistro" className="block text-900 font-medium mb-2">
              Fecha de Registro *
            </label>
            <Controller
              name="fechaRegistro"
              control={control}
              rules={{ required: "La fecha de registro es obligatoria" }}
              render={({ field }) => (
                <Calendar
                  id="fechaRegistro"
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  showIcon
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha y hora"
                  className={classNames({
                    "p-invalid": errors.fechaRegistro,
                  })}
                />
              )}
            />
            {errors.fechaRegistro && (
              <Message severity="error" text={errors.fechaRegistro.message} />
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
                  value={movimiento.fechaCreacion ? new Date(movimiento.fechaCreacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={movimiento.fechaActualizacion ? new Date(movimiento.fechaActualizacion).toLocaleString("es-PE") : ""}
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

export default MovLiquidacionTemporadaForm;
