// src/components/producto/FichaTecnicaProductoForm.jsx
import React from "react";
import ProductoPDFCard from "./ProductoPDFCard";

export default function FichaTecnicaProductoForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
  productoId,
}) {
  return (
    <ProductoPDFCard
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
      productoId={productoId}
    />
  );
}