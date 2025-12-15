/**
 * Formulario para gestión de Provincias
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: departamentoId (obligatorio), codSUNAT (obligatorio), nombre (obligatorio)
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
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { crearProvincia, actualizarProvincia } from "../../api/provincia";
import { getDepartamentos } from "../../api/departamento";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  departamentoId: yup
    .number()
    .required("El departamento es obligatorio")
    .nullable(),
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
});

const ProvinciaForm = ({ provincia, onGuardar, onCancelar, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const toast = useRef(null);
  const esEdicion = !!provincia;

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
      departamentoId: null,
      codSUNAT: "",
      nombre: "",
    },
  });

  // Efecto para cargar departamentos
  useEffect(() => {
    cargarDepartamentos();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (provincia) {
      setValue("departamentoId", provincia.departamentoId || null);
      setValue("codSUNAT", provincia.codSUNAT || "");
      setValue("nombre", provincia.nombre || "");
    } else {
      reset({
        departamentoId: null,
        codSUNAT: "",
        nombre: "",
      });
    }
  }, [provincia, setValue, reset]);

  const cargarDepartamentos = async () => {
    try {
      const data = await getDepartamentos();
      setDepartamentos(data.map(d => ({ value: d.id, label: d.nombre })));
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        departamentoId: Number(data.departamentoId),
        codSUNAT: data.codSUNAT.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
      };

      if (esEdicion) {
        await actualizarProvincia(provincia.id, datosNormalizados);
      } else {
        await crearProvincia(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar provincia:", error);
      
      // Mostrar mensaje de error específico del backend
      const mensajeError = error.response?.data?.message || error.message || "Error al guardar provincia";
      
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
          {/* Campo Departamento */}
          <div className="p-col-12 p-field">
            <label htmlFor="departamentoId" className="p-d-block">
              Departamento <span className="p-error">*</span>
            </label>
            <Controller
              name="departamentoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="departamentoId"
                  value={field.value}
                  options={departamentos}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione un departamento"
                  className={getFieldClass("departamentoId")}
                  filter
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.departamentoId && (
              <small className="p-error p-d-block">{errors.departamentoId.message}</small>
            )}
          </div>

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
                  placeholder="Ingrese el nombre de la provincia"
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

export default ProvinciaForm;
