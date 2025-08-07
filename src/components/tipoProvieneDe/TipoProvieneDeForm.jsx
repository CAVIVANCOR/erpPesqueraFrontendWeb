/**
 * Formulario para gestión de Tipos Proviene De
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: descripcion, cesado
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
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearTipoProvieneDe, actualizarTipoProvieneDe } from "../../api/tipoProvieneDe";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  descripcion: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cesado: yup
    .boolean()
    .default(false),
});

const TipoProvieneDeForm = ({ tipoProvieneDe, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!tipoProvieneDe;

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
      descripcion: "",
      cesado: false,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (tipoProvieneDe) {
      setValue("descripcion", tipoProvieneDe.descripcion || "");
      setValue("cesado", tipoProvieneDe.cesado || false);
    } else {
      reset({
        descripcion: "",
        cesado: false,
      });
    }
  }, [tipoProvieneDe, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        cesado: data.cesado,
      };

      if (esEdicion) {
        await actualizarTipoProvieneDe(tipoProvieneDe.id, datosNormalizados);
      } else {
        await crearTipoProvieneDe(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar tipo proviene de:", error);
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
                placeholder="Descripción del tipo proviene de (opcional)"
                className={getFieldClass("descripcion")}
                style={{ textTransform: 'uppercase' }}
                autoFocus
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">{errors.descripcion.message}</small>
          )}
        </div>

        {/* Campo Cesado */}
        <div className="p-col-12 p-field">
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="cesado"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("cesado")}
                />
                <label htmlFor="cesado" className="p-checkbox-label">
                  Tipo proviene de cesado
                </label>
              </div>
            )}
          />
          {errors.cesado && (
            <small className="p-error p-d-block">{errors.cesado.message}</small>
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

export default TipoProvieneDeForm;
