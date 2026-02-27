/**
 * PdfComprobanteOperacionCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de operación en movimientos de caja.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfComprobanteOperacionCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  movimientoId,
  readOnly = false,
}) => {
  return (
    <PDFDocumentManager
      moduleName="movimiento-caja-operacion"
      fieldName="urlComprobanteOperacionMovCaja"
      entityId={movimientoId}
      title="Comprobante de Operación (Voucher, Recibo, etc.)"
      dialogTitle="Subir Comprobante de Operación"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante de operación cargado"
      emptyDescription="Use el botón 'Capturar/Subir Comprobante' para agregar el voucher, recibo u otro comprobante. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfComprobanteOperacionCard;