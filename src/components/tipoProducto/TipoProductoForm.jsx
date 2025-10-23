/**
 * Formulario para gestión de Tipos de Producto
 * Adaptado al modelo backend: nombre (único), descripcion, activo, paraCompras, paraVentas
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";

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
  activo: yup.boolean().default(true),
  paraCompras: yup.boolean().default(false),
  paraVentas: yup.boolean().default(false),
});

const TipoProductoForm = ({ tipoProducto, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!tipoProducto;

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
      paraCompras: false,
      paraVentas: false,
    },
  });

  useEffect(() => {
    if (tipoProducto) {
      setValue("nombre", tipoProducto.nombre || "");
      setValue("descripcion", tipoProducto.descripcion || "");
      setValue("activo", tipoProducto.activo !== undefined ? tipoProducto.activo : true);
      setValue("paraCompras", tipoProducto.paraCompras || false);
      setValue("paraVentas", tipoProducto.paraVentas || false);
    } else {
      reset({
        nombre: "",
        descripcion: "",
        activo: true,
        paraCompras: false,
        paraVentas: false,
      });
    }
  }, [tipoProducto, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const datosNormalizados = {
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        activo: data.activo,
        paraCompras: data.paraCompras,
        paraVentas: data.paraVentas,
      };
      
      onGuardar(datosNormalizados);
    } catch (error) {
      console.error("Error al guardar tipo de producto:", error);
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
                placeholder="Descripción del tipo de producto (opcional)"
                className={getFieldClass("descripcion")}
                style={{ textTransform: 'uppercase' }}
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
                />
                <label htmlFor="activo" className="p-checkbox-label">
                  Tipo de producto activo
                </label>
              </div>
            )}
          />
        </div>

        {/* Campo Para Compras */}
        <div className="p-col-12 p-field">
          <Controller
            name="paraCompras"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="paraCompras"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("paraCompras")}
                />
                <label htmlFor="paraCompras" className="p-checkbox-label">
                  Disponible para compras
                </label>
              </div>
            )}
          />
        </div>

        {/* Campo Para Ventas */}
        <div className="p-col-12 p-field">
          <Controller
            name="paraVentas"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="paraVentas"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("paraVentas")}
                />
                <label htmlFor="paraVentas" className="p-checkbox-label">
                  Disponible para ventas
                </label>
              </div>
            )}
          />
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

export default TipoProductoForm;