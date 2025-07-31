// src/components/motivoAcceso/MotivoAccesoForm.jsx
// Formulario profesional para MotivoAcceso con validaciones completas
// Cumple regla transversal ERP Megui: normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import {
  crearMotivoAcceso,
  actualizarMotivoAcceso,
} from "../../api/motivoAcceso";

/**
 * Componente MotivoAccesoForm
 * Formulario para gestión de motivos de acceso a instalaciones
 * Incluye validaciones según patrón ERP Megui
 */
const MotivoAccesoForm = ({ motivoAcceso, onSave, onCancel }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    if (motivoAcceso) {
      // Cargar datos del motivo de acceso para edición
      reset({
        nombre: motivoAcceso.nombre || "",
        descripcion: motivoAcceso.descripcion || "",
        activo: Boolean(motivoAcceso.activo),
      });
    }
  }, [motivoAcceso, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Preparar payload con validaciones
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo),
      };

      console.log("Payload MotivoAcceso:", payload);

      if (motivoAcceso?.id) {
        await actualizarMotivoAcceso(motivoAcceso.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Motivo de acceso actualizado correctamente",
        });
      } else {
        await crearMotivoAcceso(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Motivo de acceso creado correctamente",
        });
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar motivo de acceso:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.error || "Error al guardar el motivo de acceso",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="motivo-acceso-form">
      <Toast ref={toast} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          <div className="col-12">
            <label htmlFor="nombre" className="block text-900 font-medium mb-2">
              Nombre *
            </label>
            <Controller
              name="nombre"
              control={control}
              rules={{
                required: "El nombre es obligatorio",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 100, message: "Máximo 100 caracteres" },
              }}
              render={({ field }) => (
                <InputText
                  id="nombre"
                  {...field}
                  placeholder="Ej: Visita, Inspección, Entrega, Retiro, Mantenimiento"
                  className={`w-full ${errors.nombre ? "p-invalid" : ""}`}
                />
              )}
            />
            {errors.nombre && (
              <small className="p-error">{errors.nombre.message}</small>
            )}
          </div>

          <div className="col-12">
            <label
              htmlFor="descripcion"
              className="block text-900 font-medium mb-2"
            >
              Descripción
            </label>
            <Controller
              name="descripcion"
              control={control}
              rules={{
                maxLength: { value: 500, message: "Máximo 500 caracteres" },
              }}
              render={({ field }) => (
                <InputTextarea
                  id="descripcion"
                  {...field}
                  placeholder="Descripción del motivo de acceso (opcional)"
                  className={`w-full ${errors.descripcion ? "p-invalid" : ""}`}
                  rows={3}
                />
              )}
            />
            {errors.descripcion && (
              <small className="p-error">{errors.descripcion.message}</small>
            )}
          </div>

          <div className="col-12">
            <div className="field-checkbox">
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="activo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="activo" className="ml-2 text-900 font-medium">
                Activo
              </label>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={motivoAcceso?.id ? "Actualizar" : "Crear"}
            icon={motivoAcceso?.id ? "pi pi-check" : "pi pi-plus"}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default MotivoAccesoForm;
