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
const MonedaForm = ({ moneda, onSave, onCancel, toast }) => {
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
    const cargarDatos = async () => {
      if (!isEdit) return;

      try {
        setLoading(true);
        const data = await getMonedas(moneda.id);

        // Actualizar valores del formulario
        Object.keys(data).forEach((key) => {
          if (data[key] !== undefined) {
            setValue(key, data[key]);
          }
        });
      } catch (error) {
        console.error("Error al cargar la moneda:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar los datos de la moneda",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [isEdit, moneda?.id, setValue, toast]);

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
        resultado = await actualizarMoneda(
          moneda.id,
          datosNormalizados
        );
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
                disabled={loading}
                maxLength={10}
                placeholder="Ej: PEN, USD"
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
                disabled={loading}
                maxLength={100}
                placeholder="Ej: Nuevo Sol, Dólar Americano"
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
                disabled={loading}
                maxLength={10}
                placeholder="Ej: S/, $"
              />
            </div>
          )}
        />
        {getFormErrorMessage("simbolo")}
      </div>

      <div className="field-checkbox mt-4 mb-6">
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Checkbox
              inputId="activo"
              inputRef={field.ref}
              checked={field.value}
              onChange={(e) => field.onChange(e.checked)}
              disabled={loading}
            />
          )}
        />
        <label htmlFor="activo" className="ml-2 font-medium">
          Activo
        </label>
      </div>

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={loading}
        />
      </div>
    </form>
  );
};

export default MonedaForm;
