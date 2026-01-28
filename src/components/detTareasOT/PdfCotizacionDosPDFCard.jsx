/**
 * PdfCotizacionDosPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para cotización dos de tareas OT.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfCotizacionDosPDFCard = ({
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
      moduleName="det-tareas-ot-cotizacion-dos"
      fieldName="urlCotizacionDosPdf"
      title="Cotización Dos (PDF)"
      dialogTitle="Subir Cotización Dos"
      uploadButtonLabel="Capturar/Subir Cotización"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay cotización dos cargada"
      emptyDescription="Use el botón 'Capturar/Subir Cotización' para agregar la segunda cotización de la tarea. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfCotizacionDosPDFCard;