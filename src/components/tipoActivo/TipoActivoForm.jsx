/**
 * Formulario para gestión de Tipos de Activo
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: codigo, nombre, descripcion, cesado, cuentas contables
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.1.0
 */

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { crearTipoActivo, actualizarTipoActivo } from "../../api/tipoActivo";
import PlanCuentaContableSelector from "../common/PlanCuentaContableSelector";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  codigo: yup.string().required("El código es obligatorio").trim(),
  nombre: yup.string().required("El nombre es obligatorio").trim(),
  descripcion: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cuentaActivoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cuentaDepreciacionId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cuentaDepreciacionAcumuladaId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cesado: yup.boolean().default(false),
});

const TipoActivoForm = ({
  tipoActivo,
  onGuardar,
  onCancelar,
  readOnly = false,
  toast,
}) => {
  const [loading, setLoading] = useState(false);
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
      cuentaActivoId: tipoActivo?.cuentaActivoId
        ? Number(tipoActivo.cuentaActivoId)
        : null,
      cuentaDepreciacionId: tipoActivo?.cuentaDepreciacionId
        ? Number(tipoActivo.cuentaDepreciacionId)
        : null,
      cuentaDepreciacionAcumuladaId: tipoActivo?.cuentaDepreciacionAcumuladaId
        ? Number(tipoActivo.cuentaDepreciacionAcumuladaId)
        : null,
      cesado: tipoActivo?.cesado || false,
    },
  });

  // Efecto para resetear formulario cuando cambia tipoActivo
  useEffect(() => {
    if (tipoActivo) {
      setValue("codigo", tipoActivo.codigo || "");
      setValue("nombre", tipoActivo.nombre || "");
      setValue("descripcion", tipoActivo.descripcion || "");
      // IMPORTANTE: Permitir valor 0 para cuentas contables (usado al limpiar)
      setValue(
        "cuentaActivoId",
        (tipoActivo.cuentaActivoId !== null && tipoActivo.cuentaActivoId !== undefined)
          ? Number(tipoActivo.cuentaActivoId)
          : null,
      );
      setValue(
        "cuentaDepreciacionId",
        (tipoActivo.cuentaDepreciacionId !== null && tipoActivo.cuentaDepreciacionId !== undefined)
          ? Number(tipoActivo.cuentaDepreciacionId)
          : null,
      );
      setValue(
        "cuentaDepreciacionAcumuladaId",
        (tipoActivo.cuentaDepreciacionAcumuladaId !== null && tipoActivo.cuentaDepreciacionAcumuladaId !== undefined)
          ? Number(tipoActivo.cuentaDepreciacionAcumuladaId)
          : null,
      );
      setValue("cesado", tipoActivo.cesado || false);
    } else {
      reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        cuentaActivoId: null,
        cuentaDepreciacionId: null,
        cuentaDepreciacionAcumuladaId: null,
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
        // IMPORTANTE: Permitir valor 0 para limpiar cuentas contables
        // El componente PlanCuentaContableSelector envía 0 cuando se limpia
        cuentaActivoId: (data.cuentaActivoId !== null && data.cuentaActivoId !== undefined)
          ? Number(data.cuentaActivoId)
          : null,
        cuentaDepreciacionId: (data.cuentaDepreciacionId !== null && data.cuentaDepreciacionId !== undefined)
          ? Number(data.cuentaDepreciacionId)
          : null,
        cuentaDepreciacionAcumuladaId: (data.cuentaDepreciacionAcumuladaId !== null && data.cuentaDepreciacionAcumuladaId !== undefined)
          ? Number(data.cuentaDepreciacionAcumuladaId)
          : null,
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

      // Mostrar error al usuario
      let mensajeError = "Error al guardar tipo de activo";

      if (error.response?.data?.mensaje) {
        mensajeError = error.response.data.mensaje;
      } else if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      } else if (error.message) {
        mensajeError = error.message;
      }

      if (toast?.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: mensajeError,
          life: 5000,
        });
      }
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
      <div
        style={{
          display: "flex",
          alignItems:"end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Código */}
        <div style={{ flex: 1 }}>
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
                style={{ textTransform: "uppercase", fontWeight: "bold" }}
                autoFocus
                disabled={readOnly}
              />
            )}
          />
          {errors.codigo && (
            <small className="p-error p-d-block">{errors.codigo.message}</small>
          )}
        </div>

        {/* Campo Nombre */}
        <div style={{ flex: 1 }}>
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
                style={{ textTransform: "uppercase", fontWeight: "bold" }}
                disabled={readOnly}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error p-d-block">{errors.nombre.message}</small>
          )}
        </div>
        {/* Campo Cesado */}
        <div style={{ flex: 1 }}>
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "CESADO" : "ACTIVO"}
                className={
                  field.value
                    ? "p-button-danger w-full"
                    : "p-button-success w-full"
                }
                icon={field.value ? "pi pi-times-circle" : "pi pi-check-circle"}
                onClick={() => !readOnly && field.onChange(!field.value)}
                disabled={readOnly}
                style={{ marginTop: "0.5rem" }}
              />
            )}
          />
          {errors.cesado && (
            <small className="p-error p-d-block">{errors.cesado.message}</small>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
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
                style={{ textTransform: "uppercase", fontWeight: "bold" }}
                disabled={readOnly}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">
              {errors.descripcion.message}
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Cuenta Activo (33x) */}
        <div style={{ flex: 1 }}>
          <Controller
            name="cuentaActivoId"
            control={control}
            render={({ field }) => (
              <PlanCuentaContableSelector
                value={(field.value !== null && field.value !== undefined) ? Number(field.value) : null}
                onChange={(id) => field.onChange(id)}
                label="Cuenta del Activo (33x)"
                placeholder="Seleccionar Cuenta del Activo"
                disabled={readOnly}
                required={false}
                error={!!errors.cuentaActivoId}
                errorMessage={errors.cuentaActivoId?.message}
                showClearButton={true}
              />
            )}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <Controller
            name="cuentaDepreciacionId"
            control={control}
            render={({ field }) => (
              <PlanCuentaContableSelector
                value={(field.value !== null && field.value !== undefined) ? Number(field.value) : null}
                onChange={(id) => field.onChange(id)}
                label="Cuenta de Gasto Depreciación (68x)"
                placeholder="Seleccionar Cuenta de Depreciación"
                disabled={readOnly}
                required={false}
                error={!!errors.cuentaDepreciacionId}
                errorMessage={errors.cuentaDepreciacionId?.message}
                showClearButton={true}
              />
            )}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom:"1rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Campo Cuenta Depreciación Acumulada (39x) */}
        <div style={{ flex: 1 }}>
          <Controller
            name="cuentaDepreciacionAcumuladaId"
            control={control}
            render={({ field }) => (
              <PlanCuentaContableSelector
                value={(field.value !== null && field.value !== undefined) ? Number(field.value) : null}
                onChange={(id) => field.onChange(id)}
                label="Cuenta de Depreciación Acumulada (39x)"
                placeholder="Seleccionar Cuenta de Depreciación Acumulada"
                disabled={readOnly}
                required={false}
                error={!!errors.cuentaDepreciacionAcumuladaId}
                errorMessage={errors.cuentaDepreciacionAcumuladaId?.message}
                showClearButton={true}
              />
            )}
          />
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

export default TipoActivoForm;
