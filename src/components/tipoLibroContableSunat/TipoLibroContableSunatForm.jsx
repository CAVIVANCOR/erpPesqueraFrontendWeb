import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";

const TipoLibroContableSunatForm = ({
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
      codigoSunat: "",
      descripcion: "",
      activo: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultValues) {
      setValue("codigoSunat", defaultValues.codigoSunat || "");
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
    } else {
      reset({
        codigoSunat: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      codigoSunat: data.codigoSunat.trim(),
      descripcion: data.descripcion.trim(),
      activo: data.activo,
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
      <div className="field mt-4">
        <label
          htmlFor="codigoSunat"
          className={classNames("font-medium", {
            "p-error": errors.codigoSunat,
          })}
        >
          Codigo SUNAT <span className="p-error">*</span>
        </label>
        <Controller
          name="codigoSunat"
          control={control}
          rules={{
            required: "El codigo SUNAT es obligatorio",
            maxLength: {
              value: 2,
              message: "El codigo SUNAT no puede exceder 2 caracteres",
            },
          }}
          render={({ field }) => (
            <InputText
              id="codigoSunat"
              {...field}
              maxLength={2}
              className={classNames({ "p-invalid": errors.codigoSunat })}
              disabled={isEdit}
              placeholder="Ej: 05"
            />
          )}
        />
        {getFormErrorMessage("codigoSunat")}
      </div>

      <div className="field">
        <label
          htmlFor="descripcion"
          className={classNames("font-medium", {
            "p-error": errors.descripcion,
          })}
        >
          Descripcion <span className="p-error">*</span>
        </label>
        <Controller
          name="descripcion"
          control={control}
          rules={{
            required: "La descripcion es obligatoria",
            maxLength: {
              value: 250,
              message: "La descripcion no puede exceder 250 caracteres",
            },
          }}
          render={({ field }) => (
            <InputTextarea
              id="descripcion"
              {...field}
              rows={3}
              maxLength={250}
              className={classNames({ "p-invalid": errors.descripcion })}
              placeholder="Descripcion del tipo de libro contable"
            />
          )}
        />
        {getFormErrorMessage("descripcion")}
      </div>

      <div className="field-checkbox">
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Checkbox
              inputId="activo"
              checked={field.value}
              onChange={(e) => field.onChange(e.checked)}
            />
          )}
        />
        <label htmlFor="activo" className="ml-2">
          Activo
        </label>
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
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default TipoLibroContableSunatForm;