/**
 * DocumentoRequeridoPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para PDFs de documentos requeridos en cotizaciones.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const DocumentoRequeridoPDFCard = ({
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
      moduleName="documento-requerido"
      fieldName="urlDocPdf"
      title="Documento Requerido PDF"
      dialogTitle="Subir Documento Requerido"
      uploadButtonLabel="Capturar/Subir Documento"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay documento cargado"
      emptyDescription="Use el botón 'Capturar/Subir Documento' para agregar el documento requerido. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default DocumentoRequeridoPDFCard;