/**
 * Componente para gestión del Certificado de Arqueo
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoArqueoForm({
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
      fieldName="urlCertificadoArqueo"
      certificateType="arqueo"
      title="Certificado de Arqueo"
      description="Gestión del certificado de arqueo de la embarcación"
      icon="pi pi-calculator"
    />
  );
}
