/**
 * Formulario profesional para TipoMaterial
 * Implementa React Hook Form + Yup con validaciones robustas y normalización ERP Megui.
 * Modelo Prisma: id, codigo (VarChar 10), nombre (VarChar 80), productos[]
 * Patrón aplicado: Normalización a mayúsculas, validaciones YUP, feedback visual, loading states.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import {
  crearTipoMaterial,
  actualizarTipoMaterial,
} from "../../api/tipoMaterial";

/**
 * Esquema de validación YUP para TipoMaterial
 * Reglas: codigo y nombre obligatorios, longitudes máximas, normalización a mayúsculas
 */
const esquemaValidacion = yup.object().shape({
  codigo: yup
    .string()
    .required("El código es obligatorio")
    .max(10, "El código no puede exceder 10 caracteres")
    .transform((value) => (value ? value.toUpperCase().trim() : "")),
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(80, "El nombre no puede exceder 80 caracteres")
    .transform((value) => (value ? value.toUpperCase().trim() : "")),
});

/**
 * Componente TipoMaterialForm
 * Formulario para crear/editar tipos de material
 * Patrón aplicado: React Hook Form + YUP, normalización, feedback profesional
 */
const TipoMaterialForm = ({ tipoMaterial, onSave, onCancel, toast }) => {
  const modoEdicion = Boolean(tipoMaterial?.id);

  // Configuración de React Hook Form con YUP
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      codigo: "",
      nombre: "",
    },
  });

  /**
   * Efecto para cargar datos en modo edición
   */
  useEffect(() => {
    if (modoEdicion && tipoMaterial) {
      setValue("codigo", tipoMaterial.codigo || "");
      setValue("nombre", tipoMaterial.nombre || "");
    } else {
      reset({ codigo: "", nombre: "" });
    }
  }, [tipoMaterial, modoEdicion, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * Normaliza datos y llama a la API correspondiente
   */
  const onSubmit = async (data) => {
    try {
      // Normalización de datos según reglas ERP Megui
      const datosNormalizados = {
        codigo: data.codigo.toUpperCase().trim(),
        nombre: data.nombre.toUpperCase().trim(),
      };
      if (modoEdicion) {
        await actualizarTipoMaterial(tipoMaterial.id, datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de material actualizado correctamente",
        });
      } else {
        await crearTipoMaterial(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de material creado correctamente",
        });
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar tipo de material:", error);

      // Manejo específico de errores HTTP
      let mensajeError = "Error al guardar el tipo de material";

      if (error.response?.status === 409) {
        mensajeError = "Ya existe un tipo de material con ese código o nombre";
      } else if (error.response?.status === 400) {
        mensajeError = "Datos inválidos. Verifique la información ingresada";
      } else if (error.response?.status === 500) {
        mensajeError = "Error interno del servidor. Intente nuevamente";
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    }
  };

  /**
   * Obtiene la clase CSS para campos con error
   */
  const getFormErrorClass = (fieldName) =>
    classNames({ "p-invalid": errors[fieldName] });

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          {/* Campo Código */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="codigo" className="font-bold">
                Código *
              </label>
              <InputText
                id="codigo"
                {...register("codigo")}
                className={getFormErrorClass("codigo")}
                placeholder="Ingrese el código"
                maxLength={10}
                disabled={isSubmitting}
                style={{ textTransform: "uppercase" }}
              />
              {errors.codigo && (
                <small className="p-error">{errors.codigo.message}</small>
              )}
            </div>
          </div>

          {/* Campo Nombre */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="nombre" className="font-bold">
                Nombre *
              </label>
              <InputText
                id="nombre"
                {...register("nombre")}
                className={getFormErrorClass("nombre")}
                placeholder="Ingrese el nombre del tipo de material"
                maxLength={80}
                disabled={isSubmitting}
                style={{ textTransform: "uppercase" }}
              />
              {errors.nombre && (
                <small className="p-error">{errors.nombre.message}</small>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 20,
          }}
        >
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancel}
            disabled={isSubmitting}
            raised
            size="small"
          />
          <Button
            type="submit"
            label={
              isSubmitting ? (
                <div className="flex align-items-center gap-2">
                  <ProgressSpinner
                    style={{ width: "16px", height: "16px" }}
                    strokeWidth="4"
                  />
                  <span>Guardando...</span>
                </div>
              ) : modoEdicion ? (
                "Actualizar"
              ) : (
                "Crear"
              )
            }
            icon={!isSubmitting ? "pi pi-check" : ""}
            className="p-button-success"
            disabled={isSubmitting}
            raised
            size="small"
          />
        </div>
      </form>
    </div>
  );
};

export default TipoMaterialForm;
