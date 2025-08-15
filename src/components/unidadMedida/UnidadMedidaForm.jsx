/**
 * Formulario profesional para UnidadMedida
 * Implementa el patrón estándar ERP Megui con React Hook Form, Yup, normalización y validaciones.
 * Modelo Prisma: id, nombre (VarChar 60), simbolo (VarChar 20), factorConversion, esMedidaMetrica, productos[]
 * Patrón aplicado: Validaciones robustas, normalización de datos, feedback visual, campos en mayúsculas.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import {
  crearUnidadMedida,
  actualizarUnidadMedida,
} from "../../api/unidadMedida";

/**
 * Esquema de validación Yup para UnidadMedida
 * Validaciones robustas según modelo Prisma ajustado
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(60, "El nombre no puede exceder 60 caracteres")
    .trim(),
  simbolo: yup
    .string()
    .required("El símbolo es obligatorio")
    .max(20, "El símbolo no puede exceder 20 caracteres")
    .trim(),
  factorConversion: yup
    .number()
    .nullable()
    .min(0, "El factor de conversión debe ser mayor o igual a 0")
    .max(999999.9999, "El factor de conversión es demasiado grande"),
  esMedidaMetrica: yup.boolean().default(false),
});

/**
 * Componente UnidadMedidaForm
 * Formulario profesional para crear/editar unidades de medida
 * Patrón aplicado: React Hook Form + Yup, normalización, validaciones, feedback visual
 */
const UnidadMedidaForm = ({ unidadMedida, onSave, onCancel, toast }) => {
  const modoEdicion = !!unidadMedida?.id;

  // Configuración de React Hook Form con Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: "",
      simbolo: "",
      factorConversion: null,
      esMedidaMetrica: false,
    },
  });

  /**
   * Efecto para cargar datos en modo edición
   */
  useEffect(() => {
    if (modoEdicion && unidadMedida) {
      // Normalizar datos según regla ERP Megui
      const datosNormalizados = {
        nombre: unidadMedida.nombre || "",
        simbolo: unidadMedida.simbolo || "",
        factorConversion: unidadMedida.factorConversion 
          ? Number(unidadMedida.factorConversion) 
          : null,
        esMedidaMetrica: Boolean(unidadMedida.esMedidaMetrica),
      };

      reset(datosNormalizados);
    } else {
      // Resetear formulario para nuevo registro
      reset({
        nombre: "",
        simbolo: "",
        factorConversion: null,
        esMedidaMetrica: false,
      });
    }
  }, [unidadMedida, modoEdicion, reset]);

  /**
   * Normaliza los datos antes del envío
   * Aplica reglas de negocio y transformaciones necesarias
   */
  const normalizarDatos = (datos) => {
    return {
      nombre: datos.nombre.trim().toUpperCase(),
      simbolo: datos.simbolo.trim().toUpperCase(),
      factorConversion: datos.factorConversion || null,
      esMedidaMetrica: Boolean(datos.esMedidaMetrica),
    };
  };

  /**
   * Maneja el envío del formulario
   * Incluye normalización, validación y llamadas a la API
   */
  const onSubmit = async (datos) => {
    try {
      const datosNormalizados = normalizarDatos(datos);

      let response;
      if (modoEdicion) {
        response = await actualizarUnidadMedida(unidadMedida.id, datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Unidad de medida "${datosNormalizados.nombre}" actualizada correctamente`,
        });
      } else {
        response = await crearUnidadMedida(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `Unidad de medida "${datosNormalizados.nombre}" creada correctamente`,
        });
      }

      onSave(response);
    } catch (error) {
      console.error("Error al guardar unidad de medida:", error);
      
      // Manejo de errores específicos
      let mensajeError = "Error al guardar la unidad de medida";
      if (error.response?.status === 409) {
        mensajeError = "Ya existe una unidad de medida con ese nombre o símbolo";
      } else if (error.response?.status === 400) {
        mensajeError = "Datos inválidos. Verifique la información ingresada";
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    }
  };

  /**
   * Renderiza el mensaje de error para un campo específico
   */
  const renderError = (fieldName) => {
    const error = errors[fieldName];
    return error ? (
      <Message severity="error" text={error.message} className="p-mt-1" />
    ) : null;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Nombre */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="nombre" className="font-semibold">
              Nombre *
            </label>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="nombre"
                  placeholder="Ingrese el nombre de la unidad"
                  className={errors.nombre ? "p-invalid" : ""}
                  disabled={isSubmitting}
                  maxLength={60}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
            {renderError("nombre")}
          </div>
        </div>

        {/* Símbolo */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="simbolo" className="font-semibold">
              Símbolo *
            </label>
            <Controller
              name="simbolo"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="simbolo"
                  placeholder="Ej: KG, M, L"
                  className={errors.simbolo ? "p-invalid" : ""}
                  disabled={isSubmitting}
                  maxLength={20}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
            {renderError("simbolo")}
          </div>
        </div>

        {/* Factor de Conversión */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="factorConversion" className="font-semibold">
              Factor de Conversión
            </label>
            <Controller
              name="factorConversion"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <InputNumber
                  {...field}
                  id="factorConversion"
                  value={value}
                  onValueChange={(e) => onChange(e.value)}
                  className={errors.factorConversion ? "p-invalid" : ""}
                  disabled={isSubmitting}
                  mode="decimal"
                  minFractionDigits={0}
                  maxFractionDigits={6}
                  min={0}
                  max={999999.999999}
                  showButtons={false}
                  locale="es-PE"
                  useGrouping={false}
                />
              )}
            />
            {renderError("factorConversion")}
          </div>
        </div>

        {/* Es Medida Métrica */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-semibold">Medición Metrica</label>
            <div className="flex align-items-center mt-2">
              <Controller
                name="esMedidaMetrica"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    {...field}
                    inputId="esMedidaMetrica"
                    checked={field.value}
                    disabled={isSubmitting}
                    className="mr-2"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancel}
            raised
            size='small'
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            label={modoEdicion ? "Actualizar" : "Crear"}
            icon={modoEdicion ? "pi pi-save" : "pi pi-plus"}
            className="p-button-success"
            raised
            size='small'
            loading={isSubmitting}
          />
      </div>
    </form>
  );
};

export default UnidadMedidaForm;
