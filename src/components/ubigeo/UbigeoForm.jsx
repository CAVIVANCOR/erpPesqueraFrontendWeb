/**
 * Formulario para gestión de Ubigeos
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y longitudes
 * - Normalización de datos antes del envío
 * - Campos: paisId, departamentoId, provinciaId (obligatorios), codigo (obligatorio), activo (checkbox), nombreDistrito
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
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearUbigeo, actualizarUbigeo } from "../../api/ubigeo";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  paisId: yup
    .number()
    .required("El país es obligatorio")
    .nullable(),
  departamentoId: yup
    .number()
    .required("El departamento es obligatorio")
    .nullable(),
  provinciaId: yup
    .number()
    .required("La provincia es obligatoria")
    .nullable(),
  codigo: yup
    .string()
    .required("El código es obligatorio")
    .max(20, "El código no puede exceder 20 caracteres")
    .trim(),
  nombreDistrito: yup
    .string()
    .max(100, "El nombre del distrito no puede exceder 100 caracteres")
    .trim(),
  activo: yup.boolean().default(true),
});

const UbigeoForm = ({ ubigeo, paises, departamentos, provincias, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const [departamentosFiltrados, setDepartamentosFiltrados] = useState([]);
  const [provinciasFiltradas, setProvinciasFiltradas] = useState([]);
  const esEdicion = !!ubigeo;

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      paisId: null,
      departamentoId: null,
      provinciaId: null,
      codigo: "",
      nombreDistrito: "",
      activo: true,
    },
  });

  // Observar cambios para filtros dependientes
  const paisId = watch("paisId");
  const departamentoId = watch("departamentoId");
  const provinciaId = watch("provinciaId");

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (ubigeo) {
      const paisIdValue = ubigeo.paisId ? Number(ubigeo.paisId) : null;
      const departamentoIdValue = ubigeo.departamentoId ? Number(ubigeo.departamentoId) : null;
      const provinciaIdValue = ubigeo.provinciaId ? Number(ubigeo.provinciaId) : null;      
      // Usar setTimeout para asegurar que setValue se ejecute después del render
      setTimeout(() => {
        setValue("paisId", paisIdValue);
        setValue("departamentoId", departamentoIdValue);
        setValue("provinciaId", provinciaIdValue);
        setValue("codigo", ubigeo.codigo || "");
        setValue("nombreDistrito", ubigeo.nombreDistrito || "");
        setValue("activo", ubigeo.activo !== undefined ? ubigeo.activo : true);
        
        // Forzar trigger para actualizar el formulario
        trigger(["paisId", "departamentoId", "provinciaId"]);
      }, 100);
      
      // Inicializar arrays filtrados para edición
      if (paisIdValue && departamentos.length > 0) {
        const filtrados = departamentos.filter(d => Number(d.paisId) === paisIdValue);
        setDepartamentosFiltrados(filtrados);
      }
      
      if (departamentoIdValue && provincias.length > 0) {
        const filtradas = provincias.filter(p => Number(p.departamentoId) === departamentoIdValue);
        setProvinciasFiltradas(filtradas);
      }
    } else {
      reset({
        paisId: null,
        departamentoId: null,
        provinciaId: null,
        codigo: "",
        nombreDistrito: "",
        activo: true,
      });
      setDepartamentosFiltrados([]);
      setProvinciasFiltradas([]);
    }
  }, [ubigeo, setValue, reset, departamentos, provincias, trigger]);

  // Filtrar departamentos cuando cambia el país
  useEffect(() => {
    if (paisId && departamentos.length > 0) {
      const filtrados = departamentos.filter(d => Number(d.paisId) === Number(paisId));
      setDepartamentosFiltrados(filtrados);
    } else {
      setDepartamentosFiltrados([]);
      setValue("departamentoId", null);
      setValue("provinciaId", null);
    }
  }, [paisId, departamentos, setValue]);

  // Filtrar provincias cuando cambia el departamento
  useEffect(() => {
    if (departamentoId && provincias.length > 0) {
      const filtradas = provincias.filter(p => Number(p.departamentoId) === Number(departamentoId));
      setProvinciasFiltradas(filtradas);
    } else {
      setProvinciasFiltradas([]);
      setValue("provinciaId", null);
    }
  }, [departamentoId, provincias, setValue]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        paisId: data.paisId ? Number(data.paisId) : null,
        departamentoId: data.departamentoId ? Number(data.departamentoId) : null,
        provinciaId: data.provinciaId ? Number(data.provinciaId) : null,
        codigo: data.codigo.trim().toUpperCase(),
        nombreDistrito: data.nombreDistrito ? data.nombreDistrito.trim().toUpperCase() : null,
        activo: Boolean(data.activo),
      };

      if (esEdicion) {
        await actualizarUbigeo(ubigeo.id, datosNormalizados);
      } else {
        await crearUbigeo(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar ubigeo:", error);
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

  // Normalizar opciones para dropdowns
  const paisesOptions = paises.map(p => ({ 
    ...p, 
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id)
  }));

  const departamentosOptions = departamentosFiltrados.map(d => ({ 
    ...d, 
    id: Number(d.id),
    label: d.nombre,
    value: Number(d.id)
  }));

  const provinciasOptions = provinciasFiltradas.map(p => ({ 
    ...p, 
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id)
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid p-formgrid">
        {/* Campo País */}
        <div className="p-col-12 p-md-4 p-field">
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
                options={paisesOptions}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar país"
                className={getFieldClass("paisId")}
              />
            )}
          />
          {errors.paisId && (
            <small className="p-error p-d-block">{errors.paisId.message}</small>
          )}
        </div>

        {/* Campo Departamento */}
        <div className="p-col-12 p-md-4 p-field">
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
                options={departamentosOptions}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar departamento"
                disabled={!paisId}
                className={getFieldClass("departamentoId")}
              />
            )}
          />
          {errors.departamentoId && (
            <small className="p-error p-d-block">{errors.departamentoId.message}</small>
          )}
        </div>

        {/* Campo Provincia */}
        <div className="p-col-12 p-md-4 p-field">
          <label htmlFor="provinciaId" className="p-d-block">
            Provincia <span className="p-error">*</span>
          </label>
          <Controller
            name="provinciaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="provinciaId"
                value={field.value}
                options={provinciasOptions}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar provincia"
                disabled={!departamentoId}
                className={getFieldClass("provinciaId")}
              />
            )}
          />
          {errors.provinciaId && (
            <small className="p-error p-d-block">{errors.provinciaId.message}</small>
          )}
        </div>

        {/* Campo Código */}
        <div className="p-col-12 p-md-8 p-field">
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
                placeholder="Ingrese el código del ubigeo"
                className={getFieldClass("codigo")}
                maxLength={20}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.codigo && (
            <small className="p-error p-d-block">{errors.codigo.message}</small>
          )}
        </div>

        {/* Campo Nombre Distrito */}
        <div className="p-col-12 p-md-8 p-field">
          <label htmlFor="nombreDistrito" className="p-d-block">
            Nombre del Distrito
          </label>
          <Controller
            name="nombreDistrito"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombreDistrito"
                {...field}
                placeholder="Ingrese el nombre del distrito"
                className={getFieldClass("nombreDistrito")}
                maxLength={100}
                style={{ textTransform: 'uppercase' }}
              />
            )}
          />
          {errors.nombreDistrito && (
            <small className="p-error p-d-block">{errors.nombreDistrito.message}</small>
          )}
        </div>

        {/* Campo Activo */}
        <div className="p-col-12 p-md-4 p-field">
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

export default UbigeoForm;
