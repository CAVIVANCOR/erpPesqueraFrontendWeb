/**
 * DocumentoVisitantePDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para documentos de visitantes en accesos.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const DocumentoVisitantePDFCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  const accesoId = watch('id') || defaultValues.id;

  return (
    <PDFDocumentManager
      moduleName="acceso-instalacion"
      fieldName="urlDocumentoVisitante"
      title="Documentos Adjuntos del Visitante"
      dialogTitle="Subir Documentos del Visitante"
      uploadButtonLabel="Capturar/Subir Documentos"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay documentos del visitante cargados"
      emptyDescription="Use el botón 'Capturar/Subir Documentos' para agregar documentación del visitante (Guías, Facturas, Files, etc.). Puede subir múltiples archivos y se consolidarán automáticamente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      entityId={accesoId}
      readOnly={readOnly}
    />
  );
};

export default DocumentoVisitantePDFCard;