/**
 * Componente para gestión del Permiso de Pesca
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function PermisoPescaForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues
}) {
  return (
    <CertificadoEmbarcacionForm
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      fieldName="urlPermisoPesca"
      certificateType="permiso-pesca"
      title="Permiso de Pesca"
      description="Gestión del permiso de pesca de la embarcación"
      icon="pi pi-bookmark"
    />
  );
}
