/**
 * BolicheRedPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para ficha técnica PDF de boliche red.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const BolicheRedPDFCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  const bolicheRedId = watch('id') || defaultValues.id;

  return (
    <PDFDocumentManager
      moduleName="boliche-red"
      fieldName="urlBolicheRedPdf"
      title="Ficha Técnica Boliche Red (PDF)"
      dialogTitle="Subir Ficha Técnica"
      uploadButtonLabel="Capturar/Subir Ficha Técnica"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay ficha técnica cargada"
      emptyDescription="Use el botón 'Capturar/Subir Ficha Técnica' para agregar la ficha técnica del boliche red. Puede subir múltiples archivos y se consolidarán automáticamente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      entityId={bolicheRedId}
      readOnly={readOnly}
    />
  );
};

export default BolicheRedPDFCard;