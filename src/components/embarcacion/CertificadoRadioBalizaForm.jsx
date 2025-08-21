/**
 * Componente para gestión del Certificado de Radio Baliza
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoRadioBalizaForm({
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
      fieldName="urlCertificadoRadioBaliza"
      certificateType="radio-baliza"
      title="Certificado de Radio Baliza"
      description="Gestión del certificado de radio baliza de la embarcación"
      icon="pi pi-wifi"
    />
  );
}
