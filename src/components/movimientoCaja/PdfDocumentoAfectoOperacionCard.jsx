/**
 * PdfDocumentoAfectoOperacionCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para documentos afectos en movimientos de caja.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const PdfDocumentoAfectoOperacionCard = ({
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
      moduleName="movimiento-caja-comprobante" // ✅ CORRECTO
      fieldName="urlDocumentoMovCaja"
      entityId={movimientoId}
      title="Documento Afecto (Factura, Boleta, etc.)"
      dialogTitle="Subir Documento Afecto"
      uploadButtonLabel="Capturar/Subir Documento"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay documento afecto cargado"
      emptyDescription="Use el botón 'Capturar/Subir Documento' para agregar la factura, boleta u otro documento afecto. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfDocumentoAfectoOperacionCard;
