/**
 * Formulario para gestión de Departamentos
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: paisId (obligatorio), codSUNAT (obligatorio), nombre (obligatorio)
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
import { crearDepartamento, actualizarDepartamento } from "../../api/departamento";
import { getPaises } from "../../api/pais";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  paisId: yup
    .number()
    .required("El país es obligatorio")
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

const DepartamentoForm = ({ departamento, onGuardar, onCancelar, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [paises, setPaises] = useState([]);
  const toast = useRef(null);
  const esEdicion = !!departamento;

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
      paisId: null,
      codSUNAT: "",
      nombre: "",
    },
  });

  // Efecto para cargar países
  useEffect(() => {
    cargarPaises();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (departamento) {
      setValue("paisId", Number(departamento.paisId) || null);
      setValue("codSUNAT", departamento.codSUNAT || "");
      setValue("nombre", departamento.nombre || "");
    } else {
      reset({
        paisId: null,
        codSUNAT: "",
        nombre: "",
      });
    }
  }, [departamento, setValue, reset]);

  const cargarPaises = async () => {
    try {
      const data = await getPaises();
      const paisesActivos = data.filter(p => p.activo);
      setPaises(paisesActivos.map(p => ({ value: p.id, label: p.nombre })));
    } catch (error) {
      console.error("Error al cargar países:", error);
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
        paisId: Number(data.paisId),
        codSUNAT: data.codSUNAT.trim().toUpperCase(),
        nombre: data.nombre.trim().toUpperCase(),
      };

      if (esEdicion) {
        await actualizarDepartamento(Number(departamento.id), datosNormalizados);
      } else {
        await crearDepartamento(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar departamento:", error);
      
      // Mostrar mensaje de error específico del backend
      const mensajeError = error.response?.data?.message || error.message || "Error al guardar departamento";
      
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
          {/* Campo País */}
          <div className="p-col-12 p-field">
            <label htmlFor="paisId" className="p-d-block">
              País <span className="p-error">*</span>
            </label>
            <Controller
              name="paisId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="paisId"
                  value={field.value}
                  options={paises}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Seleccione un país"
                  className={getFieldClass("paisId")}
                  filter
                  showClear
                  disabled={readOnly}
                />
              )}
            />
            {errors.paisId && (
              <small className="p-error p-d-block">{errors.paisId.message}</small>
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
                  placeholder="Ingrese el nombre del departamento"
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

export default DepartamentoForm;
