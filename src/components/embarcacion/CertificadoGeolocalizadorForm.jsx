/**
 * Componente para gestión del Certificado de Geolocalizador
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import CertificadoEmbarcacionForm from "./CertificadoEmbarcacionForm";

export default function CertificadoGeolocalizadorForm({
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
      fieldName="urlCertificadogeolocalizador"
      certificateType="geolocalizador"
      title="Certificado de Geolocalizador"
      description="Gestión del certificado de geolocalizador de la embarcación"
      icon="pi pi-map-marker"
    />
  );
}
