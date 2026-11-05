// src/components/entidadPension/EntidadPensionForm.jsx
import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import PlanCuentaContableSelector from "../common/PlanCuentaContableSelector";
import EntidadComercialSelector from "../common/EntidadComercialSelector";

const VALORES_INICIALES = {
  descripcion: "",
  esOnp: false,
  entidadComercialId: null,
  cuentaPasivoEmpleadoId: null,
  cuentaPasivoObreroId: null,
  activo: true,
};

// El selector de cuentas envía 0 cuando se limpia el valor: se normaliza a null
const aIdOpcional = (valor) => (valor ? Number(valor) : null);

const EntidadPensionForm = ({ isEdit, defaultValues, onSubmit, onCancel, loading }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({ defaultValues: VALORES_INICIALES, mode: "onChange" });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("esOnp", Boolean(defaultValues.esOnp));
      setValue("entidadComercialId", defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
      setValue("cuentaPasivoEmpleadoId", defaultValues.cuentaPasivoEmpleadoId ? Number(defaultValues.cuentaPasivoEmpleadoId) : null);
      setValue("cuentaPasivoObreroId", defaultValues.cuentaPasivoObreroId ? Number(defaultValues.cuentaPasivoObreroId) : null);
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
    } else {
      reset(VALORES_INICIALES);
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      descripcion: data.descripcion.trim(),
      esOnp: Boolean(data.esOnp),
      entidadComercialId: aIdOpcional(data.entidadComercialId),
      cuentaPasivoEmpleadoId: aIdOpcional(data.cuentaPasivoEmpleadoId),
      cuentaPasivoObreroId: aIdOpcional(data.cuentaPasivoObreroId),
      activo: Boolean(data.activo),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-fluid">
      <div className="field">
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
                <i className="pi pi-building" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={loading}
                maxLength={100}
                placeholder="Ej: AFP Integra, ONP"
              />
            </div>
          )}
        />
        {errors.descripcion && <small className="p-error">{errors.descripcion.message}</small>}
      </div>

      <div className="field mt-4">
        <label htmlFor="esOnp" className="font-medium">
          Sistema de pensiones
        </label>
        <Controller
          name="esOnp"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "ONP (Sistema Nacional de Pensiones)" : "AFP (Sistema Privado de Pensiones)"}
              className={field.value ? "p-button-warning" : "p-button-info"}
              icon={field.value ? "pi pi-building-columns" : "pi pi-briefcase"}
              onClick={() => field.onChange(!field.value)}
              disabled={loading}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>

      <div className="field mt-4">
        <Controller
          name="entidadComercialId"
          control={control}
          render={({ field }) => (
            <EntidadComercialSelector
              value={field.value}
              onChange={(id) => field.onChange(id)}
              label="Entidad comercial a la que se le paga"
              placeholder="Seleccione la entidad comercial de la AFP/ONP"
              disabled={loading}
              required={false}
              permitirLimpiar
            />
          )}
        />
      </div>

      <div className="field">
        <Controller
          name="cuentaPasivoEmpleadoId"
          control={control}
          render={({ field }) => (
            <PlanCuentaContableSelector
              value={field.value ? Number(field.value) : null}
              onChange={(id) => field.onChange(id)}
              label="Cuenta por pagar - Empleados"
              placeholder="Elegir cuenta por pagar de empleados"
              disabled={loading}
              required={false}
              showClearButton={true}
            />
          )}
        />
      </div>

      <div className="field">
        <Controller
          name="cuentaPasivoObreroId"
          control={control}
          render={({ field }) => (
            <PlanCuentaContableSelector
              value={field.value ? Number(field.value) : null}
              onChange={(id) => field.onChange(id)}
              label="Cuenta por pagar - Obreros"
              placeholder="Elegir cuenta por pagar de obreros"
              disabled={loading}
              required={false}
              showClearButton={true}
            />
          )}
        />
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

export default EntidadPensionForm;
