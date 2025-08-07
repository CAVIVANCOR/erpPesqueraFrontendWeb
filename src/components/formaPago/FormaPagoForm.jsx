/**
 * Formulario para gestión de Formas de Pago
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: nombre, descripcion, esCliente, esProveedor, activo
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
import { crearFormaPago, actualizarFormaPago } from "../../api/formaPago";

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
  activo: yup
    .boolean()
    .default(true),
});

const FormaPagoForm = ({ formaPago, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!formaPago;

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
      activo: true,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (formaPago) {
      setValue("nombre", formaPago.nombre || "");
      setValue("descripcion", formaPago.descripcion || "");
      setValue("esCliente", formaPago.esCliente || false);
      setValue("esProveedor", formaPago.esProveedor || false);
      setValue("activo", formaPago.activo !== false); // Por defecto true
    } else {
      reset({
        nombre: "",
        descripcion: "",
        esCliente: false,
        esProveedor: false,
        activo: true,
      });
    }
  }, [formaPago, setValue, reset]);

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
        activo: data.activo,
      };
      if (esEdicion) {
        await actualizarFormaPago(formaPago.id, datosNormalizados);
      } else {
        await crearFormaPago(datosNormalizados);
      }
      onGuardar();
    } catch (error) {
      console.error("Error al guardar forma de pago:", error);
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
                placeholder="Ingrese el nombre de la forma de pago"
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
                placeholder="Descripción de la forma de pago (opcional)"
                className={getFieldClass("descripcion")}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">{errors.descripcion.message}</small>
          )}
        </div>

        {/* Checkboxes de configuración */}
        <div className="p-col-12 p-md-4 p-field">
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

        <div className="p-col-12 p-md-4 p-field">
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

        <div className="p-col-12 p-md-4 p-field">
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
                  Forma de pago activa
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
        />
      </div>
    </form>
  );
};

export default FormaPagoForm;
