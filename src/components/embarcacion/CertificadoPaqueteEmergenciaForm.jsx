/**
 * Componente para gestión del Certificado de Paquete de Emergencia
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoPaqueteEmergenciaForm({
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
      fieldName="urlCertificadoPaqueteEmergencia"
      certificateType="paquete-emergencia"
      title="Certificado de Paquete de Emergencia"
      description="Gestión del certificado de paquete de emergencia de la embarcación"
      icon="pi pi-exclamation-triangle"
    />
  );
}
