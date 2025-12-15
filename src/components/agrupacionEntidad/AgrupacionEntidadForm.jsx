/**
 * Formulario para gestión de Agrupaciones de Entidad
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: nombre, descripcion, esCliente, esProveedor
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 * - REGLA CRÍTICA: Solo el formulario graba, nunca el componente padre
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
import { crearAgrupacionEntidad, actualizarAgrupacionEntidad } from "../../api/agrupacionEntidad";

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
  esCliente: yup
    .boolean()
    .default(false),
  esProveedor: yup
    .boolean()
    .default(false),
});

const AgrupacionEntidadForm = ({ agrupacionEntidad, onGuardar, onCancelar, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!agrupacionEntidad;

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
      esCliente: false,
      esProveedor: false,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (agrupacionEntidad) {
      setValue("nombre", agrupacionEntidad.nombre || "");
      setValue("descripcion", agrupacionEntidad.descripcion || "");
      setValue("esCliente", agrupacionEntidad.esCliente || false);
      setValue("esProveedor", agrupacionEntidad.esProveedor || false);
    } else {
      reset({
        nombre: "",
        descripcion: "",
        esCliente: false,
        esProveedor: false,
      });
    }
  }, [agrupacionEntidad, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Normalización de datos antes del envío
      const datosNormalizados = {
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        esCliente: data.esCliente,
        esProveedor: data.esProveedor,
      };

      if (esEdicion) {
        await actualizarAgrupacionEntidad(agrupacionEntidad.id, datosNormalizados);
      } else {
        await crearAgrupacionEntidad(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar agrupación de entidad:", error);
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
                placeholder="Ingrese el nombre de la agrupación"
                className={getFieldClass("nombre")}
                style={{ textTransform: 'uppercase' }}
                disabled={readOnly}
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
                placeholder="Descripción de la agrupación (opcional)"
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

        {/* Checkboxes de configuración */}
        <div className="p-col-12 p-md-6 p-field">
          <Controller
            name="esCliente"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="esCliente"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("esCliente")}
                  disabled={readOnly}
                />
                <label htmlFor="esCliente" className="p-checkbox-label">
                  Aplica para clientes
                </label>
              </div>
            )}
          />
          {errors.esCliente && (
            <small className="p-error p-d-block">{errors.esCliente.message}</small>
          )}
        </div>

        <div className="p-col-12 p-md-6 p-field">
          <Controller
            name="esProveedor"
            control={control}
            render={({ field }) => (
              <div className="p-field-checkbox">
                <Checkbox
                  id="esProveedor"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className={getFieldClass("esProveedor")}
                  disabled={readOnly}
                />
                <label htmlFor="esProveedor" className="p-checkbox-label">
                  Aplica para proveedores
                </label>
              </div>
            )}
          />
          {errors.esProveedor && (
            <small className="p-error p-d-block">{errors.esProveedor.message}</small>
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

export default AgrupacionEntidadForm;
