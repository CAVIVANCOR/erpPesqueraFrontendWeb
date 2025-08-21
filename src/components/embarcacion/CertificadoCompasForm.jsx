/**
 * Componente para gestión del Certificado de Compás
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoCompasForm({
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
      fieldName="urlCertificadoCompas"
      certificateType="compas"
      title="Certificado de Compás"
      description="Gestión del certificado de compás de la embarcación"
      icon="pi pi-directions"
    />
  );
}
