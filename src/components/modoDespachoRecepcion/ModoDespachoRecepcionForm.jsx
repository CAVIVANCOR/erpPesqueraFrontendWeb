/**
 * Formulario para gestión de Modos de Despacho y Recepción
 * Adaptado al modelo backend: nombre (único), descripcion, activo
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .trim(),
  descripcion: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  activo: yup
    .boolean()
    .default(true),
});

const ModoDespachoRecepcionForm = ({ modoDespachoRecepcion, onGuardar, onCancelar, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!modoDespachoRecepcion;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  useEffect(() => {
    if (modoDespachoRecepcion) {
      setValue("nombre", modoDespachoRecepcion.nombre || "");
      setValue("descripcion", modoDespachoRecepcion.descripcion || "");
      setValue("activo", modoDespachoRecepcion.activo !== undefined ? modoDespachoRecepcion.activo : true);
    } else {
      reset({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [modoDespachoRecepcion, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const datosNormalizados = {
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        activo: data.activo,
      };
      
      onGuardar(datosNormalizados);
    } catch (error) {
      console.error("Error al guardar modo de despacho/recepción:", error);
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
      <div className="p-grid p-formgrid">
        {/* Campo Nombre */}
        <div className="p-col-12 p-field">
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
                placeholder="Ingrese el nombre"
                className={getFieldClass("nombre")}
                style={{ textTransform: 'uppercase' }}
                autoFocus
                disabled={readOnly}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error p-d-block">{errors.nombre.message}</small>
          )}
        </div>

        {/* Campo Descripción */}
        <div className="p-col-12 p-field">
          <label htmlFor="descripcion" className="p-d-block">
            Descripción
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputText
                id="descripcion"
                {...field}
                placeholder="Descripción del modo de despacho/recepción (opcional)"
                className={getFieldClass("descripcion")}
                style={{ textTransform: 'uppercase' }}
                disabled={readOnly}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">{errors.descripcion.message}</small>
          )}
        </div>

        {/* Campo Activo */}
        <div className="p-col-12 p-field">
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("activo")}
                  disabled={readOnly}
                />
                <label htmlFor="activo" className="p-checkbox-label">
                  Modo de despacho/recepción activo
                </label>
              </div>
            )}
          />
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
          disabled={readOnly}
        />
      </div>
    </form>
  );
};

export default ModoDespachoRecepcionForm;