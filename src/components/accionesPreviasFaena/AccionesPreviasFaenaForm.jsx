// src/components/accionesPreviasFaena/AccionesPreviasFaenaForm.jsx
// Formulario profesional para AccionesPreviasFaena. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ToggleButton } from "primereact/togglebutton";
import { ButtonGroup } from "primereact/buttongroup";
import { Controller, useForm } from "react-hook-form";

export default function AccionesPreviasFaenaForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      nombre: defaultValues.nombre || "",
      descripcion: defaultValues.descripcion || "",
      paraPescaIndustrial: defaultValues.paraPescaIndustrial || false,
      paraPescaConsumo: defaultValues.paraPescaConsumo || false,
      activo: defaultValues.activo !== undefined ? defaultValues.activo : true,
    },
  });

  React.useEffect(() => {
    reset({
      nombre: defaultValues.nombre || "",
      descripcion: defaultValues.descripcion || "",
      paraPescaIndustrial: defaultValues.paraPescaIndustrial || false,
      paraPescaConsumo: defaultValues.paraPescaConsumo || false,
      activo: defaultValues.activo !== undefined ? defaultValues.activo : true,
    });
  }, [defaultValues, reset]);

  const onSubmitForm = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="p-fluid">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="nombre">Nombre*</label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                required
                disabled={readOnly || loading}
                maxLength={100}
              />
            )}
          />
           <label htmlFor="descripcion">Descripción</label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="descripcion"
                value={field.value}
                rows={6}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={readOnly || loading}
              />
            )}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
          gap: 20,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <ButtonGroup style={{ gap: 2, alignItems: "center"}}>
          <Controller
            name="paraPescaIndustrial"
            control={control}
            render={({ field }) => (
              <ToggleButton
                id="paraPescaIndustrial"
                onLabel="INDUSTRIAL"
                offLabel="INDUSTRIAL"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                checked={field.value}
                onChange={(e) => field.onChange(e.value)}
                disabled={readOnly || loading}
                className={field.value ? "p-button-success" : "p-button-secondary"}
              />
            )}
          />
          <Controller
            name="paraPescaConsumo"
            control={control}
            render={({ field }) => (
              <ToggleButton
                id="paraPescaConsumo"
                onLabel="CONSUMO"
                offLabel="CONSUMO"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                checked={field.value}
                onChange={(e) => field.onChange(e.value)}
                disabled={readOnly || loading}
                className={field.value ? "p-button-warning" : "p-button-secondary"}
              />
            )}
          />
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <ToggleButton
                id="activo"
                onLabel="ACTIVO"
                offLabel="ACTIVO"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                checked={field.value}
                onChange={(e) => field.onChange(e.value)}
                disabled={readOnly || loading}
                className={field.value ? "p-button-info" : "p-button-secondary"}
              />
            )}
          />
        </ButtonGroup>
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          size="small"
          outlined
          raised
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          className="p-button-success"
          size="small"
          outlined
          raised
          loading={loading}
          disabled={readOnly || loading}
        />
      </div>
    </form>
  );
}
