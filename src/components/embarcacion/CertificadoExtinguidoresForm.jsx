/**
 * Componente para gestión del Certificado de Extinguidores
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoExtinguidoresForm({
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
      fieldName="urlCertificadoExtinguidores"
      certificateType="extinguidores"
      title="Certificado de Extinguidores"
      description="Gestión del certificado de extinguidores de la embarcación"
      icon="pi pi-bolt"
    />
  );
}
