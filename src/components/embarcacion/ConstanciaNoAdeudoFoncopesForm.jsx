/**
 * Componente para gestión de la Constancia de No Adeudo FONCOPES
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function ConstanciaNoAdeudoFoncopesForm({
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
      fieldName="urlConstanciaNoAdeudoFoncopes"
      certificateType="no-adeudo-foncopes"
      title="Constancia de No Adeudo FONCOPES"
      description="Gestión de la constancia de no adeudo FONCOPES de la embarcación"
      icon="pi pi-check-circle"
    />
  );
}
