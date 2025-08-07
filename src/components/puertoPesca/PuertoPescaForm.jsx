/**
 * Formulario para gestión de Puertos de Pesca
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: zona (obligatorio, 20 chars), nombre (obligatorio, 100 chars), provincia, departamento, latitud, longitud, activo (checkbox)
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearPuertoPesca, actualizarPuertoPesca } from "../../api/puertoPesca";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  zona: yup
    .string()
    .required("La zona es obligatoria")
    .max(20, "La zona no puede exceder 20 caracteres")
    .trim(),
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  provincia: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  departamento: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  latitud: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  longitud: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  activo: yup.boolean().default(true),
});

const PuertoPescaForm = ({ puertoPesca, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!puertoPesca;

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      zona: "",
      nombre: "",
      provincia: "",
      departamento: "",
      latitud: null,
      longitud: null,
      activo: true,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (puertoPesca) {
      setValue("zona", puertoPesca.zona || "");
      setValue("nombre", puertoPesca.nombre || "");
      setValue("provincia", puertoPesca.provincia || "");
      setValue("departamento", puertoPesca.departamento || "");
      setValue("latitud", puertoPesca.latitud || null);
      setValue("longitud", puertoPesca.longitud || null);
      setValue(
        "activo",
        puertoPesca.activo !== undefined ? puertoPesca.activo : true
      );
    } else {
      reset({
        zona: "",
        nombre: "",
        provincia: "",
        departamento: "",
        latitud: null,
        longitud: null,
        activo: true,
      });
    }
  }, [puertoPesca, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        zona: data.zona.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
        provincia: data.provincia?.trim().toUpperCase() || null,
        departamento: data.departamento?.trim().toUpperCase() || null,
        latitud: data.latitud,
        longitud: data.longitud,
        activo: Boolean(data.activo),
      };

      if (esEdicion) {
        await actualizarPuertoPesca(puertoPesca.id, datosNormalizados);
      } else {
        await crearPuertoPesca(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar puerto de pesca:", error);
      // El manejo de errores se realiza en el componente padre
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid p-formgrid">
        {/* Campo Zona */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="zona" className="p-d-block">
            Zona <span className="p-error">*</span>
          </label>
          <Controller
            name="zona"
            control={control}
            render={({ field }) => (
              <InputText
                id="zona"
                {...field}
                placeholder="Ingrese la zona del puerto"
                className={getFieldClass("zona")}
                maxLength={20}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.zona && (
            <small className="p-error p-d-block">{errors.zona.message}</small>
          )}
        </div>

        {/* Campo Nombre */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="nombre" className="p-d-block">
            Nombre <span className="p-error">*</span>
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                {...field}
                placeholder="Ingrese el nombre del puerto"
                className={getFieldClass("nombre")}
                maxLength={100}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error p-d-block">{errors.nombre.message}</small>
          )}
        </div>

        {/* Campo Provincia */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="provincia" className="p-d-block">
            Provincia
          </label>
          <Controller
            name="provincia"
            control={control}
            render={({ field }) => (
              <InputText
                id="provincia"
                {...field}
                placeholder="Ingrese la provincia"
                className={getFieldClass("provincia")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.provincia && (
            <small className="p-error p-d-block">
              {errors.provincia.message}
            </small>
          )}
        </div>

        {/* Campo Departamento */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="departamento" className="p-d-block">
            Departamento
          </label>
          <Controller
            name="departamento"
            control={control}
            render={({ field }) => (
              <InputText
                id="departamento"
                {...field}
                placeholder="Ingrese el departamento"
                className={getFieldClass("departamento")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.departamento && (
            <small className="p-error p-d-block">
              {errors.departamento.message}
            </small>
          )}
        </div>

        {/* Campo Latitud */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="latitud" className="p-d-block">
            Latitud
          </label>
          <Controller
            name="latitud"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="latitud"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Ingrese la latitud"
                className={getFieldClass("latitud")}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={8}
                min={-90}
                max={90}
              />
            )}
          />
          {errors.latitud && (
            <small className="p-error p-d-block">
              {errors.latitud.message}
            </small>
          )}
        </div>

        {/* Campo Longitud */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="longitud" className="p-d-block">
            Longitud
          </label>
          <Controller
            name="longitud"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="longitud"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                placeholder="Ingrese la longitud"
                className={getFieldClass("longitud")}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={8}
                min={-180}
                max={180}
              />
            )}
          />
          {errors.longitud && (
            <small className="p-error p-d-block">
              {errors.longitud.message}
            </small>
          )}
        </div>

        {/* Campo Activo */}
        <div className="p-col-12 p-field">
          <div className="p-field-checkbox">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("activo")}
                />
              )}
            />
            <label htmlFor="activo" className="p-checkbox-label">
              Activo
            </label>
          </div>
          {errors.activo && (
            <small className="p-error p-d-block">{errors.activo.message}</small>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancelar}
          disabled={loading}
        />
        <Button
          type="submit"
          label={esEdicion ? "Actualizar" : "Crear"}
          icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
          loading={loading}
        />
      </div>
    </form>
  );
};

export default PuertoPescaForm;
