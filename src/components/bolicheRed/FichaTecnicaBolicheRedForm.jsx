/**
 * FichaTecnicaBolicheRedForm.jsx - MIGRADO A PDF V2
 *
 * Componente Card para gestionar la ficha técnica de un boliche red.
 * Usa el sistema PDF V2 con PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import BolicheRedPDFCard from "./BolicheRedPDFCard";

/**
 * Componente FichaTecnicaBolicheRedForm
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto (incluye id del boliche red)
 * @param {boolean} props.readOnly - Si el formulario es de solo lectura
 */
export default function FichaTecnicaBolicheRedForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) {
  return (
    <BolicheRedPDFCard
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
    />
  );
}