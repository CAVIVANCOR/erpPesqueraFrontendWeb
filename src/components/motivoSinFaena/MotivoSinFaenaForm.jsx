/**
 * Formulario para gestión de Motivos Sin Faena
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: descripcion, activo
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
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import {
  crearMotivoSinFaena,
  actualizarMotivoSinFaena,
} from "../../api/motivoSinFaena";

// Esquema de validación con Yup
const esquemaValidacion = yup.object().shape({
  descripcion: yup
    .string()
    .required("La descripción es obligatoria")
    .max(250, "La descripción no puede exceder 250 caracteres"),
  activo: yup.boolean().default(true),
});

const MotivoSinFaenaForm = ({
  motivoSinFaena,
  onGuardar,
  onCancelar,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!motivoSinFaena;

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
      descripcion: "",
      activo: true,
    },
  });

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (motivoSinFaena) {
      setValue("descripcion", motivoSinFaena.descripcion || "");
      setValue("activo", motivoSinFaena.activo !== undefined ? motivoSinFaena.activo : true);
    } else {
      reset({
        descripcion: "",
        activo: true,
      });
    }
  }, [motivoSinFaena, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * @param {Object} data - Datos del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización de datos antes del envío
      const datosNormalizados = {
        descripcion: data.descripcion?.trim().toUpperCase() || null,
        activo: data.activo !== undefined ? data.activo : true,
      };

      if (esEdicion) {
        await actualizarMotivoSinFaena(
          motivoSinFaena.id,
          datosNormalizados
        );
      } else {
        await crearMotivoSinFaena(datosNormalizados);
      }

      onGuardar();
    } catch (error) {
      console.error("Error al guardar motivo sin faena:", error);
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
                placeholder="Descripción del motivo sin faena"
                className={getFieldClass("descripcion")}
                disabled={readOnly}
                style={{ textTransform: "uppercase", fontWeight: "bold" }}
                maxLength={250}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error p-d-block">
              {errors.descripcion.message}
            </small>
          )}
        </div>

        {/* Campo Activo */}
        <div className="p-col-12 p-field">
          <label htmlFor="activo" className="p-d-block">
            Estado
          </label>
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                label={field.value ? "ACTIVO" : "INACTIVO"}
                className={field.value ? "p-button-success" : "p-button-danger"}
                icon={field.value ? "pi pi-check-circle" : "pi pi-times-circle"}
                onClick={() => !readOnly && field.onChange(!field.value)}
                disabled={readOnly}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            )}
          />
          {errors.activo && (
            <small className="p-error p-d-block">{errors.activo.message}</small>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancelar}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          type="submit"
          label={esEdicion ? "Actualizar" : "Crear"}
          icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
          loading={loading}
          disabled={readOnly || loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
};

export default MotivoSinFaenaForm;