/**
 * Componente para gestión del Certificado de Hidrocarburos
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoHidroCarburosForm({
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
      fieldName="urlCertificadoHidroCarburos"
      certificateType="hidrocarburos"
      title="Certificado de Hidrocarburos"
      description="Gestión del certificado de hidrocarburos de la embarcación"
      icon="pi pi-circle-fill"
    />
  );
}
