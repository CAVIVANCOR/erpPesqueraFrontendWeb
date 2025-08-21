/**
 * Componente para gestión del Certificado Sanitario SANIPES
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoSanitarioSanipesForm({
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
      fieldName="urlCertificadoSanitarioSanipes"
      certificateType="sanitario-sanipes"
      title="Certificado Sanitario SANIPES"
      description="Gestión del certificado sanitario SANIPES de la embarcación"
      icon="pi pi-heart"
    />
  );
}
