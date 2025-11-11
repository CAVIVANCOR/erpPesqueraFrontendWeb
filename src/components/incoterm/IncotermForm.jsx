// src/components/incoterm/IncotermForm.jsx
// Formulario modular y reutilizable para alta y edición de Incoterms en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
// Documentado en español técnico.

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";

// Esquema de validación profesional con Yup alineado al modelo Incoterm de Prisma
const schema = Yup.object().shape({
  codigo: Yup.string()
    .required("El código es obligatorio")
    .max(10, "El código no puede exceder 10 caracteres")
    .transform((value) => value?.toUpperCase().trim() || ""),
  nombre: Yup.string()
    .required("El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .transform((value) => value?.toUpperCase().trim() || ""),
  descripcion: Yup.string()
    .nullable()
    .transform((value) => value?.toUpperCase().trim() || null),
  activo: Yup.boolean(),
});

/**
 * Formulario modular de Incoterm.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 * @param {boolean} props.readOnly Solo lectura
 */
export default function IncotermForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  // Extrae 'control' para uso con Controller
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...defaultValues, activo: defaultValues.activo ?? true },
  });

  // Reset al abrir en modo edición o alta
  useEffect(() => {
    reset({ ...defaultValues, activo: defaultValues.activo ?? true });
  }, [defaultValues, isEdit, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-fluid">
        {/* CÓDIGO - Obligatorio, max 10 caracteres */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 24,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="codigo">Código *</label>
            <InputText
              id="codigo"
              {...register("codigo", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              className={errors.codigo ? "p-invalid" : ""}
              autoFocus
              disabled={readOnly || loading}
              maxLength={10}
              placeholder="Ej: FOB, CIF, DDP"
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
            {errors.codigo && (
              <small className="p-error">{errors.codigo.message}</small>
            )}
          </div>

          {/* NOMBRE - Obligatorio, max 100 caracteres */}
          <div style={{ flex: 2 }}>
            <label htmlFor="nombre">Nombre *</label>
            <InputText
              id="nombre"
              {...register("nombre", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              className={errors.nombre ? "p-invalid" : ""}
              disabled={readOnly || loading}
              maxLength={100}
              placeholder="Ej: FREE ON BOARD"
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
            {errors.nombre && (
              <small className="p-error">{errors.nombre.message}</small>
            )}
          </div>
        </div>

        {/* DESCRIPCIÓN - Opcional, texto largo */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 24,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="descripcion">Descripción</label>
            <InputTextarea
              id="descripcion"
              {...register("descripcion", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              className={errors.descripcion ? "p-invalid" : ""}
              disabled={readOnly || loading}
              rows={3}
              placeholder="DESCRIPCIÓN DETALLADA DEL INCOTERM"
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>

        {/* ACTIVO - Botón toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 24,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 0.5 }}>
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Button
                  type="button"
                  label={field.value ? "ACTIVO" : "INACTIVO"}
                  className={
                    field.value ? "p-button-primary" : "p-button-danger"
                  }
                  onClick={() => field.onChange(!field.value)}
                  disabled={readOnly || loading}
                  style={{ width: "100%" }}
                />
              )}
            />
          </div>
        </div>

        {/* BOTONES */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Button
            type="button"
            label="Cancelar"
            onClick={onCancel}
            disabled={loading || isSubmitting}
            className="p-button-warning"
            severity="warning"
            raised
            outlined
            size="small"
          />
          <Button
            type="submit"
            label={isEdit ? "Actualizar" : "Registrar"}
            icon="pi pi-save"
            loading={loading || isSubmitting}
            disabled={readOnly || loading || isSubmitting}
            className="p-button-success"
            severity="success"
            raised
            outlined
            size="small"
          />
        </div>
      </div>
    </form>
  );
}
