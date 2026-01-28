/**
 * PdfDetMovEntregaRendirMovAlmacenCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de movimientos en Movimiento Almacén.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfDetMovEntregaRendirMovAlmacenCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  // ✅ Obtener el entityId desde watch
  const entityId = watch("id");

  return (
    <PDFDocumentManager
      moduleName="det-movs-entrega-rendir-mov-almacen-comprobante"
      fieldName="urlComprobanteMovimiento"
      entityId={entityId}
      title="Comprobante PDF del Movimiento"
      dialogTitle="Subir Comprobante del Movimiento"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante del movimiento cargado"
      emptyDescription="Use el botón 'Capturar/Subir Comprobante' para agregar el comprobante del movimiento de entrega a rendir. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfDetMovEntregaRendirMovAlmacenCard;
