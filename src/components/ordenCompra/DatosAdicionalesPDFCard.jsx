/**
 * DatosAdicionalesPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para PDFs de datos adicionales en órdenes de compra.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const DatosAdicionalesPDFCard = ({
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
      moduleName="datos-adicionales-oc"
      fieldName="urlDocumento"
      title="Documento Adjunto"
      dialogTitle="Subir Documento"
      uploadButtonLabel="Capturar/Subir Documento"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay documento cargado"
      emptyDescription="Use el botón 'Capturar/Subir Documento' para agregar documentos adicionales a la orden de compra. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default DatosAdicionalesPDFCard;