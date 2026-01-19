import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { createMedioPago, updateMedioPago } from "../../api/medioPago";

const esquemaValidacion = yup.object().shape({
  codigo: yup
    .string()
    .required("El código es obligatorio")
    .max(20, "El código no puede exceder 20 caracteres")
    .trim(),
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  requiereBanco: yup.boolean().default(false),
  requiereNumOperacion: yup.boolean().default(false),
  activo: yup.boolean().default(true),
});

const MedioPagoForm = ({ medioPago, onGuardar, onCancelar, onError, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!medioPago;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      codigo: "",
      nombre: "",
      requiereBanco: false,
      requiereNumOperacion: false,
      activo: true,
    },
  });

  useEffect(() => {
    if (medioPago) {
      setValue("codigo", medioPago.codigo || "");
      setValue("nombre", medioPago.nombre || "");
      setValue("requiereBanco", medioPago.requiereBanco || false);
      setValue("requiereNumOperacion", medioPago.requiereNumOperacion || false);
      setValue("activo", medioPago.activo !== undefined ? medioPago.activo : true);
    } else {
      reset({
        codigo: "",
        nombre: "",
        requiereBanco: false,
        requiereNumOperacion: false,
        activo: true,
      });
    }
  }, [medioPago, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const datosNormalizados = {
        codigo: data.codigo.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
        requiereBanco: Boolean(data.requiereBanco),
        requiereNumOperacion: Boolean(data.requiereNumOperacion),
        activo: Boolean(data.activo),
      };

      if (esEdicion) {
        await updateMedioPago(medioPago.id, datosNormalizados);
      } else {
        await createMedioPago(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar medio de pago:", error);
      const mensajeError = error.response?.data?.message || error.response?.data?.error || "Error al guardar medio de pago";
      if (onError) {
        onError(mensajeError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-fluid">
        <div className="p-field" style={{ marginBottom: "1rem" }}>
          <label htmlFor="codigo">
            Código <span style={{ color: "red" }}>*</span>
          </label>
          <Controller
            name="codigo"
            control={control}
            render={({ field }) => (
              <InputText
                id="codigo"
                {...field}
                disabled={readOnly}
                className={getFieldClass("codigo")}
                maxLength={20}
              />
            )}
          />
          {errors.codigo && (
            <small className="p-error">{errors.codigo.message}</small>
          )}
        </div>

        <div className="p-field" style={{ marginBottom: "1rem" }}>
          <label htmlFor="nombre">
            Nombre <span style={{ color: "red" }}>*</span>
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                {...field}
                disabled={readOnly}
                className={getFieldClass("nombre")}
                maxLength={100}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        <div className="p-field-checkbox" style={{ marginBottom: "1rem" }}>
          <Controller
            name="requiereBanco"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center">
                <Checkbox
                  inputId="requiereBanco"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={readOnly}
                />
                <label htmlFor="requiereBanco" className="ml-2">
                  Requiere Banco
                </label>
              </div>
            )}
          />
        </div>

        <div className="p-field-checkbox" style={{ marginBottom: "1rem" }}>
          <Controller
            name="requiereNumOperacion"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center">
                <Checkbox
                  inputId="requiereNumOperacion"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={readOnly}
                />
                <label htmlFor="requiereNumOperacion" className="ml-2">
                  Requiere Número de Operación
                </label>
              </div>
            )}
          />
        </div>

        <div className="p-field-checkbox" style={{ marginBottom: "1rem" }}>
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center">
                <Checkbox
                  inputId="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={readOnly}
                />
                <label htmlFor="activo" className="ml-2">
                  Activo
                </label>
              </div>
            )}
          />
        </div>

        {!readOnly && (
          <div className="flex justify-content-end gap-2" style={{ marginTop: "1.5rem" }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              type="button"
              onClick={onCancelar}
              className="p-button-text"
              disabled={loading}
            />
            <Button
              label={esEdicion ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              type="submit"
              loading={loading}
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default MedioPagoForm;