// src/components/tipoContrato/TipoContratoForm.jsx
// Formulario profesional para alta y edición de TipoContrato en el ERP Megui.
// Usa react-hook-form y validación Yup. Documentado en español técnico.

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Controller } from "react-hook-form";
// Esquema de validación profesional
const schema = Yup.object().shape({
  codigo: Yup.string()
    .required("El código es obligatorio")
    .max(10, "Máx 10 caracteres"),
  nombre: Yup.string()
    .required("El nombre es obligatorio")
    .max(60, "Máx 60 caracteres"),
  cesado: Yup.boolean(),
});

/**
 * Formulario desacoplado para alta/edición de TipoContrato
 * Recibe props: isEdit, defaultValues, onSubmit, onCancel, loading
 */
export default function TipoContratoForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || { codigo: "", nombre: "", cesado: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 3 }}>
          <label htmlFor="nombre">Nombre *</label>
          <InputText
            id="nombre"
            {...register("nombre")}
            className={errors.nombre ? "p-invalid" : ""}
            disabled={readOnly || loading}
            style={{ width: "100%", fontWeight: "bold" }}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 18,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="codigo">Código *</label>
          <InputText
            id="codigo"
            {...register("codigo")}
            className={errors.codigo ? "p-invalid" : ""}
            autoFocus
            maxLength={10}
            disabled={readOnly || loading}
            style={{ fontWeight: "bold" }}
          />
          {errors.codigo && (
            <small className="p-error">{errors.codigo.message}</small>
          )}
        </div>
        <div style={{ flex: 1 }}>
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
                disabled={readOnly || loading}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            )}
          />
        </div>
      </div>
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
          label={isEdit ? "Actualizar" : "Guardar"}
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
