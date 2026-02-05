// src/components/unidadNegocio/UnidadNegocioForm.jsx
// Formulario profesional para alta y edición de UnidadNegocio en el ERP Megui.
// Usa react-hook-form y validación Yup. Documentado en español técnico.

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { ColorPicker } from "primereact/colorpicker";

// Esquema de validación profesional
const schema = Yup.object().shape({
  nombre: Yup.string()
    .required("El nombre es obligatorio")
    .max(100, "Máx 100 caracteres"),
  icono: Yup.string()
    .max(50, "Máx 50 caracteres")
    .nullable(),
  color: Yup.string()
    .max(20, "Máx 20 caracteres")
    .nullable(),
  orden: Yup.number()
    .min(0, "El orden debe ser mayor o igual a 0")
    .required("El orden es obligatorio"),
  activo: Yup.boolean(),
});

/**
 * Formulario desacoplado para alta/edición de UnidadNegocio
 * Recibe props: isEdit, defaultValues, onSubmit, onCancel, loading, readOnly
 */
export default function UnidadNegocioForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || { 
      nombre: "", 
      icono: "", 
      color: "#3B82F6",
      orden: 0,
      activo: true 
    },
  });

  const activo = watch("activo");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="nombre">Nombre *</label>
        <InputText
          id="nombre"
          {...register("nombre")}
          className={errors.nombre ? "p-invalid" : ""}
          autoFocus
          maxLength={100}
          disabled={readOnly}
          style={{ fontWeight: "bold", width: "100%" }}
        />
        {errors.nombre && (
          <small className="p-error">{errors.nombre.message}</small>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="icono">Icono (PrimeIcons)</label>
        <InputText
          id="icono"
          {...register("icono")}
          className={errors.icono ? "p-invalid" : ""}
          maxLength={50}
          disabled={readOnly}
          placeholder="pi pi-briefcase"
          style={{ width: "100%" }}
        />
        {errors.icono && (
          <small className="p-error">{errors.icono.message}</small>
        )}
        <small className="p-text-secondary">
          Ejemplo: pi pi-briefcase, pi pi-building, pi pi-chart-line
        </small>
      </div>

      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="color">Color</label>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ColorPicker
                value={field.value?.replace("#", "") || "3B82F6"}
                onChange={(e) => field.onChange(`#${e.value}`)}
                disabled={readOnly}
              />
              <InputText
                value={field.value || "#3B82F6"}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={readOnly}
                style={{ width: 120 }}
              />
            </div>
          )}
        />
        {errors.color && (
          <small className="p-error">{errors.color.message}</small>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="orden">Orden de visualización *</label>
        <Controller
          name="orden"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="orden"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              disabled={readOnly}
              min={0}
              showButtons
              style={{ width: "100%" }}
            />
          )}
        />
        {errors.orden && (
          <small className="p-error">{errors.orden.message}</small>
        )}
      </div>

      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="activo">Estado</label>
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "ACTIVO" : "INACTIVO"}
              className={field.value ? "p-button-success" : "p-button-danger"}
              icon={field.value ? "pi pi-check-circle" : "pi pi-times-circle"}
              onClick={() => !readOnly && field.onChange(!field.value)}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Registrar"}
          icon="pi pi-save"
          loading={loading}
          disabled={readOnly || loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
}