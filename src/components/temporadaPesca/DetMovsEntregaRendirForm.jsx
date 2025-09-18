/**
 * DetMovsEntregaRendirForm.jsx
 *
 * Formulario para crear y editar registros de DetMovsEntregaRendir.
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
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";

const DetMovsEntregaRendirForm = ({
  movimiento = null,
  entregaARendirId,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
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
      entregaARendirId: entregaARendirId || null,
      responsableId: null,
      fechaMovimiento: new Date(),
      tipoMovimientoId: null,
      monto: 0,
      descripcion: "",
      centroCostoId: null,
    },
  });

  // Cargar datos del registro en edición
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
        monto: Number(movimiento.monto) || 0,
        descripcion: movimiento.descripcion || "",
        centroCostoId: movimiento.centroCostoId
          ? Number(movimiento.centroCostoId)
          : null,
      });
    } else {
      // Para nuevo registro, establecer entregaARendirId
      setValue("entregaARendirId", Number(entregaARendirId));
      setValue("fechaMovimiento", new Date());
    }
  }, [movimiento, isEditing, entregaARendirId, reset, setValue]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: cc.Codigo + " - " + cc.Nombre || "N/A",
    value: Number(cc.id),
  }));

  const tipoMovimientoOptions = tiposMovimiento.map((tm) => ({
    label: tm.nombre || "N/A",
    value: Number(tm.id),
  }));

  // Función para manejar el envío del formulario
  const onSubmit = async (data, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    try {
      // Validaciones de negocio
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        ...data,
        entregaARendirId: Number(data.entregaARendirId),
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        tipoMovimientoId: data.tipoMovimientoId
          ? Number(data.tipoMovimientoId)
          : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto),
        fechaMovimiento: data.fechaMovimiento,
        descripcion: data.descripcion ? data.descripcion.toUpperCase() : null,
        actualizadoEn: new Date(),
      };

      if (!isEditing) {
        datosNormalizados.creadoEn = new Date();
      }

      // Pasar los datos al componente padre para que maneje la operación
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

  return (
    <div className="p-fluid">
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
                movimiento?.creadoEn
                  ? new Date(movimiento.creadoEn).toLocaleString("es-PE")
                  : ""
              }
              readOnly
              className="p-inputtext-sm"
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* Fecha del Movimiento */}
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
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccione fecha"
                  className={classNames({
                    "p-invalid": errors.fechaMovimiento,
                  })}
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.fechaMovimiento && (
              <Message severity="error" text={errors.fechaMovimiento.message} />
            )}
          </div>

          <div style={{ flex: 2 }}>
            {/* Responsable */}
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
                />
              )}
            />
            {errors.responsableId && (
              <Message severity="error" text={errors.responsableId.message} />
            )}
          </div>
          <div style={{ flex: 2 }}>
            {/* Tipo de Movimiento */}
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
          <div style={{ flex: 2 }}>
            {/* Centro de Costo */}
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
                />
              )}
            />
            {errors.centroCostoId && (
              <Message severity="error" text={errors.centroCostoId.message} />
            )}
          </div>

          <div style={{ flex: 3 }}>
            {/* Descripción */}
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
                />
              )}
            />
            {errors.descripcion && (
              <Message severity="error" text={errors.descripcion.message} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            {/* Monto */}
            <label htmlFor="monto" className="block text-900 font-medium mb-2">
              Monto (S/) *
            </label>
            <Controller
              name="monto"
              control={control}
              rules={{
                required: "El monto es obligatorio",
                min: { value: 0.01, message: "El monto debe ser mayor a cero" },
              }}
              render={({ field }) => (
                <InputNumber
                  id="monto"
                  value={field.value || null}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  className={classNames({
                    "p-invalid": errors.monto,
                  })}
                  inputStyle={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.monto && (
              <Message severity="error" text={errors.monto.message} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label className="block text-900 font-medium mb-2">
              Última Actualización
            </label>
            <InputText
              value={
                movimiento?.actualizadoEn
                  ? new Date(movimiento.actualizadoEn).toLocaleString("es-PE")
                  : ""
              }
              readOnly
              className="p-inputtext-sm"
            />
          </div>
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
            type="button"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            className="p-button-primary"
            onClick={handleSubmit(onSubmit)}
          />
        </div>
      </form>

      <Toast ref={toast} />
    </div>
  );
};

export default DetMovsEntregaRendirForm;
