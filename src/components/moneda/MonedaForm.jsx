/**
 * Formulario para crear/editar Monedas
 * Implementa el patrón estándar de formularios ERP Megui con validación y feedback visual.
 * Incluye manejo de estados de carga, validación en tiempo real y formato de campos.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import { getMonedas, crearMoneda, actualizarMoneda } from "../../api/moneda";

/**
 * Componente MonedaForm
 * Formulario para crear o editar una moneda
 * @param {Object} props - Propiedades del componente
 * @param {Object} [props.moneda] - Datos de la moneda a editar (opcional)
 * @param {Function} props.onSave - Función a ejecutar al guardar el formulario
 * @param {Function} props.onCancel - Función a ejecutar al cancelar
 * @param {Object} props.toast - Referencia al componente Toast para mostrar mensajes
 */
const MonedaForm = ({ moneda, onSave, onCancel, toast, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!moneda?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      codigoSunat: "",
      nombreLargo: "",
      simbolo: "",
      activo: true,
    },
    mode: "onChange",
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (moneda) {
      setValue("codigoSunat", moneda.codigoSunat || "");
      setValue("nombreLargo", moneda.nombreLargo || "");
      setValue("simbolo", moneda.simbolo || "");
      setValue("activo", moneda.activo !== undefined ? moneda.activo : true);
    } else {
      reset({
        codigoSunat: "",
        nombreLargo: "",
        simbolo: "",
        activo: true,
      });
    }
  }, [moneda, setValue, reset]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const datosNormalizados = {
        simbolo: data.simbolo.trim().toUpperCase(),
        codigoSunat: data.codigoSunat.trim(),
        nombreLargo: data.nombreLargo.trim(),
        activo: Boolean(data.activo),
      };

      let resultado;
      if (moneda?.id) {
        // Actualizar moneda existente
        resultado = await actualizarMoneda(moneda.id, datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Moneda "${datosNormalizados.nombreLargo}" actualizada correctamente`,
        });
      } else {
        // Crear nueva moneda
        resultado = await crearMoneda(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Moneda "${datosNormalizados.nombreLargo}" creada correctamente`,
        });
      }
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }
    } catch (error) {
      console.error("Error al guardar la moneda:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar la moneda",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra mensajes de error de validación
   */
  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="field">
        <label
          htmlFor="codigoSunat"
          className={classNames("font-medium", {
            "p-error": errors.codigoSunat,
          })}
        >
          Código SUNAT <span className="text-red-500">*</span>
        </label>
        <Controller
          name="codigoSunat"
          control={control}
          rules={{
            required: "El código SUNAT es requerido",
            maxLength: {
              value: 10,
              message: "Máximo 10 caracteres",
            },
            pattern: {
              value: /^[A-Z0-9]+$/,
              message: "Solo letras mayúsculas y números",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-hashtag" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={readOnly || loading}
                maxLength={10}
                placeholder="Ej: PEN, USD"
                style={{ fontWeight: "bold" }}
              />
            </div>
          )}
        />
        {getFormErrorMessage("codigoSunat")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="nombreLargo"
          className={classNames("font-medium", {
            "p-error": errors.nombreLargo,
          })}
        >
          Nombre Largo
        </label>
        <Controller
          name="nombreLargo"
          control={control}
          rules={{
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
                className={classNames("w-full", {
                  "p-invalid": fieldState.error,
                })}
                disabled={readOnly || loading}
                maxLength={100}
                placeholder="Ej: Nuevo Sol, Dólar Americano"
                style={{ fontWeight: "bold" }}
              />
            </div>
          )}
        />
        {getFormErrorMessage("nombreLargo")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="simbolo"
          className={classNames("font-medium", { "p-error": errors.simbolo })}
        >
          Símbolo
        </label>
        <Controller
          name="simbolo"
          control={control}
          rules={{
            maxLength: {
              value: 10,
              message: "Máximo 10 caracteres",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-dollar" />
              </span>
              <InputText
                id={field.name}
                value={field.value || ""}
                onChange={field.onChange}
                className={classNames("w-full", {
                  "p-invalid": fieldState.error,
                })}
                disabled={readOnly || loading}
                maxLength={10}
                placeholder="Ej: S/, $"
                style={{ fontWeight: "bold" }}
              />
            </div>
          )}
        />
        {getFormErrorMessage("simbolo")}
      </div>

      <div className="p-col-12 p-field">
        <label htmlFor="activo" className="p-d-block">
          Estado
        </label>
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Button
              type="button"
              label={field.value ? "ACTIVO" : "CESADO"}
              className={field.value ? "p-button-primary" : "p-button-danger"}
              icon={field.value ? "pi pi-check-circle" : "pi pi-times-circle"}
              onClick={() => !readOnly && field.onChange(!field.value)}
              disabled={readOnly}
              style={{ width: "100%" }}
            />
          )}
        />
        {errors.activo && (
          <small className="p-error p-d-block">{errors.activo.message}</small>
        )}
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

export default MonedaForm;
