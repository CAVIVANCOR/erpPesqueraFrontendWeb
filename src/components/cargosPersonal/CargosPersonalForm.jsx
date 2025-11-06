// src/components/cargosPersonal/CargosPersonalForm.jsx
// Formulario profesional para alta y edición de CargosPersonal en el ERP Megui.
// Usa react-hook-form y validación Yup. Documentado en español técnico.

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";

// Esquema de validación profesional
const schema = Yup.object().shape({
  descripcion: Yup.string()
    .required("La descripción es obligatoria")
    .max(100, "Máx 100 caracteres"),
  cesado: Yup.boolean(),
});

/**
 * Formulario desacoplado para alta/edición de CargosPersonal
 * Recibe props: isEdit, defaultValues, onSubmit, onCancel, loading
 */
export default function CargosPersonalForm({
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
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || { descripcion: "", cesado: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="descripcion">Descripción *</label>
        <InputText
          id="descripcion"
          {...register("descripcion")}
          className={errors.descripcion ? "p-invalid" : ""}
          autoFocus
          maxLength={100}
          disabled={readOnly}
          style={{ fontWeight: "bold" }}
        />
        {errors.descripcion && (
          <small className="p-error">{errors.descripcion.message}</small>
        )}
      </div>
      <div className="p-field" style={{ marginBottom: 18 }}>
        <label htmlFor="cesado">Estado</label>
        <Controller
          name="cesado"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "CESADO" : "ACTIVO"}
              className={field.value ? "p-button-danger" : "p-button-primary"}
              icon={field.value ? "pi pi-times-circle" : "pi pi-check-circle"}
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
