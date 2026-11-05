// src/components/regimenLaboral/RegimenLaboralForm.jsx
import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";

const VALORES_INICIALES = {
  codigoSunat: "",
  descripcion: "",
  requiereRemype: false,
  activo: true,
};

const RegimenLaboralForm = ({ isEdit, defaultValues, onSubmit, onCancel, loading }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({ defaultValues: VALORES_INICIALES, mode: "onChange" });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setValue("codigoSunat", defaultValues.codigoSunat || "");
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("requiereRemype", Boolean(defaultValues.requiereRemype));
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
    } else {
      reset(VALORES_INICIALES);
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      codigoSunat: data.codigoSunat.trim(),
      descripcion: data.descripcion.trim(),
      requiereRemype: Boolean(data.requiereRemype),
      activo: Boolean(data.activo),
    });
  };

  const getFormErrorMessage = (name) =>
    errors[name] && <small className="p-error">{errors[name].message}</small>;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      <div className="field">
        <label htmlFor="codigoSunat" className={classNames("font-medium", { "p-error": errors.codigoSunat })}>
          Código SUNAT (PLAME) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="codigoSunat"
          control={control}
          rules={{
            required: "El código SUNAT es requerido",
            maxLength: { value: 5, message: "Máximo 5 caracteres" },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-hashtag" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                maxLength={5}
                placeholder="Ej: 01, 16, 17"
              />
            </div>
          )}
        />
        {getFormErrorMessage("codigoSunat")}
      </div>

      <div className="field mt-4">
        <label htmlFor="descripcion" className={classNames("font-medium", { "p-error": errors.descripcion })}>
          Descripción <span className="text-red-500">*</span>
        </label>
        <Controller
          name="descripcion"
          control={control}
          rules={{
            required: "La descripción es requerida",
            maxLength: { value: 100, message: "Máximo 100 caracteres" },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-briefcase" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                maxLength={100}
                placeholder="Ej: Régimen general, Microempresa"
              />
            </div>
          )}
        />
        {getFormErrorMessage("descripcion")}
      </div>

      <div className="field mt-4">
        <label htmlFor="requiereRemype" className="font-medium">
          Requiere inscripción en el REMYPE
        </label>
        <Controller
          name="requiereRemype"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "SÍ REQUIERE REMYPE" : "NO REQUIERE REMYPE"}
              className={field.value ? "p-button-warning" : "p-button-secondary"}
              icon={field.value ? "pi pi-check-circle" : "pi pi-minus-circle"}
              onClick={() => field.onChange(!field.value)}
              disabled={loading}
              style={{ width: "100%" }}
            />
          )}
        />
        <small className="text-color-secondary">
          Si la empresa no está inscrita en el REMYPE, rige el régimen general aunque esté registrada como micro o pequeña.
        </small>
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

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
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

export default RegimenLaboralForm;
