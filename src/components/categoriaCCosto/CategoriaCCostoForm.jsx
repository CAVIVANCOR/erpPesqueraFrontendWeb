// src/components/categoriaCCosto/CategoriaCCostoForm.jsx
// Formulario profesional para CategoriaCCosto. Cumple la regla transversal ERP Megui.
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";

/**
 * Formulario profesional para gestión de Categorías de Centro de Costo
 * Utiliza React Hook Form para validación y manejo de estado
 * @param {boolean} isEdit - Indica si es modo edición
 * @param {Object} defaultValues - Valores por defecto del formulario
 * @param {Function} onSubmit - Función callback para envío del formulario
 * @param {Function} onCancel - Función callback para cancelar
 * @param {boolean} loading - Estado de carga
 */
export default function CategoriaCCostoForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  // Resetear formulario cuando cambien los valores por defecto
  useEffect(() => {
    reset({
      nombre: defaultValues?.nombre || "",
      descripcion: defaultValues?.descripcion || "",
      activo:
        defaultValues?.activo !== undefined ? !!defaultValues.activo : true,
    });
  }, [defaultValues, reset]);

  const onFormSubmit = (data) => {
    // Convertir campos de texto a mayúsculas antes de enviar
    const formattedData = {
      ...data,
      nombre: data.nombre?.toUpperCase() || "",
      descripcion: data.descripcion?.toUpperCase() || "",
    };
    onSubmit(formattedData);
  };

  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-fluid">
      {/* Campo Nombre */}
      <div className="field">
        <label
          htmlFor="nombre"
          className={classNames({ "p-error": errors.nombre })}
        >
          Nombre *
        </label>
        <Controller
          name="nombre"
          control={control}
          rules={{
            required: "El nombre es requerido",
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres",
            },
            maxLength: {
              value: 50,
              message: "El nombre no puede exceder 50 caracteres",
            },
          }}
          render={({ field, fieldState }) => (
            <InputText
              id={field.name}
              {...field}
              autoFocus
              disabled={loading || readOnly}
              className={classNames({ "p-invalid": fieldState.invalid })}
              placeholder="Ingrese el nombre de la categoría"
            />
          )}
        />
        {getFormErrorMessage("nombre")}
      </div>

      {/* Campo Descripción */}
      <div className="field">
        <label htmlFor="descripcion">Descripción</label>
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id={field.name}
              {...field}
              rows={3}
              disabled={loading || readOnly}
              placeholder="Ingrese una descripción opcional"
            />
          )}
        />
      </div>

      {/* Campo Activo */}
      <div className="field-checkbox">
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Checkbox
              inputId={field.name}
              checked={field.value}
              onChange={(e) => field.onChange(e.checked)}
              disabled={loading || readOnly}
            />
          )}
        />
        <label htmlFor="activo" className="ml-2">
          Activo
        </label>
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
          icon="pi pi-times"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
          severity="danger"
          raised
          outlined
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          outlined
          size="small"
        />
      </div>
    </form>
  );
}
