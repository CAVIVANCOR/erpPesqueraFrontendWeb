/**
 * Componente para gestión del Certificado de Aguas Sucias
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoAguasSuciasForm({
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
      fieldName="urlCertificadoAguasSucias"
      certificateType="aguas-sucias"
      title="Certificado de Aguas Sucias"
      description="Gestión del certificado de aguas sucias de la embarcación"
      icon="pi pi-filter"
    />
  );
}
