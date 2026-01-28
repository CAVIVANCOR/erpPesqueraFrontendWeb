/**
 * PdfComprobanteOperacionDetMovContratoCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de operación de movimiento de caja en contratos de servicios.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfComprobanteOperacionDetMovContratoCard = ({
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
      moduleName="contrato-servicio-movimiento"
      fieldName="urlComprobanteOperacionMovCaja"
      title="Comprobante de Operación (Voucher, Recibo, etc.)"
      dialogTitle="Subir Comprobante de Operación"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante de operación cargado"
      emptyDescription="Este comprobante se copia automáticamente desde el Movimiento de Caja cuando se valida la operación, pero también puede ser capturado/subido manualmente. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfComprobanteOperacionDetMovContratoCard;