/**
 * Componente para gestión del Certificado de Franco Bordo
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoFrancoBordoForm({
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
      fieldName="urlCertificadoFrancoBordo"
      certificateType="franco-bordo"
      title="Certificado de Franco Bordo"
      description="Gestión del certificado de franco bordo de la embarcación"
      icon="pi pi-compass"
    />
  );
}
