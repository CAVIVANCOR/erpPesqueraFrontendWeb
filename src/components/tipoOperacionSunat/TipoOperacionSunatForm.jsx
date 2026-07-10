import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";

const TipoOperacionSunatForm = ({
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
      codigo: "",
      descripcion: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultValues) {
      setValue("codigo", defaultValues.codigo || "");
      setValue("descripcion", defaultValues.descripcion || "");
    } else {
      reset({
        codigo: "",
        descripcion: "",
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      codigo: data.codigo.trim(),
      descripcion: data.descripcion.trim(),
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
          htmlFor="codigo"
          className={classNames("font-medium", {
            "p-error": errors.codigo,
          })}
        >
          Codigo SUNAT <span className="p-error">*</span>
        </label>
        <Controller
          name="codigo"
          control={control}
          rules={{
            required: "El codigo es obligatorio",
            maxLength: {
              value: 4,
              message: "El codigo no puede exceder 4 caracteres",
            },
          }}
          render={({ field }) => (
            <InputText
              id="codigo"
              {...field}
              maxLength={4}
              className={classNames({ "p-invalid": errors.codigo })}
              disabled={isEdit}
              placeholder="Ej: 0101"
            />
          )}
        />
        {getFormErrorMessage("codigo")}
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
              placeholder="Descripcion del tipo de operacion"
            />
          )}
        />
        {getFormErrorMessage("descripcion")}
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

export default TipoOperacionSunatForm;