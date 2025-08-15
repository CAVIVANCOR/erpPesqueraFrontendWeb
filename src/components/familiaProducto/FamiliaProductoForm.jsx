/**
 * Formulario profesional para FamiliaProducto
 * Implementa React Hook Form + Yup con validaciones robustas y normalización ERP Megui.
 * Modelo Prisma: id, nombre (VarChar 80), subfamilias[], productos[]
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
  crearFamiliaProducto,
  actualizarFamiliaProducto,
} from "../../api/familiaProducto";

/**
 * Esquema de validación YUP para FamiliaProducto
 * Reglas: nombre obligatorio, máximo 80 caracteres, normalización a mayúsculas
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(80, "El nombre no puede exceder 80 caracteres")
    .transform((value) => (value ? value.toUpperCase().trim() : "")),
});

/**
 * Componente FamiliaProductoForm
 * Formulario para crear/editar familias de producto
 * Patrón aplicado: React Hook Form + YUP, normalización, feedback profesional
 */
const FamiliaProductoForm = ({ familiaProducto, onSave, onCancel, toast }) => {
  const modoEdicion = Boolean(familiaProducto?.id);

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
      nombre: "",
    },
  });

  /**
   * Efecto para cargar datos en modo edición
   */
  useEffect(() => {
    if (modoEdicion && familiaProducto) {
      setValue("nombre", familiaProducto.nombre || "");
    } else {
      reset({ nombre: "" });
    }
  }, [familiaProducto, modoEdicion, setValue, reset]);

  /**
   * Maneja el envío del formulario
   * Normaliza datos y llama a la API correspondiente
   */
  const onSubmit = async (data) => {
    try {
      // Normalización de datos según reglas ERP Megui
      const datosNormalizados = {
        nombre: data.nombre.toUpperCase().trim(),
      };

      if (modoEdicion) {
        await actualizarFamiliaProducto(familiaProducto.id, datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Familia de producto actualizada correctamente",
        });
      } else {
        await crearFamiliaProducto(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Familia de producto creada correctamente",
        });
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar familia de producto:", error);

      // Manejo específico de errores HTTP
      let mensajeError = "Error al guardar la familia de producto";

      if (error.response?.status === 409) {
        mensajeError = "Ya existe una familia de producto con ese nombre";
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
        {/* Campo Nombre */}
        <div className="field">
          <label htmlFor="nombre" className="font-bold">
            Nombre *
          </label>
          <InputText
            id="nombre"
            {...register("nombre")}
            className={getFormErrorClass("nombre")}
            placeholder="Ingrese el nombre de la familia de producto"
            maxLength={80}
            disabled={isSubmitting}
            style={{ textTransform: "uppercase" }}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            />
          </div>
          <div style={{ flex: 1 }}>
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
              className="p-button-primary"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default FamiliaProductoForm;
