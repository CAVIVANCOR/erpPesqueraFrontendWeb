/**
 * PdfComprobanteProveedorCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes del proveedor en Orden de Compra.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente PdfComprobanteProveedorCard
 * Wrapper que configura PDFDocumentManager para comprobantes del proveedor
 *
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {number|string} props.ordenCompraId - ID de la orden de compra (OBLIGATORIO)
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfComprobanteProveedorCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  ordenCompraId,
  readOnly = false,
}) => {
  return (
    <PDFDocumentManager
      moduleName="orden-compra-comprobante-proveedor"
      fieldName="urlDocumentoRef"
      entityId={ordenCompraId}
      title="Comprobante del Proveedor"
      dialogTitle="Subir Comprobante del Proveedor"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante del proveedor cargado"
      emptyDescription="Suba el comprobante (factura, boleta, etc.) que el proveedor entregó por esta compra. Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfComprobanteProveedorCard;