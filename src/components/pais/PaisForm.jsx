/**
 * Formulario para gestión de Países
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: codSUNAT (obligatorio), nombre (obligatorio), activo (checkbox)
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { crearPais, actualizarPais } from "../../api/pais";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  codSUNAT: yup
    .string()
    .required("El código SUNAT es obligatorio")
    .max(10, "El código SUNAT no puede exceder 10 caracteres")
    .trim(),
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  gentilicio: yup.string().max(100, "El gentilicio no puede exceder 100 caracteres").trim(),
  activo: yup.boolean().default(true),
});

const PaisForm = ({ pais, onGuardar, onCancelar, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const esEdicion = !!pais;

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
      codSUNAT: "",
      nombre: "",
      gentilicio: "",
      activo: true,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (pais) {
      setValue("codSUNAT", pais.codSUNAT || "");
      setValue("nombre", pais.nombre || "");
      setValue("gentilicio", pais.gentilicio || "");
      setValue("activo", pais.activo !== undefined ? pais.activo : true);
    } else {
      reset({
        codSUNAT: "",
        nombre: "",
        gentilicio: "",
        activo: true,
      });
    }
  }, [pais, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        codSUNAT: data.codSUNAT.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
        gentilicio: data.gentilicio.trim().toUpperCase(),
        activo: Boolean(data.activo),
      };

      if (esEdicion) {
        await actualizarPais(pais.id, datosNormalizados);
      } else {
        await crearPais(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar país:", error);
      
      // Mostrar mensaje de error específico del backend
      const mensajeError = error.response?.data?.message || error.message || "Error al guardar país";
      
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
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
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="p-grid p-formgrid">
          {/* Campo Código SUNAT */}
          <div className="p-col-12 p-md-6 p-field">
            <label htmlFor="codSUNAT" className="p-d-block">
              Código SUNAT <span className="p-error">*</span>
            </label>
            <Controller
              name="codSUNAT"
              control={control}
              render={({ field }) => (
                <InputText
                  id="codSUNAT"
                  {...field}
                  placeholder="Ingrese el código SUNAT"
                  className={getFieldClass("codSUNAT")}
                  maxLength={10}
                  style={{ textTransform: 'uppercase' }}
                  disabled={readOnly}
                />
              )}
            />
            {errors.codSUNAT && (
              <small className="p-error p-d-block">{errors.codSUNAT.message}</small>
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
                  placeholder="Ingrese el nombre del país"
                  className={getFieldClass("nombre")}
                  maxLength={100}
                  style={{ textTransform: 'uppercase' }}
                  disabled={readOnly}
                />
              )}
            />
            {errors.nombre && (
              <small className="p-error p-d-block">{errors.nombre.message}</small>
            )}
          </div>

          {/* Campo Gentilicio */}
          <div className="p-col-12 p-md-6 p-field">
            <label htmlFor="gentilicio" className="p-d-block">
              Gentilicio <span className="p-error">*</span>
            </label>
            <Controller
              name="gentilicio"
              control={control}
              render={({ field }) => (
                <InputText
                  id="gentilicio"
                  {...field}
                  placeholder="Ingrese el gentilicio del país"
                  className={getFieldClass("gentilicio")}
                  maxLength={100}
                  style={{ textTransform: 'uppercase' }}
                  disabled={readOnly}
                />
              )}
            />
            {errors.gentilicio && (
              <small className="p-error p-d-block">{errors.gentilicio.message}</small>
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
                    disabled={readOnly}
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
            disabled={readOnly}
          />
        </div>
      </form>
    </>
  );
};

export default PaisForm;
