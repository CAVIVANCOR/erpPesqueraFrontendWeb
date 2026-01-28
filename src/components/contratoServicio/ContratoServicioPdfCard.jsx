/**
 * ContratoServicioPdfCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para PDFs de contratos de servicio.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const ContratoServicioPdfCard = ({
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
      moduleName="contrato-servicio"
      fieldName="urlContratoPdf"
      title="Documento PDF del Contrato"
      dialogTitle="Subir Contrato PDF"
      uploadButtonLabel="Capturar/Subir Contrato"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay contrato PDF cargado"
      emptyDescription="Use el botón 'Capturar/Subir Contrato' para agregar el documento del contrato de servicio. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default ContratoServicioPdfCard;