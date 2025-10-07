/**
 * TripulanteFaenaConsumoForm.jsx
 *
 * Formulario para ver detalles de tripulante de faena consumo.
 * Solo permite editar las observaciones, los demás campos son de solo lectura.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { classNames } from "primereact/utils";
import { getResponsiveFontSize } from "../../utils/utils";

const TripulanteFaenaConsumoForm = ({
  tripulante = null,
  personal = [],
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isViewing = !!tripulante;

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      nombres: "",
      apellidos: "",
      cargoId: "",
      observaciones: "",
    },
  });

  // Cargar datos del tripulante en el formulario
  useEffect(() => {
    if (isViewing && tripulante) {
      reset({
        nombres: tripulante.nombres || "",
        apellidos: tripulante.apellidos || "",
        cargoId: tripulante.cargoId || "",
        observaciones: tripulante.observaciones || "",
      });
    }
  }, [tripulante, isViewing, reset]);

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      // Solo enviar las observaciones (único campo editable)
      const datosActualizados = {
        observaciones: data.observaciones || null,
      };

      if (onGuardadoExitoso) {
        await onGuardadoExitoso(datosActualizados);
      }
    } catch (error) {
      console.error("Error en el formulario:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar el formulario",
        life: 3000,
      });
    }
  };

  // Obtener información del cargo
  const getCargoInfo = (cargoId) => {
    const cargoMap = {
      14: { label: "Motorista Embarcación", severity: "info" },
      21: { label: "Tripulante Embarcación", severity: "success" },
      22: { label: "Patrón Embarcación", severity: "warning" }
    };
    
    return cargoMap[cargoId] || { label: "Sin Cargo", severity: "secondary" };
  };

  const cargoInfo = getCargoInfo(tripulante?.cargoId);

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Información del Tripulante (Solo Lectura) */}
        <div className="mb-4 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
          <h6 className="mb-3" style={{ color: "#495057", fontSize: getResponsiveFontSize() }}>
            Información del Tripulante
          </h6>
          
          <div
            style={{
              display: "flex",
              gap: 15,
              marginBottom: "1rem",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Nombres */}
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Nombres
              </label>
              <Controller
                name="nombres"
                control={control}
                render={({ field }) => (
                  <InputText
                    {...field}
                    value={field.value}
                    readOnly
                    className="p-inputtext-sm"
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                )}
              />
            </div>

            {/* Apellidos */}
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Apellidos
              </label>
              <Controller
                name="apellidos"
                control={control}
                render={({ field }) => (
                  <InputText
                    {...field}
                    value={field.value}
                    readOnly
                    className="p-inputtext-sm"
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                )}
              />
            </div>
          </div>

          {/* Cargo */}
          <div style={{ marginBottom: "1rem" }}>
            <label className="block text-900 font-medium mb-2">
              Cargo
            </label>
            <Tag 
              value={cargoInfo.label} 
              severity={cargoInfo.severity}
              style={{ fontSize: getResponsiveFontSize() }}
            />
          </div>

          {/* Fechas de registro */}
          <div
            style={{
              display: "flex",
              gap: 15,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Fecha de Registro
              </label>
              <InputText
                value={
                  tripulante?.createdAt
                    ? new Date(tripulante.createdAt).toLocaleString("es-PE")
                    : ""
                }
                readOnly
                className="p-inputtext-sm"
                style={{ backgroundColor: "#f8f9fa" }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Última Actualización
              </label>
              <InputText
                value={
                  tripulante?.updatedAt
                    ? new Date(tripulante.updatedAt).toLocaleString("es-PE")
                    : ""
                }
                readOnly
                className="p-inputtext-sm"
                style={{ backgroundColor: "#f8f9fa" }}
              />
            </div>
          </div>
        </div>

        {/* Observaciones (Campo Editable) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="observaciones"
            className="block text-900 font-medium mb-2"
          >
            Observaciones
          </label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                {...field}
                value={field.value || ""}
                rows={4}
                placeholder="Ingrese observaciones sobre el tripulante..."
                className={classNames({
                  "p-invalid": errors.observaciones,
                })}
                style={{ fontSize: getResponsiveFontSize() }}
              />
            )}
          />
          {errors.observaciones && (
            <Message severity="error" text={errors.observaciones.message} />
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-outlined"
            onClick={onCancelar}
            size="small"
          />
          <Button
            type="submit"
            label="Guardar Observaciones"
            icon="pi pi-check"
            size="small"
          />
        </div>
      </form>
    </div>
  );
};

export default TripulanteFaenaConsumoForm;