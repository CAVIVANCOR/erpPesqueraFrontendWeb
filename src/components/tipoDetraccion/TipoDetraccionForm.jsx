// src/components/tipoDetraccion/TipoDetraccionForm.jsx
import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";

const TipoDetraccionForm = ({
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
      nombre: "",
      tasa: 0,
      montoMinimo: null,
      activo: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultValues) {
      setValue("codigo", defaultValues.codigo || "");
      setValue("nombre", defaultValues.nombre || "");
      setValue("tasa", defaultValues.tasa ? Number(defaultValues.tasa) : 0);
      setValue("montoMinimo", defaultValues.montoMinimo ? Number(defaultValues.montoMinimo) : null);
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
    } else {
      reset({
        codigo: "",
        nombre: "",
        tasa: 0,
        montoMinimo: null,
        activo: true,
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      codigo: data.codigo.trim(),
      nombre: data.nombre.trim(),
      tasa: Number(data.tasa),
      montoMinimo: data.montoMinimo ? Number(data.montoMinimo) : null,
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
      <div className="field mt-4">
        <label
          htmlFor="codigo"
          className={classNames("font-medium", {
            "p-error": errors.codigo,
          })}
        >
          Código <span className="text-red-500">*</span>
        </label>
        <Controller
          name="codigo"
          control={control}
          rules={{
            required: "El código es requerido",
            maxLength: {
              value: 10,
              message: "Máximo 10 caracteres",
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
                maxLength={10}
                placeholder="Ej: 001, 004, 007"
              />
            </div>
          )}
        />
        {getFormErrorMessage("codigo")}
      </div>

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
              value: 200,
              message: "Máximo 200 caracteres",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-bookmark" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                maxLength={200}
                placeholder="Ej: Azúcar, Transporte de bienes"
              />
            </div>
          )}
        />
        {getFormErrorMessage("nombre")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="tasa"
          className={classNames("font-medium", {
            "p-error": errors.tasa,
          })}
        >
          Tasa (%) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="tasa"
          control={control}
          rules={{
            required: "La tasa es requerida",
            min: {
              value: 0,
              message: "La tasa debe ser mayor o igual a 0",
            },
            max: {
              value: 100,
              message: "La tasa no puede exceder 100%",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-percentage" />
              </span>
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                max={100}
                placeholder="Ej: 4.00, 10.00, 12.00"
                suffix="%"
              />
            </div>
          )}
        />
        {getFormErrorMessage("tasa")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="montoMinimo"
          className={classNames("font-medium", {
            "p-error": errors.montoMinimo,
          })}
        >
          Monto Mínimo (S/)
        </label>
        <Controller
          name="montoMinimo"
          control={control}
          rules={{
            min: {
              value: 0,
              message: "El monto mínimo debe ser mayor o igual a 0",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-money-bill" />
              </span>
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                mode="currency"
                currency="PEN"
                locale="es-PE"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="Ej: 700.00"
              />
            </div>
          )}
        />
        {getFormErrorMessage("montoMinimo")}
        <small className="p-text-secondary">
          Umbral mínimo para aplicar detracción. Dejar vacío si no aplica.
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

export default TipoDetraccionForm;