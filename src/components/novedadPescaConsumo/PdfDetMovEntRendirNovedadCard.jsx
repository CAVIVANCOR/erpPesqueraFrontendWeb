/**
 * PdfDetMovEntRendirNovedadCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de movimientos en Novedad Pesca Consumo.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfDetMovEntRendirNovedadCard = ({
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
      moduleName="det-movs-entrega-rendir-pesca-consumo-comprobante"
      fieldName="urlComprobanteMovimiento"
      entityId={detMovId}
      title="Comprobante de Movimiento"
      dialogTitle="Subir Comprobante de Movimiento"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante cargado"
      emptyDescription="Use el botón 'Capturar/Subir Comprobante' para agregar el comprobante del movimiento (factura, boleta, recibo). Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfDetMovEntRendirNovedadCard;