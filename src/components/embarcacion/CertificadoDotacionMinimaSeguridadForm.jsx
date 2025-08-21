/**
 * Componente para gestión del Certificado de Dotación Mínima de Seguridad
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoDotacionMinimaSeguridadForm({
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
      fieldName="urlCertificadosDotacionMinimaSeguridad"
      certificateType="dotacion-minima-seguridad"
      title="Certificado de Dotación Mínima de Seguridad"
      description="Gestión del certificado de dotación mínima de seguridad de la embarcación"
      icon="pi pi-shield"
    />
  );
}
