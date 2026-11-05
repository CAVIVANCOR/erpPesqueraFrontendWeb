// src/components/entidadPension/TarifaEntidadPensionForm.jsx
import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";

const VALORES_INICIALES = {
  vigenteDesde: null,
  porcentajeAporte: null,
  porcentajeSeguro: 0,
  porcentajeComisionFlujo: 0,
  porcentajeComisionMixta: 0,
  remuneracionMaximaAsegurable: null,
};

// Campos de porcentaje: [nombre, etiqueta, obligatorio]
const CAMPOS_PORCENTAJE = [
  ["porcentajeAporte", "Aporte obligatorio al fondo (%)", true],
  ["porcentajeSeguro", "Prima de seguro (%)", false],
  ["porcentajeComisionFlujo", "Comisión sobre flujo (%)", false],
  ["porcentajeComisionMixta", "Comisión mixta (%)", false],
];

const aFecha = (valor) => (valor ? new Date(valor) : null);

const TarifaEntidadPensionForm = ({ isEdit, defaultValues, onSubmit, onCancel, loading }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: VALORES_INICIALES, mode: "onChange" });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        vigenteDesde: aFecha(defaultValues.vigenteDesde),
        porcentajeAporte: defaultValues.porcentajeAporte !== undefined ? Number(defaultValues.porcentajeAporte) : null,
        porcentajeSeguro: Number(defaultValues.porcentajeSeguro ?? 0),
        porcentajeComisionFlujo: Number(defaultValues.porcentajeComisionFlujo ?? 0),
        porcentajeComisionMixta: Number(defaultValues.porcentajeComisionMixta ?? 0),
        remuneracionMaximaAsegurable:
          defaultValues.remuneracionMaximaAsegurable !== null && defaultValues.remuneracionMaximaAsegurable !== undefined
            ? Number(defaultValues.remuneracionMaximaAsegurable)
            : null,
      });
    } else {
      reset(VALORES_INICIALES);
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      // Fecha persistida: ISO de la medianoche local (nunca texto YYYY-MM-DD, que retrocede un día en Perú)
      vigenteDesde: data.vigenteDesde.toISOString(),
      porcentajeAporte: Number(data.porcentajeAporte),
      porcentajeSeguro: Number(data.porcentajeSeguro || 0),
      porcentajeComisionFlujo: Number(data.porcentajeComisionFlujo || 0),
      porcentajeComisionMixta: Number(data.porcentajeComisionMixta || 0),
      remuneracionMaximaAsegurable:
        data.remuneracionMaximaAsegurable !== null && data.remuneracionMaximaAsegurable !== undefined
          ? Number(data.remuneracionMaximaAsegurable)
          : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      <div className="field">
        <label htmlFor="vigenteDesde" className={classNames("font-medium", { "p-error": errors.vigenteDesde })}>
          Vigente desde <span className="text-red-500">*</span>
        </label>
        <Controller
          name="vigenteDesde"
          control={control}
          rules={{ required: "La fecha de inicio de vigencia es requerida" }}
          render={({ field, fieldState }) => (
            <Calendar
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              className={classNames({ "p-invalid": fieldState.error })}
              disabled={loading}
            />
          )}
        />
        {errors.vigenteDesde && <small className="p-error">{errors.vigenteDesde.message}</small>}
        <small className="text-color-secondary">
          Al guardar, la tarifa abierta anterior se cierra automáticamente el día previo a esta fecha.
        </small>
      </div>

      {CAMPOS_PORCENTAJE.map(([nombre, etiqueta, obligatorio]) => (
        <div className="field mt-3" key={nombre}>
          <label htmlFor={nombre} className={classNames("font-medium", { "p-error": errors[nombre] })}>
            {etiqueta} {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <Controller
            name={nombre}
            control={control}
            rules={{
              ...(obligatorio && { required: "Este porcentaje es requerido" }),
              min: { value: 0, message: "No puede ser negativo" },
              max: { value: 100, message: "No puede superar 100" },
            }}
            render={({ field, fieldState }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                min={0}
                max={100}
                suffix=" %"
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
              />
            )}
          />
          {errors[nombre] && <small className="p-error">{errors[nombre].message}</small>}
        </div>
      ))}

      <div className="field mt-3">
        <label htmlFor="remuneracionMaximaAsegurable" className="font-medium">
          Remuneración máxima asegurable (S/)
        </label>
        <Controller
          name="remuneracionMaximaAsegurable"
          control={control}
          render={({ field }) => (
            <InputNumber
              id={field.name}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              min={0}
              disabled={loading}
            />
          )}
        />
        <small className="text-color-secondary">Tope sobre el que se calcula la prima de seguro. Vacío = sin tope.</small>
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

export default TarifaEntidadPensionForm;
