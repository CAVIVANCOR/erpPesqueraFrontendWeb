// src/components/detAccionesPreviasFaenaConsumo/DetAccionesPreviasFaenaConsumoForm.jsx
// Formulario profesional para DetAccionesPreviasFaenaConsumo. Cumple la regla transversal ERP Megui.
import React, { useState } from "react";
import { Button } from "primereact/button";
import { useForm } from "react-hook-form";
import DatosGeneralesDetAccionPreviaConsumoCard from "./DatosGeneralesDetAccionPreviaConsumoCard.jsx";
import ConfirmacionAccionPreviaConsumoPDFCard from "./ConfirmacionAccionPreviaConsumoPDFCard";

export default function DetAccionesPreviasFaenaConsumoForm({
  isEdit,
  defaultValues,
  faenas,
  acciones,
  personal = [],
  onSubmit,
  onCancel,
  loading,
  toast,
}) {
  const [currentCard, setCurrentCard] = useState(0);
  const totalCards = 2;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      faenaPescaConsumoId: defaultValues.faenaPescaConsumoId ? Number(defaultValues.faenaPescaConsumoId) : null,
      accionPreviaId: defaultValues.accionPreviaId ? Number(defaultValues.accionPreviaId) : null,
      responsableId: defaultValues.responsableId ? Number(defaultValues.responsableId) : null,
      verificadorId: defaultValues.verificadorId ? Number(defaultValues.verificadorId) : null,
      fechaVerificacion: defaultValues.fechaVerificacion
        ? new Date(defaultValues.fechaVerificacion)
        : null,
      cumplida:
        defaultValues.cumplida !== undefined ? !!defaultValues.cumplida : false,
      fechaCumplida: defaultValues.fechaCumplida
        ? new Date(defaultValues.fechaCumplida)
        : null,
      urlConfirmaAccionPdf: defaultValues.urlConfirmaAccionPdf || "",
      observaciones: defaultValues.observaciones || "",
      verificado:
        defaultValues.verificado !== undefined
          ? !!defaultValues.verificado
          : false,
    },
  });

  React.useEffect(() => {
    const normalizedValues = {
      ...defaultValues,
      faenaPescaConsumoId: defaultValues.faenaPescaConsumoId ? Number(defaultValues.faenaPescaConsumoId) : null,
      accionPreviaId: defaultValues.accionPreviaId ? Number(defaultValues.accionPreviaId) : null,
      responsableId: defaultValues.responsableId ? Number(defaultValues.responsableId) : null,
      verificadorId: defaultValues.verificadorId ? Number(defaultValues.verificadorId) : null,
      fechaVerificacion: defaultValues.fechaVerificacion
        ? new Date(defaultValues.fechaVerificacion)
        : null,
      fechaCumplida: defaultValues.fechaCumplida
        ? new Date(defaultValues.fechaCumplida)
        : null,
    };
    reset(normalizedValues);
  }, [defaultValues, reset]);

  const handleSubmitForm = (data) => {
    onSubmit({
      faenaPescaConsumoId: data.faenaPescaConsumoId ? Number(data.faenaPescaConsumoId) : null,
      accionPreviaId: data.accionPreviaId ? Number(data.accionPreviaId) : null,
      responsableId: data.responsableId ? Number(data.responsableId) : null,
      verificadorId: data.verificadorId ? Number(data.verificadorId) : null,
      fechaVerificacion: data.fechaVerificacion,
      cumplida: data.cumplida,
      fechaCumplida: data.fechaCumplida,
      urlConfirmaAccionPdf: data.urlConfirmaAccionPdf,
      observaciones: data.observaciones,
      verificado: data.verificado,
    });
  };

  const renderCurrentCard = () => {
    switch (currentCard) {
      case 0:
        return (
          <DatosGeneralesDetAccionPreviaConsumoCard
            control={control}
            acciones={acciones}
            personal={personal}
            loading={loading}
          />
        );
      case 1:
        return (
          <ConfirmacionAccionPreviaConsumoPDFCard
            control={control}
            loading={loading}
            setValue={setValue}
            watch={watch}
            toast={toast}
            accionPreviaId={watch("accionPreviaId")}
            faenaPescaConsumoId={watch("faenaPescaConsumoId")}
            detAccionesPreviasFaenaConsumoId={defaultValues?.id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="p-fluid">
      {renderCurrentCard()}
      
      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginTop: 5,
        }}
      >
        {/* Navegación por Cards - Solo iconos */}
        <div style={{ display: "flex", gap: 4 }}>
          <Button
            type="button"
            icon="pi pi-angle-left"
            label="Datos Generales"
            onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
            disabled={currentCard === 0}
            size="small"
            outlined
            tooltip="Datos Generales"
            tooltipOptions={{ position: "bottom" }}
          />
          <Button
            type="button"
            icon="pi pi-angle-right"
            label="Captura Evidencia (Fotos)"
            onClick={() => setCurrentCard(Math.min(totalCards - 1, currentCard + 1))}
            disabled={currentCard === totalCards - 1}
            size="small"
            outlined
            tooltip="Captura Evidencia (Fotos) y Generación PDF"
            tooltipOptions={{ position: "bottom" }}
          />
        </div>

        {/* Indicador de Card actual */}
        <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>
          {currentCard + 1} de {totalCards}
        </div>

        {/* Botones principales */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="button"
            label="Cancelar"
            className="p-button-text"
            onClick={onCancel}
            disabled={loading}
            severity="danger"
            raised
            outlined
            size="small"
          />
          <Button
            type="button"
            label={isEdit ? "Actualizar" : "Crear"}
            icon="pi pi-save"
            loading={loading}
            onClick={handleSubmit(handleSubmitForm)}
            severity="success"
            raised
            outlined
            size="small"
          />
        </div>
      </div>
    </form>
  );
}