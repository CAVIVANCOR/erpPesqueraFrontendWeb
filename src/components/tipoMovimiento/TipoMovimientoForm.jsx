/**
 * Formulario para gestión de Tipos de Movimiento
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: nombre (obligatorio), descripción (opcional), activo (checkbox)
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
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import {
  crearTipoMovimiento,
  actualizarTipoMovimiento,
} from "../../api/tipoMovimiento";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  descripcion: yup
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .nullable(),
  activo: yup.boolean().default(true),
});

const TipoMovimientoForm = ({ tipoMovimiento, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!tipoMovimiento;

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
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (tipoMovimiento) {
      setValue("nombre", tipoMovimiento.nombre || "");
      setValue("descripcion", tipoMovimiento.descripcion || "");
      setValue(
        "activo",
        tipoMovimiento.activo !== undefined ? tipoMovimiento.activo : true
      );
    } else {
      reset({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [tipoMovimiento, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo),
      };

      if (esEdicion) {
        await actualizarTipoMovimiento(tipoMovimiento.id, datosNormalizados);
      } else {
        await crearTipoMovimiento(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar tipo de movimiento:", error);
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
                placeholder="Ingrese el nombre del tipo de movimiento"
                className={getFieldClass("nombre")}
                maxLength={100}
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
              <InputTextarea
                id="descripcion"
                {...field}
                placeholder="Ingrese una descripción opcional"
                rows={3}
                className={getFieldClass("descripcion")}
                maxLength={500}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">
              {errors.descripcion.message}
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

export default TipoMovimientoForm;
