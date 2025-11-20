/**
 * Formulario profesional para SubfamiliaProducto
 * Implementa React Hook Form + Yup con validaciones robustas y normalización ERP Megui.
 * Modelo Prisma: id, nombre (VarChar 80), familiaId, familia, productos[]
 * Patrón aplicado: Normalización a mayúsculas, validaciones YUP, dropdown dependiente, feedback visual, loading states.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import {
  crearSubfamiliaProducto,
  actualizarSubfamiliaProducto,
} from "../../api/subfamiliaProducto";

/**
 * Esquema de validación YUP para SubfamiliaProducto
 * Reglas: nombre y familiaId obligatorios, máximo 80 caracteres para nombre, normalización a mayúsculas
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .max(80, "El nombre no puede exceder 80 caracteres")
    .transform((value) => (value ? value.toUpperCase().trim() : "")),
  familiaId: yup
    .number()
    .required("La familia de producto es obligatoria")
    .typeError("Debe seleccionar una familia de producto"),
});

/**
 * Componente SubfamiliaProductoForm
 * Formulario para crear/editar subfamilias de producto
 * Patrón aplicado: React Hook Form + YUP, dropdown dependiente, normalización, feedback profesional
 */
const SubfamiliaProductoForm = ({
  subfamiliaProducto,
  familiasProducto,
  onSave,
  onCancel,
  toast,
  readOnly = false,
}) => {
  const modoEdicion = Boolean(subfamiliaProducto?.id);

  // Configuración de React Hook Form con YUP
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: "",
      familiaId: null,
    },
  });

  /**
   * Efecto para cargar datos en modo edición
   */
  useEffect(() => {
    if (modoEdicion && subfamiliaProducto) {
      setValue("nombre", subfamiliaProducto.nombre || "");
      setValue(
        "familiaId",
        Number(subfamiliaProducto.familiaId) || null
      );
    } else {
      reset({ nombre: "", familiaId: null });
    }
  }, [subfamiliaProducto, modoEdicion, setValue, reset]);

  /**
   * Prepara las opciones del dropdown de familias de producto
   */
  const opcionesFamilias = familiasProducto.map((familia) => ({
    label: familia.nombre,
    value: Number(familia.id),
  }));

  /**
   * Maneja el envío del formulario
   * Normaliza datos y llama a la API correspondiente
   */
  const onSubmit = async (data) => {
    try {
      // Normalización de datos según reglas ERP Megui
      const datosNormalizados = {
        nombre: data.nombre.toUpperCase().trim(),
        familiaId: Number(data.familiaId),
      };

      if (modoEdicion) {
        await actualizarSubfamiliaProducto(
          subfamiliaProducto.id,
          datosNormalizados
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Subfamilia de producto actualizada correctamente",
        });
      } else {
        await crearSubfamiliaProducto(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Subfamilia de producto creada correctamente",
        });
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar subfamilia de producto:", error);

      // Manejo específico de errores HTTP
      let mensajeError = "Error al guardar la subfamilia de producto";

      if (error.response?.status === 409) {
        mensajeError =
          "Ya existe una subfamilia de producto con ese nombre en la familia seleccionada";
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
        {/* Campo Familia de Producto */}
        <div className="field">
          <label htmlFor="familiaId" className="font-bold">
            Familia de Producto *
          </label>
          <Dropdown
            id="familiaId"
            value={watch("familiaId")}
            options={opcionesFamilias}
            onChange={(e) => setValue("familiaId", e.value)}
            placeholder="Seleccione una familia de producto"
            className={getFormErrorClass("familiaId")}
            disabled={isSubmitting || readOnly}
            filter
            showClear
            emptyMessage="No hay familias de producto disponibles"
          />
          {errors.familiaId && (
            <small className="p-error">
              {errors.familiaId.message}
            </small>
          )}
        </div>

        {/* Campo Nombre */}
        <div className="field">
          <label htmlFor="nombre" className="font-bold">
            Nombre *
          </label>
          <InputText
            id="nombre"
            {...register("nombre")}
            className={getFormErrorClass("nombre")}
            placeholder="Ingrese el nombre de la subfamilia de producto"
            maxLength={80}
            disabled={isSubmitting || readOnly}
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
              label={readOnly ? "Cerrar" : "Cancelar"}
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            />
          </div>
          {!readOnly && (
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
          )}
        </div>
      </form>
    </div>
  );
};

export default SubfamiliaProductoForm;
