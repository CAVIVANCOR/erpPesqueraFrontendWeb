/**
 * Componente para gestión del Certificado de Balsas Salvavidas
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoBalsasSalvavidasForm({
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
      fieldName="urlCertificadoBalsasSalvavidas"
      certificateType="balsas-salvavidas"
      title="Certificado de Balsas Salvavidas"
      description="Gestión del certificado de balsas salvavidas de la embarcación"
      icon="pi pi-shield"
    />
  );
}
