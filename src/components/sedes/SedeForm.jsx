// src/components/sedes/SedeForm.jsx
// Formulario modular y reutilizable para alta y edición de sedes de empresa en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
// Documentado en español técnico.

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";

// Esquema de validación profesional con Yup alineado al modelo SedesEmpresa de Prisma
const schema = Yup.object().shape({
  empresaId: Yup.number()
    .typeError("La empresa es obligatoria")
    .required("La empresa es obligatoria"),
  nombre: Yup.string().required("El nombre de la sede es obligatorio"),
  direccion: Yup.string(),
  telefono: Yup.string(),
  email: Yup.string().email("Debe ser un email válido"),
  cesado: Yup.boolean(),
});

/**
 * Formulario modular de sede de empresa.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 * @param {Array} props.empresas Lista de empresas para el combo
 */
export default function SedeForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  empresas = [],
  readOnly = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    control,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...defaultValues, cesado: defaultValues.cesado ?? false },
  });

  // Reset al abrir en modo edición o alta
  useEffect(() => {
    reset({ ...defaultValues, cesado: defaultValues.cesado ?? false });
  }, [defaultValues, isEdit, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="empresaId">Empresa*</label>
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="empresaId"
                value={field.value}
                options={empresas}
                optionLabel="razonSocial"
                optionValue="id"
                placeholder="Seleccione una empresa"
                className={errors.empresaId ? "p-invalid" : ""}
                // Corrige bug de selección: si el valor es vacío, asigna null; si no, convierte a número
                onChange={(e) =>
                  field.onChange(e.value === "" ? null : Number(e.value))
                }
                disabled={readOnly || loading || isSubmitting}
                style={{fontWeight:"bold"}}
              />
            )}
          />
          {errors.empresaId && (
            <small className="p-error">{errors.empresaId.message}</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="nombre">Nombre*</label>
          <InputText
            id="nombre"
            {...register("nombre")}
            className={errors.nombre ? "p-invalid" : ""}
            autoFocus
            disabled={readOnly}
            style={{fontWeight:"bold"}}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="direccion">Dirección</label>
          <InputText
            id="direccion"
            {...register("direccion")}
            className={errors.direccion ? "p-invalid" : ""}
            disabled={readOnly}
            style={{fontWeight:"bold"}}
          />
        </div>
        <div className="field">
          <label htmlFor="telefono">Teléfono</label>
          <InputText
            id="telefono"
            {...register("telefono")}
            className={errors.telefono ? "p-invalid" : ""}
            disabled={readOnly}
            style={{fontWeight:"bold"}}
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            {...register("email")}
            className={errors.email ? "p-invalid" : ""}
            disabled={readOnly}
            style={{fontWeight:"bold"}}
          />
          {errors.email && (
            <small className="p-error">{errors.email.message}</small>
          )}
        </div>
        <div className="field">
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
                disabled={readOnly || loading || isSubmitting}
                style={{ width: "100%" }}
              />
            )}
          />
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
            disabled={loading || isSubmitting}
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
            loading={loading || isSubmitting}
            disabled={readOnly || loading || isSubmitting}
            className="p-button-success"
            severity="success"
            raised
            size="small"
            outlined
          />
        </div>
      </div>
    </form>
  );
}
