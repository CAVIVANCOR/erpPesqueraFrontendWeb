/**
 * PdfFotosAntesPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para fotos antes de tareas OT.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfFotosAntesPDFCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  return (
    <PDFDocumentManager
      moduleName="det-tareas-ot-fotos"
      fieldName="urlFotosAntesPdf"
      title="Fotos Antes (PDF)"
      dialogTitle="Subir Fotos Antes"
      uploadButtonLabel="Capturar/Subir Fotos"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay fotos antes cargadas"
      emptyDescription="Use el botón 'Capturar/Subir Fotos' para agregar fotos del estado antes de la tarea. Puede subir múltiples archivos y se consolidarán automáticamente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
    />
  );
};

export default PdfFotosAntesPDFCard;