/**
 * Componente para gestión del Certificado de Seguridad
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoSeguridadForm({
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
      fieldName="urlCertificadoSeguridad"
      certificateType="seguridad"
      title="Certificado de Seguridad"
      description="Gestión del certificado de seguridad de la embarcación"
      icon="pi pi-lock"
    />
  );
}
