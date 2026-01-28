/**
 * PdfCotizacionUnoPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para cotización uno de tareas OT.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfCotizacionUnoPDFCard = ({
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
      moduleName="det-tareas-ot-cotizacion-uno"
      fieldName="urlCotizacionUnoPdf"
      title="Cotización Uno (PDF)"
      dialogTitle="Subir Cotización Uno"
      uploadButtonLabel="Capturar/Subir Cotización"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay cotización uno cargada"
      emptyDescription="Use el botón 'Capturar/Subir Cotización' para agregar la primera cotización de la tarea. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfCotizacionUnoPDFCard;