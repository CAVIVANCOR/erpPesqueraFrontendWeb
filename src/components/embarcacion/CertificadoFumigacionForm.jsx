/**
 * Componente para gestión del Certificado de Fumigación
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoFumigacionForm({
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
      fieldName="urlCertificadoFumigacion"
      certificateType="fumigacion"
      title="Certificado de Fumigación"
      description="Gestión del certificado de fumigación de la embarcación"
      icon="pi pi-cloud"
    />
  );
}
