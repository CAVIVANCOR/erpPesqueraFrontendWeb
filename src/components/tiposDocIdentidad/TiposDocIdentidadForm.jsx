// src/components/tiposDocIdentidad/TiposDocIdentidadForm.jsx
// Formulario profesional para alta y edición de TiposDocIdentidad en el ERP Megui.
// Usa react-hook-form y validación Yup. Documentado en español técnico.

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

// Esquema de validación profesional
const schema = Yup.object().shape({
  codigo: Yup.string()
    .required("El código es obligatorio")
    .max(10, "Máx 10 caracteres"),
  codSunat: Yup.string()
    .required("El código SUNAT es obligatorio")
    .max(5, "Máx 5 caracteres"),
  nombre: Yup.string()
    .required("El nombre es obligatorio")
    .max(100, "Máx 100 caracteres"),
  cesado: Yup.boolean(),
});

/**
 * Formulario desacoplado para alta/edición de TiposDocIdentidad
 * Recibe props: isEdit, defaultValues, onSubmit, onCancel, loading, readOnly
 */
export default function TiposDocIdentidadForm({
  isEdit = false,
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || {
      codigo: "",
      codSunat: "",
      nombre: "",
      cesado: false,
    },
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
        <div style={{ flex: 1 }}>
          <label htmlFor="nombre">Nombre *</label>
          <InputText
            id="nombre"
            {...register("nombre")}
            className={errors.nombre ? "p-invalid" : ""}
            maxLength={100}
            disabled={readOnly || loading}
            style={{ fontWeight: "bold" }}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "end",
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
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
          {errors.codigo && (
            <small className="p-error">{errors.codigo.message}</small>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="codSunat">Código SUNAT *</label>
          <InputText
            id="codSunat"
            {...register("codSunat")}
            className={errors.codSunat ? "p-invalid" : ""}
            maxLength={5}
            disabled={readOnly || loading}
            style={{ fontWeight: "bold" }}
          />
          {errors.codSunat && (
            <small className="p-error">{errors.codSunat.message}</small>
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
