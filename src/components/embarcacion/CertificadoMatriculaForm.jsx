/**
 * Componente para gestión del Certificado de Matrícula
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoMatriculaForm({
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
      fieldName="urlCertificadoMatricula"
      certificateType="matricula"
      title="Certificado de Matrícula"
      description="Gestión del certificado de matrícula de la embarcación"
      icon="pi pi-id-card"
    />
  );
}
