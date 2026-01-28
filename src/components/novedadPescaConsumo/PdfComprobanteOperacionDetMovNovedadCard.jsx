/**
 * PdfComprobanteOperacionDetMovNovedadCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de operación en Novedad Pesca Consumo.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfComprobanteOperacionDetMovNovedadCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  detMovId,
  readOnly = false,
}) => {
  return (
    <PDFDocumentManager
      moduleName="det-movs-entrega-rendir-pesca-consumo-operacion"
      fieldName="urlComprobanteOperacionMovCaja"
      entityId={detMovId}
      title="Comprobante de Operación (MovimientoCaja)"
      dialogTitle="Subir Comprobante de Operación"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante de operación cargado"
      emptyDescription="Este comprobante se copia automáticamente desde el Movimiento de Caja cuando se valida la operación, pero también puede ser capturado/subido manualmente (voucher, depósito). Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfComprobanteOperacionDetMovNovedadCard;