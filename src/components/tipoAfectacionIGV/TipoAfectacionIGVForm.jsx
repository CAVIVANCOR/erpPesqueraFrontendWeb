import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import BooleanToggleButton from "../common/BooleanToggleButton";

const CATEGORIA_OPTIONS = [
  { label: "GRAVADO", value: "GRAVADO" },
  { label: "EXONERADO", value: "EXONERADO" },
  { label: "INAFECTO", value: "INAFECTO" },
  { label: "EXPORTACION", value: "EXPORTACION" },
  { label: "GRATUITO", value: "GRATUITO" }
];

const TipoAfectacionIGVForm = ({
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
      descripcion: "",
      categoria: null,
      activo: true,
      permiteCreditoFiscal: false,
      calculaIGV: false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (defaultValues) {
      setValue("codigo", defaultValues.codigo || "");
      setValue("nombre", defaultValues.nombre || "");
      setValue("descripcion", defaultValues.descripcion || "");
      setValue("categoria", defaultValues.categoria || null);
      setValue("activo", defaultValues.activo !== undefined ? defaultValues.activo : true);
      setValue("permiteCreditoFiscal", defaultValues.permiteCreditoFiscal !== undefined ? defaultValues.permiteCreditoFiscal : false);
      setValue("calculaIGV", defaultValues.calculaIGV !== undefined ? defaultValues.calculaIGV : false);
    } else {
      reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        categoria: null,
        activo: true,
        permiteCreditoFiscal: false,
        calculaIGV: false,
      });
    }
  }, [defaultValues, setValue, reset]);

  const handleFormSubmit = (data) => {
    const datosNormalizados = {
      codigo: data.codigo.trim(),
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      categoria: data.categoria,
      activo: Boolean(data.activo),
      permiteCreditoFiscal: Boolean(data.permiteCreditoFiscal),
      calculaIGV: Boolean(data.calculaIGV),
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
          Código SUNAT <span className="p-error">*</span>
        </label>
        <Controller
          name="codigo"
          control={control}
          rules={{
            required: "El código es obligatorio",
            maxLength: {
              value: 2,
              message: "El código no puede exceder 2 caracteres",
            },
          }}
          render={({ field }) => (
            <InputText
              id="codigo"
              {...field}
              maxLength={2}
              className={classNames({ "p-invalid": errors.codigo })}
              disabled={isEdit}
              placeholder="Ej: 10"
            />
          )}
        />
        {getFormErrorMessage("codigo")}
      </div>


      <div className="field">
        <label
          htmlFor="categoria"
          className={classNames("font-medium", {
            "p-error": errors.categoria,
          })}
        >
          Categoría <span className="p-error">*</span>
        </label>
        <Controller
          name="categoria"
          control={control}
          rules={{ required: "La categoría es obligatoria" }}
          render={({ field }) => (
            <Dropdown
              id="categoria"
              {...field}
              options={CATEGORIA_OPTIONS}
              placeholder="Seleccione una categoría"
              className={classNames({ "p-invalid": errors.categoria })}
            />
          )}
        />
        {getFormErrorMessage("categoria")}
      </div>
      
      <div className="field">
        <label
          htmlFor="nombre"
          className={classNames("font-medium", {
            "p-error": errors.nombre,
          })}
        >
          Nombre <span className="p-error">*</span>
        </label>
        <Controller
          name="nombre"
          control={control}
          rules={{
            required: "El nombre es obligatorio",
            maxLength: {
              value: 150,
              message: "El nombre no puede exceder 150 caracteres",
            },
          }}
          render={({ field }) => (
            <InputText
              id="nombre"
              {...field}
              maxLength={150}
              className={classNames({ "p-invalid": errors.nombre })}
              placeholder="Ej: Gravado - Operación Onerosa"
            />
          )}
        />
        {getFormErrorMessage("nombre")}
      </div>



      <div className="field">
        <label htmlFor="descripcion" className="font-medium">
          Descripción
        </label>
        <Controller
          name="descripcion"
          control={control}
          rules={{
            maxLength: {
              value: 300,
              message: "La descripción no puede exceder 300 caracteres",
            },
          }}
          render={({ field }) => (
            <InputTextarea
              id="descripcion"
              {...field}
              rows={3}
              maxLength={300}
              className={classNames({ "p-invalid": errors.descripcion })}
              placeholder="Descripción detallada del tipo de afectación"
            />
          )}
        />
        {getFormErrorMessage("descripcion")}
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

        <div style={{ flex: 1 }}>
          <label htmlFor="permiteCreditoFiscal" className="font-medium">
            Permite Crédito Fiscal
          </label>
          <Controller
            name="permiteCreditoFiscal"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                trueLabel="Sí"
                falseLabel="No"
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="calculaIGV" className="font-medium">
            Calcula IGV
          </label>
          <Controller
            name="calculaIGV"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                trueLabel="Sí"
                falseLabel="No"
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="activo" className="font-medium">
            Estado
          </label>
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                trueLabel="Activo"
                falseLabel="Inactivo"
              />
            )}
          />
        </div>
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

export default TipoAfectacionIGVForm;