// src/components/videoconferencia/VideoconferenciaForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import DatosGeneralesTab from "./DatosGeneralesTab";

export default function VideoconferenciaForm({
  isEdit,
  defaultValues,
  personalOptions,
  onSubmit,
  onCancel,
  loading,
  toast,
  permisos = {},
}) {
  const [formData, setFormData] = useState({
    titulo: defaultValues?.titulo || "",
    descripcion: defaultValues?.descripcion || "",
    fechaInicio: defaultValues?.fechaInicio ? new Date(defaultValues.fechaInicio) : new Date(),
    duracionMinutos: defaultValues?.duracionMinutos || 60,
    organizadorId: defaultValues?.organizadorId ? Number(defaultValues.organizadorId) : null,
    salaId: defaultValues?.salaId || "",
  });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        titulo: defaultValues?.titulo || "",
        descripcion: defaultValues?.descripcion || "",
        fechaInicio: defaultValues?.fechaInicio ? new Date(defaultValues.fechaInicio) : new Date(),
        duracionMinutos: defaultValues?.duracionMinutos || 60,
        organizadorId: defaultValues?.organizadorId ? Number(defaultValues.organizadorId) : null,
        salaId: defaultValues?.salaId || "",
      });
    }
  }, [defaultValues]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const camposFaltantes = [];

    if (!formData.titulo || formData.titulo.trim() === "") {
      camposFaltantes.push("Título");
    }
    if (!formData.fechaInicio) {
      camposFaltantes.push("Fecha de Inicio");
    }
    if (!formData.duracionMinutos || formData.duracionMinutos <= 0) {
      camposFaltantes.push("Duración");
    }
    if (!formData.organizadorId) {
      camposFaltantes.push("Organizador");
    }

    if (camposFaltantes.length > 0) {
      toast.current.show({
        severity: "warn",
        summary: "Campos Obligatorios",
        detail: `Usted debe ingresar estos campos: ${camposFaltantes.join(", ")} que son obligatorios.`,
        life: 5000,
      });
      return;
    }

    const dataToSubmit = {
      ...formData,
      titulo: formData.titulo.trim().toUpperCase(),
      descripcion: formData.descripcion ? formData.descripcion.trim().toUpperCase() : null,
    };

    onSubmit(dataToSubmit);
  };

  const puedeEditar = !isEdit || (isEdit && permisos.puedeEditar);

  const personalOptionsFormatted = personalOptions.map((p) => ({
    ...p,
    id: Number(p.id),
    label: p.nombreCompleto || `${p.nombres} ${p.apellidoPaterno || ""}`.trim(),
    value: Number(p.id),
  }));

  return (
    <div className="p-fluid">
      <DatosGeneralesTab
        formData={formData}
        onChange={handleChange}
        personalOptions={personalOptionsFormatted}
        isEdit={isEdit}
        puedeEditar={puedeEditar}
        videoconferenciaId={defaultValues?.id}
        toast={toast}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: 18,
          gap: 8,
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-save"
          onClick={handleSubmit}
          disabled={loading || !puedeEditar}
          tooltip={!puedeEditar ? "No tiene permisos para editar" : ""}
        />
      </div>
    </div>
  );
}
