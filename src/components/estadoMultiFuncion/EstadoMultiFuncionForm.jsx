/**
 * Formulario para gestión de Estados Multifunción
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: tipoProvieneDeId, descripcion, cesado
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
import { crearEstadoMultiFuncion, actualizarEstadoMultiFuncion } from "../../api/estadoMultiFuncion";
import { getTiposProvieneDe } from "../../api/tipoProvieneDe";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  tipoProvieneDeId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
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

const EstadoMultiFuncionForm = ({ estadoMultiFuncion, onGuardar, onCancelar }) => {
  const [loading, setLoading] = useState(false);
  const [tiposProvieneDe, setTiposProvieneDe] = useState([]);
  const esEdicion = !!estadoMultiFuncion;

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
      tipoProvieneDeId: null,
      descripcion: "",
      cesado: false,
    },
  });

  // Carga inicial de datos relacionados
  useEffect(() => {
    cargarTiposProvieneDe();
  }, []);

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (estadoMultiFuncion) {
      setValue("tipoProvieneDeId", estadoMultiFuncion.tipoProvieneDeId ? Number(estadoMultiFuncion.tipoProvieneDeId) : null);
      setValue("descripcion", estadoMultiFuncion.descripcion || "");
      setValue("cesado", estadoMultiFuncion.cesado || false);
    } else {
      reset({
        tipoProvieneDeId: null,
        descripcion: "",
        cesado: false,
      });
    }
  }, [estadoMultiFuncion, setValue, reset]);

  /**
   * Carga los tipos proviene de para el dropdown
   */
  const cargarTiposProvieneDe = async () => {
    try {
      const data = await getTiposProvieneDe();
      setTiposProvieneDe(data.map(item => ({
        value: Number(item.id),
        label: item.nombre || item.descripcion || `ID: ${item.id}`,
      })));
    } catch (error) {
      console.error('Error al cargar tipos proviene de:', error);
      setTiposProvieneDe([]);
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
        tipoProvieneDeId: data.tipoProvieneDeId ? Number(data.tipoProvieneDeId) : null,
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        cesado: data.cesado || false,
      };

      if (esEdicion) {
        await actualizarEstadoMultiFuncion(estadoMultiFuncion.id, datosNormalizados);
      } else {
        await crearEstadoMultiFuncion(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar estado multifunción:", error);
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
        {/* Campo Tipo Proviene De */}
        <div className="p-col-12 p-field">
          <label htmlFor="tipoProvieneDeId" className="p-d-block">
            Tipo Proviene De*
          </label>
          <Controller
            name="tipoProvieneDeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="tipoProvieneDeId"
                {...field}
                options={tiposProvieneDe}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo..."
                className={getFieldClass("tipoProvieneDeId")}
                disabled={loading}
                showClear
              />
            )}
          />
          {errors.tipoProvieneDeId && (
            <small className="p-error p-d-block">{errors.tipoProvieneDeId.message}</small>
          )}
        </div>

        {/* Campo Descripción */}
        <div className="p-col-12 p-field">
          <label htmlFor="descripcion" className="p-d-block">
            Descripción*
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputText
                id="descripcion"
                {...field}
                placeholder="Descripción del estado multifunción (opcional)"
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
                  Estado multifunción cesado
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

export default EstadoMultiFuncionForm;
