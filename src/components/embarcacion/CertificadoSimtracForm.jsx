/**
 * Componente para gestión del Certificado SIMTRAC
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoSimtracForm({
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
      fieldName="urlCertificadoSimtrac"
      certificateType="simtrac"
      title="Certificado SIMTRAC"
      description="Gestión del certificado SIMTRAC de la embarcación"
      icon="pi pi-sitemap"
    />
  );
}
