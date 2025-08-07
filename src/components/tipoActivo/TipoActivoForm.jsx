/**
 * Formulario para gestión de Tipos de Activo
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: codigo, nombre, descripcion, cesado
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearTipoActivo, actualizarTipoActivo } from "../../api/tipoActivo";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  codigo: yup
    .string()
    .required("El código es obligatorio")
    .trim(),
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
  cesado: yup
    .boolean()
    .default(false),
});

const TipoActivoForm = ({ tipoActivo, onGuardar, onCancelar }) => {
  const [loading, setLoading] = React.useState(false);
  const esEdicion = !!tipoActivo;

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
      codigo: tipoActivo?.codigo || "",
      nombre: tipoActivo?.nombre || "",
      descripcion: tipoActivo?.descripcion || "",
      cesado: tipoActivo?.cesado || false,
    },
  });

  // Efecto para resetear formulario cuando cambia tipoActivo
  React.useEffect(() => {
    if (tipoActivo) {
      setValue("codigo", tipoActivo.codigo || "");
      setValue("nombre", tipoActivo.nombre || "");
      setValue("descripcion", tipoActivo.descripcion || "");
      setValue("cesado", tipoActivo.cesado || false);
    } else {
      reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        cesado: false,
      });
    }
  }, [tipoActivo, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        codigo: data.codigo.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        cesado: data.cesado,
      };

      if (esEdicion) {
        await actualizarTipoActivo(tipoActivo.id, datosNormalizados);
      } else {
        await crearTipoActivo(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar tipo de activo:", error);
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
        {/* Campo Código */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="codigo" className="p-d-block">
            Código <span className="p-error">*</span>
          </label>
          <Controller
            name="codigo"
            control={control}
            render={({ field }) => (
              <InputText
                id="codigo"
                {...field}
                placeholder="Ingrese el código"
                className={getFieldClass("codigo")}
                style={{ textTransform: 'uppercase' }}
                autoFocus
              />
            )}
          />
          {errors.codigo && (
            <small className="p-error p-d-block">{errors.codigo.message}</small>
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
                placeholder="Ingrese el nombre"
                className={getFieldClass("nombre")}
                style={{ textTransform: 'uppercase' }}
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
                placeholder="Descripción del tipo de activo (opcional)"
                className={getFieldClass("descripcion")}
                style={{ textTransform: 'uppercase' }}
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
                  Tipo de activo cesado
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

export default TipoActivoForm;
