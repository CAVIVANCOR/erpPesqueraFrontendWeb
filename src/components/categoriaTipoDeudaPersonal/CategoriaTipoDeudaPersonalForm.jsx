// src/components/categoriaTipoDeudaPersonal/CategoriaTipoDeudaPersonalForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";

const CategoriaTipoDeudaPersonalForm = ({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultValues) {
      setValue("nombre", defaultValues.nombre || "");
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
    } else {
      reset({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      activo: Boolean(data.activo),
    };
    onSubmit(datosNormalizados);
  };

  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      <div className="field">
        <label
          htmlFor="nombre"
          className={classNames("font-medium", {
            "p-error": errors.nombre,
          })}
        >
          Nombre <span className="text-red-500">*</span>
        </label>
        <Controller
          name="nombre"
          control={control}
          rules={{
            required: "El nombre es requerido",
            maxLength: {
              value: 100,
              message: "Máximo 100 caracteres",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-tag" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                maxLength={100}
                placeholder="Ej: Remuneraciones, Beneficios Sociales"
              />
            </div>
          )}
        />
        {getFormErrorMessage("nombre")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="descripcion"
          className={classNames("font-medium", {
            "p-error": errors.descripcion,
          })}
        >
          Descripción
        </label>
        <Controller
          name="descripcion"
          control={control}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-align-left" />
              </span>
              <InputTextarea
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                rows={3}
                placeholder="Descripción detallada de la categoría"
              />
            </div>
          )}
        />
        {getFormErrorMessage("descripcion")}
      </div>

      <div className="field mt-4">
        <label htmlFor="activo" className="font-medium">
          Estado
        </label>
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "ACTIVO" : "INACTIVO"}
              className={field.value ? "p-button-success" : "p-button-danger"}
              icon={field.value ? "pi pi-check-circle" : "pi pi-times-circle"}
              onClick={() => field.onChange(!field.value)}
              disabled={loading}
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
          icon="pi pi-times"
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
          icon="pi pi-check"
          loading={loading}
          disabled={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
};

export default CategoriaTipoDeudaPersonalForm;