/**
 * Formulario para gestión de Activos
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: empresaId, tipoId, nombre, descripcion, cesado
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
import { crearActivo, actualizarActivo } from "../../api/activo";
import { getTiposActivo } from "../../api/tipoActivo";
import { getEmpresas } from "../../api/empresa";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  empresaId: yup
    .number()
    .required("La empresa es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tipoId: yup
    .number()
    .required("El tipo de activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
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

const ActivoForm = ({ activo, onGuardar, onCancelar, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [tiposActivo, setTiposActivo] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const esEdicion = !!activo;

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
      empresaId: null,
      tipoId: null,
      nombre: "",
      descripcion: "",
      cesado: false,
    },
  });

  // Cargar datos de combos al montar
  useEffect(() => {
    cargarCombos();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (activo) {
      setValue("empresaId", Number(activo.empresaId) || null);
      setValue("tipoId", Number(activo.tipoId) || null);
      setValue("nombre", activo.nombre || "");
      setValue("descripcion", activo.descripcion || "");
      setValue("cesado", activo.cesado || false);
    } else {
      reset({
        empresaId: null,
        tipoId: null,
        nombre: "",
        descripcion: "",
        cesado: false,
      });
    }
  }, [activo, setValue, reset]);

  /**
   * Cargar datos para combos
   */
  const cargarCombos = async () => {
    try {
      const [tiposData, empresasData] = await Promise.all([
        getTiposActivo(),
        getEmpresas()
      ]);
      
      setTiposActivo(tiposData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
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
        empresaId: Number(data.empresaId),
        tipoId: Number(data.tipoId),
        nombre: data.nombre.trim().toUpperCase(),
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        cesado: data.cesado,
      };

      if (esEdicion) {
        await actualizarActivo(activo.id, datosNormalizados);
      } else {
        await crearActivo(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar activo:", error);
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

  // Opciones para combos
  const empresasOptions = empresas.map(empresa => ({
    label: empresa.razonSocial,
    value: Number(empresa.id)
  }));

  const tiposActivoOptions = tiposActivo.map(tipo => ({
    label: tipo.nombre,
    value: Number(tipo.id)
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="p-grid p-formgrid">
        {/* Campo Empresa */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="empresaId" className="p-d-block">
            Empresa <span className="p-error">*</span>
          </label>
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="empresaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={empresasOptions}
                placeholder="Seleccione una empresa"
                className={getFieldClass("empresaId")}
                filter
                showClear
                disabled={readOnly}
              />
            )}
          />
          {errors.empresaId && (
            <small className="p-error p-d-block">{errors.empresaId.message}</small>
          )}
        </div>

        {/* Campo Tipo de Activo */}
        <div className="p-col-12 p-md-6 p-field">
          <label htmlFor="tipoId" className="p-d-block">
            Tipo de Activo <span className="p-error">*</span>
          </label>
          <Controller
            name="tipoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={tiposActivoOptions}
                placeholder="Seleccione tipo de activo"
                className={getFieldClass("tipoId")}
                filter
                showClear
                disabled={readOnly}
              />
            )}
          />
          {errors.tipoId && (
            <small className="p-error p-d-block">{errors.tipoId.message}</small>
          )}
        </div>

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
                placeholder="Ingrese el nombre del activo"
                className={getFieldClass("nombre")}
                style={{ textTransform: 'uppercase' }}
                disabled={readOnly}
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
                placeholder="Descripción del activo (opcional)"
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
                  disabled={readOnly}
                />
                <label htmlFor="cesado" className="p-checkbox-label">
                  Activo cesado
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
          disabled={readOnly}
        />
      </div>
    </form>
  );
};

export default ActivoForm;
